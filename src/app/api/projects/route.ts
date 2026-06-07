import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const projects = await prisma.project.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { files: true } } },
    });

    return apiSuccess(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = projectSchema.parse(await request.json());
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        files: {
          create: [
            {
              path: "index.html",
              content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${body.name}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main>
    <h1>${body.name}</h1>
    <p>Start building with AETDRIXZ AI.</p>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
            },
            {
              path: "style.css",
              content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fafafa; min-height: 100vh; }
main { max-width: 720px; margin: 0 auto; padding: 4rem 1.5rem; }
h1 { font-size: 2.5rem; margin-bottom: 1rem; }
p { color: #a1a1aa; line-height: 1.6; }`,
            },
            {
              path: "script.js",
              content: `console.log("${body.name} loaded");`,
            },
          ],
        },
      },
      include: { files: true },
    });
    return apiSuccess(project, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
