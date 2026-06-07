import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return new Response(JSON.stringify(memories, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="aetdrixz-memories.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
