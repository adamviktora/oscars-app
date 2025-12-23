import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Cache movies for 5 minutes using Prisma Accelerate
    // Movies rarely change, so this significantly reduces database load
    const movies = await prisma.movie.findMany({
      where: {
        prenom1Order: { not: null }
      },
      orderBy: {
        prenom1Order: 'asc'
      },
      cacheStrategy: {
        ttl: 300, // 5 minutes
        swr: 60,  // Serve stale while revalidating for 1 minute
      },
    });
    
    return NextResponse.json(movies, {
      headers: {
        // Also cache on the edge/browser for 1 minute
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
