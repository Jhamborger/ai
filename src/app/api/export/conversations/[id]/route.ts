import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "json";

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) return apiError("Conversation not found", 404);

    if (format === "markdown") {
      let md = `# ${conversation.title}\n\n`;
      md += `*Exported from AETDRIXZ AI on ${new Date().toISOString()}*\n\n---\n\n`;
      for (const msg of conversation.messages) {
        const label = msg.role === "user" ? "You" : "Assistant";
        md += `### ${label}\n\n${msg.content}\n\n---\n\n`;
      }
      return new Response(md, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${conversation.title}.md"`,
        },
      });
    }

    return new Response(JSON.stringify(conversation, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${conversation.title}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
