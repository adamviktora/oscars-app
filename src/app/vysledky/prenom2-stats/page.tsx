import prisma from '@/lib/prisma';
import { Prenom2StatsClient } from './client';

interface MovieGuess {
  movieName: string;
  count: number;
  users: string[]; // User names who guessed this movie
}

interface UserMatch {
  users: string[];
  movies: string[];
}

interface CategoryStats {
  categoryId: number;
  categoryName: string;
  totalUsers: number; // Users who completed this category
  movieGuesses: MovieGuess[];
  usersWhoDidntGuessTop: string[]; // Users who didn't guess the most popular movie
  perfectMatches: UserMatch[]; // Groups of users with identical 5/5 selections
}

export default async function Prenom2StatsPage() {
  // Fetch all categories (excluding best-picture which is not part of prenom2)
  const categories = await prisma.prenom2Category.findMany({
    where: {
      slug: { not: 'best-picture' },
    },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  // Fetch all users who finalized prenom2
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

  // Build statistics for each category
  const categoryStats: CategoryStats[] = categories.map((category) => {
    // Get all selections for this category
    const categorySelections = users.map((user) => ({
      userId: user.id,
      userName: user.name,
      movies: user.prenom2Selections
        .filter((sel) => sel.categoryId === category.id)
        .map((sel) => ({ id: sel.movie.id, name: sel.movie.name })),
    }));

    // Only consider users who completed this category (5 selections)
    const completedUsers = categorySelections.filter(
      (sel) => sel.movies.length === 5
    );

    // Count guesses per movie
    const movieCountMap = new Map<
      string,
      { count: number; users: string[] }
    >();

    completedUsers.forEach((userSel) => {
      userSel.movies.forEach((movie) => {
        const existing = movieCountMap.get(movie.name) || {
          count: 0,
          users: [],
        };
        existing.count += 1;
        existing.users.push(userSel.userName);
        movieCountMap.set(movie.name, existing);
      });
    });

    // Convert to array and sort by count descending
    const movieGuesses: MovieGuess[] = Array.from(movieCountMap.entries())
      .map(([movieName, data]) => ({
        movieName,
        count: data.count,
        users: data.users.sort((a, b) => a.localeCompare(b, 'cs')),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.movieName.localeCompare(b.movieName, 'cs');
      });

    // Find users who didn't guess the most popular movie
    const topMovie = movieGuesses[0];
    const usersWhoDidntGuessTop =
      topMovie && topMovie.count < completedUsers.length
        ? completedUsers
            .filter(
              (userSel) =>
                !userSel.movies.some((m) => m.name === topMovie.movieName)
            )
            .map((u) => u.userName)
            .sort((a, b) => a.localeCompare(b, 'cs'))
        : [];

    // Find perfect matches (users with identical 5/5 selections)
    const selectionSignatures = new Map<string, string[]>();

    completedUsers.forEach((userSel) => {
      // Create a unique signature for this user's selections
      const signature = userSel.movies
        .map((m) => m.id)
        .sort((a, b) => a - b)
        .join(',');

      const existing = selectionSignatures.get(signature) || [];
      existing.push(userSel.userName);
      selectionSignatures.set(signature, existing);
    });

    // Filter to only groups with 2+ users (actual matches)
    const perfectMatches: UserMatch[] = [];
    selectionSignatures.forEach((userNames, signature) => {
      if (userNames.length >= 2) {
        // Get movie names for this signature
        const movieIds = signature.split(',').map(Number);
        const firstUserWithMatch = completedUsers.find((u) =>
          u.movies.every((m) => movieIds.includes(m.id))
        );
        const movieNames = firstUserWithMatch
          ? firstUserWithMatch.movies
              .map((m) => m.name)
              .sort((a, b) => a.localeCompare(b, 'cs'))
          : [];

        perfectMatches.push({
          users: userNames.sort((a, b) => a.localeCompare(b, 'cs')),
          movies: movieNames,
        });
      }
    });

    return {
      categoryId: category.id,
      categoryName: category.name,
      totalUsers: completedUsers.length,
      movieGuesses,
      usersWhoDidntGuessTop,
      perfectMatches,
    };
  });

  return <Prenom2StatsClient categories={categoryStats} />;
}
