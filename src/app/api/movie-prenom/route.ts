import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Only return movies that are in Prenomination 1.0 (have prenom1Order)
    const movies = await prisma.movie.findMany({
      where: {
        prenom1Order: { not: null }
      },
      orderBy: {
        prenom1Order: 'asc'
      }
    });
    
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}

