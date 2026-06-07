import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { searchSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import type { SearchResult } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse({
      q: searchParams.get("q"),
      type: searchParams.get("type") ?? "all",
      limit: searchParams.get("limit") ?? 30,
    });

    const results: SearchResult[] = [];
    const limit = params.limit ?? 30;

    if (params.type === "all" || params.type === "conversations") {
      const conversations = await prisma.conversation.findMany({
        where: { title: { contains: params.q, mode: "insensitive" } },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      results.push(
        ...conversations.map((c) => ({
          type: "conversation" as const,
          id: c.id,
          title: c.title,
          snippet: c.title,
          url: `/chat?id=${c.id}`,
        }))
      );
    }

    if (params.type === "all" || params.type === "messages") {
      const messages = await prisma.message.findMany({
        where: { content: { contains: params.q, mode: "insensitive" } },
        take: limit,
        include: { conversation: true },
        orderBy: { createdAt: "desc" },
      });
      results.push(
        ...messages.map((m) => ({
          type: "message" as const,
          id: m.id,
          title: m.conversation.title,
          snippet: m.content.slice(0, 120),
          url: `/chat?id=${m.conversationId}`,
        }))
      );
    }

    if (params.type === "all" || params.type === "memories") {
      const memories = await prisma.memory.findMany({
        where: { content: { contains: params.q, mode: "insensitive" } },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      results.push(
        ...memories.map((m) => ({
          type: "memory" as const,
          id: m.id,
          title: m.category,
          snippet: m.content.slice(0, 120),
          url: `/memory`,
        }))
      );
    }

    if (params.type === "all" || params.type === "projects") {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      results.push(
        ...projects.map((p) => ({
          type: "project" as const,
          id: p.id,
          title: p.name,
          snippet: p.description ?? "",
          url: `/workspace/${p.id}`,
        }))
      );
    }

    if (params.type === "all" || params.type === "files") {
      const files = await prisma.projectFile.findMany({
        where: {
          OR: [
            { path: { contains: params.q, mode: "insensitive" } },
            { content: { contains: params.q, mode: "insensitive" } },
          ],
        },
        take: limit,
        include: { project: true },
      });
      results.push(
        ...files.map((f) => ({
          type: "file" as const,
          id: f.id,
          title: f.path,
          snippet: f.content.slice(0, 120),
          url: `/workspace/${f.projectId}`,
        }))
      );
    }

    return apiSuccess(results.slice(0, limit));
  } catch (error) {
    return handleApiError(error);
  }
}
