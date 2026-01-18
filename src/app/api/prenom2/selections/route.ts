import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET user's selections for Prenom 2.0
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

    const selections = await prisma.userPrenom2Selection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        categoryId: true,
        movieId: true,
      },
    });

    return NextResponse.json(selections);
  } catch (error) {
    console.error('Error fetching prenom2 selections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch selections' },
      { status: 500 }
    );
  }
}

// POST - toggle selection (add or remove)
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

    const body = await request.json();
    const { categoryId, movieId, selected } = body;

    if (!categoryId || !movieId || selected === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (selected) {
      // Check if user already has 5 selections in this category
      const currentCount = await prisma.userPrenom2Selection.count({
        where: {
          userId: session.user.id,
          categoryId: categoryId,
        },
      });

      if (currentCount >= 5) {
        return NextResponse.json(
          { error: 'Maximum 5 selections per category' },
          { status: 400 }
        );
      }

      // Add selection
      const selection = await prisma.userPrenom2Selection.upsert({
        where: {
          userId_categoryId_movieId: {
            userId: session.user.id,
            categoryId: categoryId,
            movieId: movieId,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          categoryId: categoryId,
          movieId: movieId,
        },
      });

      return NextResponse.json(selection);
    } else {
      // Remove selection
      await prisma.userPrenom2Selection.deleteMany({
        where: {
          userId: session.user.id,
          categoryId: categoryId,
          movieId: movieId,
        },
      });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error saving prenom2 selection:', error);
    return NextResponse.json(
      { error: 'Failed to save selection' },
      { status: 500 }
    );
  }
}

