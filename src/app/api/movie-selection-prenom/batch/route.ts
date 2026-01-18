import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

interface SaveItem {
  movieId: number;
  rating: string;
  ranking: number | null;
}

interface BatchRequest {
  toSave: SaveItem[];
  toDelete: number[];
}

// POST - Batch uložení a smazání výběrů
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prenom1FinalSubmitted: true },
    });

    if (user?.prenom1FinalSubmitted) {
      return NextResponse.json(
        { error: 'Final submission already completed' },
        { status: 403 }
      );
    }

    const body: BatchRequest = await request.json();
    const { toSave, toDelete } = body;
    const userId = session.user.id;

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete selections
      if (toDelete.length > 0) {
        await tx.userMovieSelectionPrenom.deleteMany({
          where: {
            userId,
            movieId: { in: toDelete },
          },
        });
      }

      // Upsert selections
      for (const item of toSave) {
        await tx.userMovieSelectionPrenom.upsert({
          where: {
            userId_movieId: {
              userId,
              movieId: item.movieId,
            },
          },
          update: {
            rating: item.rating,
            ranking: item.ranking,
            updatedAt: new Date(),
          },
          create: {
            userId,
            movieId: item.movieId,
            rating: item.rating,
            ranking: item.ranking,
          },
        });
      }
    });

    return NextResponse.json({ 
      success: true,
      saved: toSave.length,
      deleted: toDelete.length,
    });
  } catch (error) {
    console.error('Error batch saving movie selections:', error);
    return NextResponse.json(
      { error: 'Failed to save selections' },
      { status: 500 }
    );
  }
}

