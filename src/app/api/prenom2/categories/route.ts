import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Czech alphabet order: A Á B C Č D Ď E É Ě F G H CH I Í J K L M N Ň O Ó P Q R Ř S Š T Ť U Ú Ů V W X Y Ý Z Ž
const czechOrder: Record<string, number> = {
  'a': 1, 'á': 2,
  'b': 3,
  'c': 4, 'č': 5,
  'd': 6, 'ď': 7,
  'e': 8, 'é': 9, 'ě': 10,
  'f': 11,
  'g': 12,
  'h': 13, // CH is handled specially
  'i': 15, 'í': 16,
  'j': 17,
  'k': 18,
  'l': 19,
  'm': 20,
  'n': 21, 'ň': 22,
  'o': 23, 'ó': 24,
  'p': 25,
  'q': 26,
  'r': 27, 'ř': 28,
  's': 29, 'š': 30,
  't': 31, 'ť': 32,
  'u': 33, 'ú': 34, 'ů': 35,
  'v': 36,
  'w': 37,
  'x': 38,
  'y': 39, 'ý': 40,
  'z': 41, 'ž': 42,
};

function czechCompare(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  let ai = 0, bi = 0;
  
  while (ai < aLower.length && bi < bLower.length) {
    const aChar = aLower[ai];
    const bChar = bLower[bi];
    
    // Handle CH digraph (comes after H, position 14)
    let aOrder: number;
    let bOrder: number;
    
    if (aChar === 'c' && ai + 1 < aLower.length && aLower[ai + 1] === 'h') {
      aOrder = 14; // CH
      ai += 2;
    } else {
      aOrder = czechOrder[aChar] ?? aChar.charCodeAt(0) + 100;
      ai++;
    }
    
    if (bChar === 'c' && bi + 1 < bLower.length && bLower[bi + 1] === 'h') {
      bOrder = 14; // CH
      bi += 2;
    } else {
      bOrder = czechOrder[bChar] ?? bChar.charCodeAt(0) + 100;
      bi++;
    }
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
  }
  
  // If we've exhausted one string, the shorter one comes first
  return aLower.length - bLower.length;
}

export async function GET() {
  try {
    // Cache categories for 5 minutes using Prisma Accelerate
    // Exclude best-picture which is not part of prenom2
    const categories = await prisma.prenom2Category.findMany({
      where: {
        slug: { not: 'best-picture' },
      },
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
        // Sort using Czech alphabet order (Č after C, CH after H, Ď after D, etc.)
        .sort((a, b) => czechCompare(a.name, b.name)),
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
