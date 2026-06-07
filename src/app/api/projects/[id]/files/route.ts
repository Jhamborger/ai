import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { fileSchema } from "@/lib/validations";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const fileActionSchema = z.object({
  action: z.enum(["create", "delete", "rename", "move"]),
  path: z.string(),
  content: z.string().optional(),
  newPath: z.string().optional(),
});

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const files = await prisma.projectFile.findMany({
      where: { projectId: id },
      orderBy: { path: "asc" },
    });
    return apiSuccess(files);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action) {
      const action = fileActionSchema.parse(body);

      switch (action.action) {
        case "create": {
          const file = await prisma.projectFile.create({
            data: {
              projectId: id,
              path: action.path,
              content: action.content ?? "",
            },
          });
          return apiSuccess(file, 201);
        }
        case "delete": {
          await prisma.projectFile.delete({
            where: { projectId_path: { projectId: id, path: action.path } },
          });
          return apiSuccess({ deleted: true });
        }
        case "rename":
        case "move": {
          if (!action.newPath) return apiError("newPath required", 400);
          const existing = await prisma.projectFile.findUnique({
            where: { projectId_path: { projectId: id, path: action.path } },
          });
          if (!existing) return apiError("File not found", 404);
          const file = await prisma.projectFile.update({
            where: { projectId_path: { projectId: id, path: action.path } },
            data: { path: action.newPath },
          });
          return apiSuccess(file);
        }
      }
    }

    const fileData = fileSchema.parse(body);
    const file = await prisma.projectFile.upsert({
      where: {
        projectId_path: { projectId: id, path: fileData.path },
      },
      create: {
        projectId: id,
        path: fileData.path,
        content: fileData.content,
      },
      update: { content: fileData.content },
    });

    await prisma.project.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return apiSuccess(file);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { files } = z
      .object({ files: z.array(fileSchema) })
      .parse(await request.json());

    for (const file of files) {
      await prisma.projectFile.upsert({
        where: {
          projectId_path: { projectId: id, path: file.path },
        },
        create: {
          projectId: id,
          path: file.path,
          content: file.content,
        },
        update: { content: file.content },
      });
    }

    await prisma.project.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return apiSuccess({ updated: files.length });
  } catch (error) {
    return handleApiError(error);
  }
}
