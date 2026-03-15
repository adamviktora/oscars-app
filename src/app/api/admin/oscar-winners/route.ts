import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { emitWinnerAnnounced } from '@/lib/oscar-events';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId } = await request.json();

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    await prisma.oscarWinner.deleteMany({
      where: { categoryId },
    });

    emitWinnerAnnounced(category.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing oscar winner:', error);
    return NextResponse.json(
      { error: 'Failed to remove oscar winner' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId, nominationId } = await request.json();

    if (!categoryId || !nominationId) {
      return NextResponse.json(
        { error: 'categoryId and nominationId are required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    await prisma.oscarWinner.upsert({
      where: { categoryId },
      create: { categoryId, nominationId },
      update: { nominationId },
    });

    emitWinnerAnnounced(category.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving oscar winner:', error);
    return NextResponse.json(
      { error: 'Failed to save oscar winner' },
      { status: 500 }
    );
  }
}
