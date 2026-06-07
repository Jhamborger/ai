import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateMessageSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = updateMessageSchema.parse(await request.json());
    const message = await prisma.message.update({
      where: { id },
      data: { content: body.content },
    });
    return apiSuccess(message);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.message.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
