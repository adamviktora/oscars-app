import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.prenom2Category.findMany({
      orderBy: { order: 'asc' },
      include: {
        movies: {
          include: {
            movie: true,
          },
          orderBy: {
            movie: { name: 'asc' },
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
      movies: category.movies.map((cm) => ({
        id: cm.movie.id,
        name: cm.movie.name,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching prenom2 categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

