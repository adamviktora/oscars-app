import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all categories with their nominations (sorted by defaultOrder)
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        nominations: {
          some: {}, // Only categories that have nominations
        },
      },
      orderBy: { order: 'asc' },
      include: {
        nominations: {
          orderBy: { defaultOrder: 'asc' },
          include: {
            movie: {
              select: {
                id: true,
                name: true,
              },
            },
            actor: {
              select: {
                id: true,
                fullName: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    // Transform the data to a cleaner format
    const result = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      order: category.order,
      nominations: category.nominations.map((nom) => ({
        id: nom.id,
        movieId: nom.movieId,
        movieName: nom.movie.name,
        actorId: nom.actorId,
        actorName: nom.actor?.fullName || null,
        actorGender: nom.actor?.gender || null,
        defaultOrder: nom.defaultOrder,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching nomination categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
