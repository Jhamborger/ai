import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId') || 'default-user';

    if (!query) return NextResponse.json([]);

    const results = await prisma.$transaction([
      prisma.conversation.findMany({
        where: {
          userId,
          title: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, title: true },
      }),
      prisma.message.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, content: true, conversationId: true },
        take: 10,
      }),
      prisma.project.findMany({
        where: {
          userId,
          name: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, name: true },
      }),
      prisma.projectFile.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, path: true, projectId: true },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      conversations: results[0],
      messages: results[1],
      projects: results[2],
      files: results[3],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
