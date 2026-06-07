import { prisma } from '../db/prisma';
import { keyManager } from '../ai/key-manager';

export async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = await keyManager.getKey();
  if (!apiKey) throw new Error('No API keys available for embedding');

  const response = await fetch('https://api.gemma.cloud/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) throw new Error('Embedding API error');

  const data = await response.json();
  return data.data[0].embedding;
}

export async function storeMemory(userId: string, content: string, category: string = 'general', importance: number = 1) {
  const embedding = await createEmbedding(content);

  // We use raw SQL because Prisma doesn't support the vector type natively in the schema
  await prisma.$executeRaw`
    INSERT INTO "Memory" ("id", "userId", "content", "category", "importance", "embedding", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${userId}, ${content}, ${category}, ${importance}, ${embedding}::vector, NOW(), NOW())
  `;
}

export async function retrieveMemories(userId: string, query: string, limit: number = 5) {
  const queryEmbedding = await createEmbedding(query);

  // Cosine similarity search using <=> operator
  const memories: any[] = await prisma.$queryRaw`
    SELECT content, category, importance,
           (embedding <=> ${queryEmbedding}::vector) as distance
    FROM "Memory"
    WHERE "userId" = ${userId}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return memories;
}

export async function deleteMemory(memoryId: string) {
  return await prisma.memory.delete({
    where: { id: memoryId },
  });
}
