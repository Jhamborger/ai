import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

const importSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = importSchema.parse(await request.json());

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        files: {
          create: body.files.map((f) => ({
            path: f.path,
            content: f.content,
          })),
        },
      },
      include: { files: true },
    });

    return apiSuccess(project, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
