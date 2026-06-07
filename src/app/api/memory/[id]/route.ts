import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateMemorySchema } from "@/lib/validations";
import { extractKeywords } from "@/lib/memory/retrieval";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = updateMemorySchema.parse(await request.json());
    const memory = await prisma.memory.update({
      where: { id },
      data: {
        ...body,
        ...(body.content ? { keywords: extractKeywords(body.content) } : {}),
      },
    });
    return apiSuccess(memory);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.memory.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
