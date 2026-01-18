import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        prenom1FinalSubmitted: true,
        prenom2FinalSubmitted: true,
      },
    });

    return NextResponse.json({
      prenom1FinalSubmitted: user?.prenom1FinalSubmitted ?? false,
      prenom2FinalSubmitted: user?.prenom2FinalSubmitted ?? false,
    });
  } catch (error) {
    console.error('Error fetching final submission status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch final submission status' },
      { status: 500 }
    );
  }
}
