import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

interface RankingUpdate {
  nominationId: number;
  ranking: number;
}

interface BatchRequest {
  rankings: RankingUpdate[];
}

// POST - Batch save/update nomination rankings
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nominationFinalSubmitted: true },
    });

    if (user?.nominationFinalSubmitted) {
      return NextResponse.json(
        { error: 'Final submission already completed' },
        { status: 403 }
      );
    }

    const body: BatchRequest = await request.json();
    const { rankings } = body;
    const userId = session.user.id;

    if (!rankings || !Array.isArray(rankings)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Use a transaction to upsert all rankings
    await prisma.$transaction(async (tx) => {
      for (const item of rankings) {
        await tx.userNominationRanking.upsert({
          where: {
            userId_nominationId: {
              userId,
              nominationId: item.nominationId,
            },
          },
          update: {
            ranking: item.ranking,
          },
          create: {
            userId,
            nominationId: item.nominationId,
            ranking: item.ranking,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      updated: rankings.length,
    });
  } catch (error) {
    console.error('Error batch saving nomination rankings:', error);
    return NextResponse.json(
      { error: 'Failed to save rankings' },
      { status: 500 }
    );
  }
}
