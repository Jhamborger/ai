import prisma from "@/lib/prisma";
import type { MemoryCategory } from "@/types";

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 20);
}

function scoreMemory(
  memory: { content: string; keywords: string[]; importance: number; pinned: boolean },
  queryKeywords: string[]
): number {
  let score = memory.importance;
  if (memory.pinned) score += 20;

  const contentLower = memory.content.toLowerCase();
  const allKeywords = [...memory.keywords, ...extractKeywords(memory.content)];

  for (const kw of queryKeywords) {
    if (contentLower.includes(kw)) score += 5;
    if (allKeywords.includes(kw)) score += 3;
  }

  return score;
}

export async function retrieveRelevantMemories(
  query: string,
  limit = 10,
  userId = "default"
) {
  const queryKeywords = extractKeywords(query);

  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { importance: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const scored = memories
    .map((m) => ({
      ...m,
      score: scoreMemory(m, queryKeywords),
    }))
    .filter((m) => m.score > m.importance || queryKeywords.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export async function searchMemories(
  query: string,
  options: {
    category?: MemoryCategory;
    pinned?: boolean;
    limit?: number;
    userId?: string;
  } = {}
) {
  const { category, pinned, limit = 50, userId = "default" } = options;

  const memories = await prisma.memory.findMany({
    where: {
      userId,
      ...(category ? { category } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      ...(query
        ? {
            OR: [
              { content: { contains: query, mode: "insensitive" as const } },
              { keywords: { hasSome: extractKeywords(query) } },
            ],
          }
        : {}),
    },
    orderBy: [{ pinned: "desc" }, { importance: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return memories;
}

export async function createMemoryFromContent(
  content: string,
  category: MemoryCategory = "custom",
  importance = 5,
  userId = "default"
) {
  return prisma.memory.create({
    data: {
      content,
      category,
      importance,
      keywords: extractKeywords(content),
      userId,
    },
  });
}

export { extractKeywords };
