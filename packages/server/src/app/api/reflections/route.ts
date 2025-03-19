import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReflectionSchema } from '@superagent/shared';
import { ReflectionAgent } from '@superagent/agents';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const reflection = ReflectionSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const savedReflection = await prisma.reflection.create({
      data: reflection,
    });

    // Process reflection with AI agent
    const agent = new ReflectionAgent();
    const agentNote = await agent.processReflection(savedReflection);

    // Save agent's note
    await prisma.agentNote.create({
      data: {
        content: agentNote,
        agentType: 'reflection',
        reflectionId: savedReflection.id,
      },
    });

    return NextResponse.json(savedReflection);
  } catch (error) {
    console.error('Error creating reflection:', error);
    return NextResponse.json(
      { error: 'Failed to create reflection' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reflections = await prisma.reflection.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        agentNotes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reflections);
  } catch (error) {
    console.error('Error fetching reflections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reflections' },
      { status: 500 }
    );
  }
} 