import prisma from '@/lib/prisma';
import { Prenom2LeaderboardClient } from './client';

// Prize calculation based on correct guesses and shortlist size
function calculatePrize(correctGuesses: number, shortlistSize: number): number {
  // Based on PRENOM_2_CASH.md
  if (correctGuesses === 5) {
    if (shortlistSize <= 10) return 10;
    if (shortlistSize <= 16) return 13;
    return 17; // 20 nominací
  }
  if (correctGuesses === 4) {
    if (shortlistSize <= 10) return 5;
    if (shortlistSize <= 16) return 6;
    return 8; // 20 nominací
  }
  if (correctGuesses === 3) {
    if (shortlistSize <= 10) return 2;
    if (shortlistSize <= 16) return 3;
    return 4; // 20 nominací
  }
  if (correctGuesses === 2) {
    if (shortlistSize >= 20) return 1;
  }
  return 0;
}

export interface CategoryResult {
  categoryId: number;
  categoryName: string;
  shortlistSize: number;
  correctGuesses: number;
  prize: number;
  correctMovies: string[];
  participated: boolean; // true if user completed 5 selections
}

export interface UserScore {
  id: string;
  name: string;
  totalPrize: number;
  position: number;
  successfulCategories: number; // Categories where user got at least +1 Kč
  categoryResults: CategoryResult[];
}

export default async function Prenom2LeaderboardPage() {
  // Get all categories (excluding best-picture) with their shortlist size
  const categories = await prisma.prenom2Category.findMany({
    where: {
      slug: { not: 'best-picture' },
    },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      movies: {
        select: { movieId: true },
      },
      nominations: {
        select: {
          movieId: true,
          movie: { select: { name: true } },
        },
      },
    },
  });

  // Check if any nominations exist
  const hasNominations = categories.some((cat) => cat.nominations.length > 0);

  if (!hasNominations) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">
          Žebříček - Prenominační kolo 2.0
        </h1>
        <p className="text-base-content/60">
          Nominace zatím nebyly zadány. Žebříček bude dostupný po zadání
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
        shortlistSize: cat.movies.length,
        nominatedMovieIds: new Set(cat.nominations.map((n) => n.movieId)),
        nominatedMovieNames: new Map(
          cat.nominations.map((n) => [n.movieId, n.movie.name])
        ),
      },
    ])
  );

  // Get all users who finalized prenom2
  const users = await prisma.user.findMany({
    where: {
      prenom2FinalSubmitted: true,
      email: { not: 'robinzon@skaut.cz' },
    },
    select: {
      id: true,
      name: true,
      prenom2Selections: {
        select: {
          categoryId: true,
          movieId: true,
          movie: { select: { name: true } },
        },
      },
    },
  });

  // Calculate scores for each user
  const userScores: UserScore[] = users.map((user) => {
    // Group selections by category
    const selectionsByCategory = new Map<
      number,
      { movieId: number; movieName: string }[]
    >();

    user.prenom2Selections.forEach((sel) => {
      const existing = selectionsByCategory.get(sel.categoryId) || [];
      existing.push({ movieId: sel.movieId, movieName: sel.movie.name });
      selectionsByCategory.set(sel.categoryId, existing);
    });

    // Calculate results for each category
    const categoryResults: CategoryResult[] = [];
    let totalPrize = 0;

    categories.forEach((cat) => {
      const info = categoryInfo.get(cat.id)!;
      const userSelections = selectionsByCategory.get(cat.id) || [];

      // Only count if user completed category (5 selections)
      if (userSelections.length === 5) {
        const correctMovies = userSelections
          .filter((sel) => info.nominatedMovieIds.has(sel.movieId))
          .map((sel) => sel.movieName);

        const prize = calculatePrize(correctMovies.length, info.shortlistSize);
        totalPrize += prize;

        categoryResults.push({
          categoryId: cat.id,
          categoryName: info.name,
          shortlistSize: info.shortlistSize,
          correctGuesses: correctMovies.length,
          prize,
          correctMovies,
          participated: true,
        });
      } else {
        categoryResults.push({
          categoryId: cat.id,
          categoryName: info.name,
          shortlistSize: info.shortlistSize,
          correctGuesses: 0,
          prize: 0,
          correctMovies: [],
          participated: false,
        });
      }
    });

    // Count categories where user earned at least 1 Kč
    const successfulCategories = categoryResults.filter(
      (cat) => cat.prize >= 1
    ).length;

    return {
      id: user.id,
      name: user.name,
      totalPrize,
      position: 0,
      successfulCategories,
      categoryResults,
    };
  });

  // Sort users by total prize (desc)
  userScores.sort((a, b) => b.totalPrize - a.totalPrize);

  // Assign positions (same position for ties)
  userScores.forEach((user, index) => {
    if (index === 0) {
      user.position = 1;
    } else {
      const prev = userScores[index - 1];
      if (user.totalPrize === prev.totalPrize) {
        user.position = prev.position;
      } else {
        user.position = index + 1;
      }
    }
  });

  return <Prenom2LeaderboardClient users={userScores} />;
}
