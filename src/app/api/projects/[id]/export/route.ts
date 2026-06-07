import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import JSZip from "jszip";
import { apiError, handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!project) return apiError("Project not found", 404);

    const zip = new JSZip();
    const folder = zip.folder(project.name.replace(/[^a-z0-9-_]/gi, "_"));

    for (const file of project.files) {
      folder?.file(file.path, file.content);
    }

    const buffer = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.name}.zip"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
