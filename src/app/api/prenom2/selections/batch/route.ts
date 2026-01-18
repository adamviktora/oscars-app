import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

interface SelectionKey {
  categoryId: number;
  movieId: number;
}

interface BatchRequest {
  toAdd: SelectionKey[];
  toRemove: SelectionKey[];
}

// POST - Batch uložení a smazání výběrů pro Prenom 2.0
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
      select: { prenom2FinalSubmitted: true },
    });

    if (user?.prenom2FinalSubmitted) {
      return NextResponse.json(
        { error: 'Final submission already completed' },
        { status: 403 }
      );
    }

    const body: BatchRequest = await request.json();
    const { toAdd, toRemove } = body;
    const userId = session.user.id;

    // Validate: no more than 5 per category after changes
    const categoryAddCounts = new Map<number, number>();
    toAdd.forEach(item => {
      categoryAddCounts.set(item.categoryId, (categoryAddCounts.get(item.categoryId) || 0) + 1);
    });

    // Check current counts for affected categories
    for (const [categoryId, addCount] of categoryAddCounts) {
      const currentCount = await prisma.userPrenom2Selection.count({
        where: { userId, categoryId },
      });
      
      // Calculate how many we're removing from this category
      const removeCount = toRemove.filter(r => r.categoryId === categoryId).length;
      
      if (currentCount - removeCount + addCount > 5) {
        return NextResponse.json(
          { error: `Maximum 5 selections per category (category ${categoryId})` },
          { status: 400 }
        );
      }
    }

    // Use a transaction
    await prisma.$transaction(async (tx) => {
      // Delete selections
      for (const item of toRemove) {
        await tx.userPrenom2Selection.deleteMany({
          where: {
            userId,
            categoryId: item.categoryId,
            movieId: item.movieId,
          },
        });
      }

      // Add selections
      for (const item of toAdd) {
        await tx.userPrenom2Selection.upsert({
          where: {
            userId_categoryId_movieId: {
              userId,
              categoryId: item.categoryId,
              movieId: item.movieId,
            },
          },
          update: {},
          create: {
            userId,
            categoryId: item.categoryId,
            movieId: item.movieId,
          },
        });
      }
    });

    return NextResponse.json({ 
      success: true,
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error) {
    console.error('Error batch saving prenom2 selections:', error);
    return NextResponse.json(
      { error: 'Failed to save selections' },
      { status: 500 }
    );
  }
}

