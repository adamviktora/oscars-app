import prisma from '@/lib/prisma';
import { Prenom2EarningsClient } from './client';

// Prize calculation based on correct guesses and shortlist size
function calculatePrize(correctGuesses: number, shortlistSize: number): number {
  // Based on PRENOM_2_CASH.md
  if (correctGuesses === 5) {
    if (shortlistSize <= 10) return 10;
    if (shortlistSize <= 16) return 13;
    return 17;
  }
  if (correctGuesses === 4) {
    if (shortlistSize <= 10) return 5;
    if (shortlistSize <= 16) return 6;
    return 8;
  }
  if (correctGuesses === 3) {
    if (shortlistSize <= 10) return 2;
    if (shortlistSize <= 16) return 3;
    return 4;
  }
  if (correctGuesses === 2) {
    if (shortlistSize >= 20) return 1;
  }
  return 0;
}

export interface MovieSelection {
  movieId: number;
  movieName: string;
  isCorrect: boolean;
}

export interface CategoryEarnings {
  categoryId: number;
  categoryName: string;
  shortlistSize: number;
  movies: MovieSelection[];
  correctCount: number;
  prize: number;
}

export interface UserEarnings {
  id: string;
  name: string;
  email: string;
  finalSubmitted: boolean;
  totalPrize: number;
  categories: CategoryEarnings[];
  completedCategories: number;
  totalCategories: number;
}

export default async function Prenom2EarningsPage() {
  // Get all categories with their shortlist size and nominations (only prenom2)
  const categories = await prisma.category.findMany({
    where: {
      isPrenom2: true,
    },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      shortlistNominations: {
        select: { movieId: true },
      },
      nominations: {
        select: { movieId: true },
      },
    },
  });

  // Check if any nominations exist
  const hasNominations = categories.some((cat) => cat.nominations.length > 0);

  if (!hasNominations) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Výsledné zisky</h1>
        <p className="text-base-content/60">
          Nominace zatím nebyly zadány. Výsledky budou dostupné po zadání
          nominací.
        </p>
      </div>
    );
  }

  // Build category info map
  const categoryInfo = new Map(
    categories.map((cat) => [
      cat.id,
      {
        name: cat.name,
        shortlistSize: cat.shortlistNominations.length,
        nominatedMovieIds: new Set(cat.nominations.map((n) => n.movieId)),
      },
    ])
  );

  // Fetch all users with their prenom2 selections
  const users = await prisma.user.findMany({
    where: {
      email: { not: 'robinzon@skaut.cz' },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      prenom2FinalSubmitted: true,
      prenom2Selections: {
        select: {
          categoryId: true,
          movieId: true,
          movie: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Transform data for the client
  const usersData: UserEarnings[] = users.map((user) => {
    // Group selections by category
    const selectionsByCategory = new Map<
      number,
      { movieId: number; movieName: string }[]
    >();

    user.prenom2Selections.forEach((sel) => {
      const existing = selectionsByCategory.get(sel.categoryId) || [];
      existing.push({ movieId: sel.movie.id, movieName: sel.movie.name });
      selectionsByCategory.set(sel.categoryId, existing);
    });

    let totalPrize = 0;
    let completedCategories = 0;

    // Build category earnings data
    const categoryEarnings: CategoryEarnings[] = categories.map((cat) => {
      const info = categoryInfo.get(cat.id)!;
      const userSelections = selectionsByCategory.get(cat.id) || [];

      // Mark which movies are correct
      const movies: MovieSelection[] = userSelections
        .map((sel) => ({
          movieId: sel.movieId,
          movieName: sel.movieName,
          isCorrect: info.nominatedMovieIds.has(sel.movieId),
        }))
        .sort((a, b) => a.movieName.localeCompare(b.movieName, 'cs'));

      const correctCount = movies.filter((m) => m.isCorrect).length;

      // Only count prize if category is complete (5 selections)
      let prize = 0;
      if (userSelections.length === 5) {
        completedCategories++;
        prize = calculatePrize(correctCount, info.shortlistSize);
        totalPrize += prize;
      }

      return {
        categoryId: cat.id,
        categoryName: info.name,
        shortlistSize: info.shortlistSize,
        movies,
        correctCount,
        prize,
      };
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      finalSubmitted: user.prenom2FinalSubmitted,
      totalPrize,
      categories: categoryEarnings,
      completedCategories,
      totalCategories: categories.length,
    };
  });

  return <Prenom2EarningsClient users={usersData} />;
}
