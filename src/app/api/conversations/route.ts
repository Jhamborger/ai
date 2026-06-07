import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createConversationSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const archived = searchParams.get("archived") === "true";

    const conversations = await prisma.conversation.findMany({
      where: {
        archived,
        ...(search
          ? { title: { contains: search, mode: "insensitive" } }
          : {}),
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      include: { _count: { select: { messages: true } } },
    });

    return apiSuccess(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createConversationSchema.parse(await request.json());
    const conversation = await prisma.conversation.create({
      data: { title: body.title ?? "New Chat" },
    });
    return apiSuccess(conversation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
