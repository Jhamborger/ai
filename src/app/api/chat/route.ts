import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { streamGemmaCompletion } from "@/lib/gemma/client";
import { retrieveRelevantMemories, createMemoryFromContent } from "@/lib/memory/retrieval";
import {
  BASE_SYSTEM_PROMPT,
  WORKSPACE_SYSTEM_PROMPT,
  TITLE_GENERATION_PROMPT,
  buildMemoryContext,
  buildProjectContext,
} from "@/lib/ai/prompts";
import { parseProjectOutput } from "@/lib/ai/project-parser";
import { getSettings } from "@/lib/settings";
import { chatRequestSchema } from "@/lib/validations";
import { checkRateLimit, handleApiError, apiError } from "@/lib/api-utils";
import { generateGemmaCompletion } from "@/lib/gemma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(request.headers.get("x-forwarded-for") ?? "local")) {
      return apiError("Rate limit exceeded", 429);
    }

    const body = chatRequestSchema.parse(await request.json());
    const settings = await getSettings();

    let conversationId = body.conversationId;
    let conversation = conversationId
      ? await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { title: "New Chat" },
        include: { messages: true },
      });
      conversationId = conversation.id;
    }

    if (!body.regenerate) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: body.message,
        },
      });
    }

    const memories = await retrieveRelevantMemories(
      body.message,
      settings.memory.maxRetrieved
    );

    let projectContext = "";
    if (body.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: body.projectId },
        include: { files: true },
      });
      if (project) {
        projectContext = buildProjectContext(project.files);
      }
    }

    const isWorkspace = Boolean(body.projectId);
    const systemPrompt =
      (isWorkspace ? WORKSPACE_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT) +
      buildMemoryContext(memories) +
      projectContext;

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });

    const messagesForAI = body.regenerate
      ? history.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
      : history.map((m) => ({ role: m.role, content: m.content }));

    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        send({ type: "start", conversationId: conversation!.id });

        try {
          for await (const chunk of streamGemmaCompletion(
            messagesForAI,
            {
              temperature: body.settings?.temperature ?? settings.ai.temperature,
              maxOutputTokens: body.settings?.maxTokens ?? settings.ai.maxTokens,
              topP: body.settings?.topP ?? settings.ai.topP,
            },
            systemPrompt
          )) {
            fullContent += chunk;
            send({ type: "token", content: chunk });
          }

          const assistantMessage = await prisma.message.create({
            data: {
              conversationId: conversation!.id,
              role: "assistant",
              content: fullContent,
            },
          });

          await prisma.conversation.update({
            where: { id: conversation!.id },
            data: { updatedAt: new Date() },
          });

          const projectOutput = parseProjectOutput(fullContent);
          if (projectOutput && body.projectId) {
            for (const file of projectOutput.files) {
              await prisma.projectFile.upsert({
                where: {
                  projectId_path: {
                    projectId: body.projectId,
                    path: file.path,
                  },
                },
                create: {
                  projectId: body.projectId,
                  path: file.path,
                  content: file.content,
                },
                update: { content: file.content },
              });
            }
            await prisma.project.update({
              where: { id: body.projectId },
              data: { updatedAt: new Date() },
            });
          }

          const rememberMatch = body.message.match(
            /remember (?:that )?(.+)/i
          );
          if (rememberMatch && settings.memory.autoSave) {
            const memoryContent = rememberMatch[1].trim();
            await createMemoryFromContent(memoryContent, "preference", 7);
            send({ type: "memory_saved", content: memoryContent });
          }

          if (
            conversation!.messages.length === 0 &&
            conversation!.title === "New Chat"
          ) {
            try {
              const title = await generateGemmaCompletion(
                [{ role: "user", content: body.message }],
                { temperature: 0.3, maxOutputTokens: 32 },
                TITLE_GENERATION_PROMPT
              );
              const cleanTitle = title.replace(/["']/g, "").trim().slice(0, 60);
              await prisma.conversation.update({
                where: { id: conversation!.id },
                data: { title: cleanTitle || "New Chat" },
              });
              send({ type: "title", title: cleanTitle });
            } catch {
              // title generation is best-effort
            }
          }

          send({
            type: "done",
            messageId: assistantMessage.id,
            projectFiles: projectOutput?.files,
          });
        } catch (err) {
          send({
            type: "error",
            message: err instanceof Error ? err.message : "Stream failed",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
