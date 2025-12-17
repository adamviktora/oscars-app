import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Načíst všechny výběry aktuálního uživatele
export async function GET(request: NextRequest) {
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

    const selections = await prisma.userMovieSelectionPrenom.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        movie: true,
      },
    });

    return NextResponse.json(selections);
  } catch (error) {
    console.error('Error fetching movie selections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch selections' },
      { status: 500 }
    );
  }
}

// POST - Uložit nebo aktualizovat výběr
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

    const body = await request.json();
    const { movieId, rating, ranking } = body;

    if (!movieId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert - vytvoř nebo aktualizuj
    const selection = await prisma.userMovieSelectionPrenom.upsert({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: parseInt(movieId),
        },
      },
      update: {
        rating,
        ranking: ranking ? parseInt(ranking) : null,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        movieId: parseInt(movieId),
        rating,
        ranking: ranking ? parseInt(ranking) : null,
      },
    });

    return NextResponse.json(selection);
  } catch (error) {
    console.error('Error saving movie selection:', error);
    return NextResponse.json(
      { error: 'Failed to save selection' },
      { status: 500 }
    );
  }
}

// DELETE - Odstranit výběr filmu
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json(
        { error: 'Missing movieId' },
        { status: 400 }
      );
    }

    await prisma.userMovieSelectionPrenom.deleteMany({
      where: {
        userId: session.user.id,
        movieId: parseInt(movieId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movie selection:', error);
    return NextResponse.json(
      { error: 'Failed to delete selection' },
      { status: 500 }
    );
  }
}

