import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { memorySchema } from "@/lib/validations";
import { searchMemories } from "@/lib/memory/retrieval";
import { extractKeywords } from "@/lib/memory/retrieval";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category") as
      | "preference"
      | "coding"
      | "project"
      | "personal"
      | "custom"
      | null;
    const pinned = searchParams.get("pinned");

    const memories = await searchMemories(q, {
      category: category ?? undefined,
      pinned: pinned === "true" ? true : pinned === "false" ? false : undefined,
    });

    return apiSuccess(memories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = memorySchema.parse(await request.json());
    const memory = await prisma.memory.create({
      data: {
        content: body.content,
        category: body.category ?? "custom",
        importance: body.importance ?? 5,
        pinned: body.pinned ?? false,
        keywords: extractKeywords(body.content),
      },
    });
    return apiSuccess(memory, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
