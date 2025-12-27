import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Cache categories for 5 minutes using Prisma Accelerate
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
      cacheStrategy: {
        ttl: 300, // 5 minutes
        swr: 60,  // Serve stale while revalidating for 1 minute
      },
    });

    // Transform the data to a cleaner format
    const result = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      order: category.order,
      movies: category.movies
        .map((cm) => ({
          id: cm.movie.id,
          name: cm.movie.name,
        }))
        // Sort using Czech locale (handles Č after C, CH after H, Ř after R, etc.)
        .sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    }));

    return NextResponse.json(result, {
      headers: {
        // Also cache on the edge/browser for 1 minute
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching prenom2 categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
