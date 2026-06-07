import { NextRequest, NextResponse } from 'next/server';
import { generateGemmaResponse } from '@/lib/ai/gemma';
import { retrieveMemories } from '@/lib/memory/vector-store';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const { prompt, conversationId, userId } = await req.json();

    // 1. Retrieve relevant memories
    const memories = await retrieveMemories(userId, prompt);
    const memoryContext = memories
      .map((m: any) => `- ${m.content} (Importance: ${m.importance})`)
      .join('\n');

    // 2. Fetch conversation history
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    const historyContext = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // 3. Build the augmented prompt
    const systemPrompt = `You are AETDRIXZ AI.

Relevant User Context:
${memoryContext}

Conversation History:
${historyContext}

Guidelines:
- Be professional and helpful.
- If the user asks to "remember" something, acknowledge it and inform them you've saved it.
- When generating projects, use structured JSON format: { "files": [{ "path": "...", "content": "..." }] }.
`;

    // 4. Call Gemma 4 with streaming
    const stream = await generateGemmaResponse(prompt, systemPrompt, true);

    // 5. Save the user message to DB
    await prisma.message.create({
      data: {
        conversationId,
        userId: userId, // Note: User model needs relation to Message or handle via Conversation
        role: 'user',
        content: prompt,
      },
    });

    // Note: In a production app, we'd stream the response and then save the assistant message
    // once the stream is complete. For now, we return the stream.
    return new NextResponse(stream);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
