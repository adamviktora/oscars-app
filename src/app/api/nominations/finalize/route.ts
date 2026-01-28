import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// POST - Finalize nomination rankings submission
export async function POST() {
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
        { error: 'Already finalized' },
        { status: 400 }
      );
    }

    // Update user's final submission status
    await prisma.user.update({
      where: { id: session.user.id },
      data: { nominationFinalSubmitted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error finalizing nomination rankings:', error);
    return NextResponse.json(
      { error: 'Failed to finalize' },
      { status: 500 }
    );
  }
}
