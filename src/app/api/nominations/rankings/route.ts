import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET user's nomination rankings
export async function GET() {
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

    const rankings = await prisma.userNominationRanking.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        nominationId: true,
        ranking: true,
      },
    });

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error fetching nomination rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
