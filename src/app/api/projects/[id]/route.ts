import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validations";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { files: { orderBy: { path: "asc" } } },
    });
    if (!project) return apiError("Project not found", 404);
    return apiSuccess(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = updateProjectSchema.parse(await request.json());
    const project = await prisma.project.update({
      where: { id },
      data: body,
    });
    return apiSuccess(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { action } = (await request.json()) as { action: string };

    if (action === "duplicate") {
      const original = await prisma.project.findUnique({
        where: { id },
        include: { files: true },
      });
      if (!original) return apiError("Project not found", 404);

      const duplicate = await prisma.project.create({
        data: {
          name: `${original.name} (Copy)`,
          description: original.description,
          files: {
            create: original.files.map((f) => ({
              path: f.path,
              content: f.content,
            })),
          },
        },
        include: { files: true },
      });
      return apiSuccess(duplicate, 201);
    }

    return apiError("Unknown action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
