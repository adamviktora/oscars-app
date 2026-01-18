import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    await prisma.user.update({
      where: { id: session.user.id },
      data: { prenom2FinalSubmitted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error finalizing prenom2 submission:', error);
    return NextResponse.json(
      { error: 'Failed to finalize prenom2 submission' },
      { status: 500 }
    );
  }
}
