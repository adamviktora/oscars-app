import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId, movieIds } = await request.json();

    if (!categoryId || !Array.isArray(movieIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (movieIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 nominations allowed' },
        { status: 400 }
      );
    }

    // Delete existing nominations for this category
    await prisma.nomination.deleteMany({
      where: { categoryId },
    });

    // Create new nominations
    if (movieIds.length > 0) {
      await prisma.nomination.createMany({
        data: movieIds.map((movieId: number) => ({
          categoryId,
          movieId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving nominations:', error);
    return NextResponse.json(
      { error: 'Failed to save nominations' },
      { status: 500 }
    );
  }
}
