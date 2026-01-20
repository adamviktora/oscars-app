import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import prisma from '@/lib/prisma';

interface NominationData {
  categoryId: number;
  movieIds: number[];
}

// Save nominations for all categories at once
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nominations } = await request.json();

    if (!Array.isArray(nominations)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate all nominations
    for (const nom of nominations as NominationData[]) {
      if (!nom.categoryId || !Array.isArray(nom.movieIds)) {
        return NextResponse.json(
          { error: 'Invalid nomination data' },
          { status: 400 }
        );
      }
      if (nom.movieIds.length > 5) {
        return NextResponse.json(
          { error: 'Maximum 5 nominations per category' },
          { status: 400 }
        );
      }
    }

    // Use transaction to update all categories
    await prisma.$transaction(async (tx) => {
      for (const nom of nominations as NominationData[]) {
        // Delete existing nominations for this category
        await tx.nomination.deleteMany({
          where: { categoryId: nom.categoryId },
        });

        // Create new nominations
        if (nom.movieIds.length > 0) {
          await tx.nomination.createMany({
            data: nom.movieIds.map((movieId) => ({
              categoryId: nom.categoryId,
              movieId,
            })),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving nominations:', error);
    return NextResponse.json(
      { error: 'Failed to save nominations' },
      { status: 500 }
    );
  }
}
