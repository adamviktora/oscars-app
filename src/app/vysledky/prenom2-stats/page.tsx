import prisma from '@/lib/prisma';
import { Prenom2StatsClient } from './client';

// Prize calculation based on correct guesses and shortlist size
function calculatePrize(correctGuesses: number, shortlistSize: number): number {
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

// Max prize possible for a category
function getMaxPrize(shortlistSize: number): number {
  if (shortlistSize <= 10) return 10;
  if (shortlistSize <= 16) return 13;
  return 17;
}

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
  topMovies: MovieGuess[];
  usersWhoDidntGuessTop: { [movieName: string]: string[] }; // Users who didn't guess the most popular movie
  perfectMatches: UserMatch[]; // Groups of users with identical 5/5 selections
  // New fields for results statistics
  shortlistSize: number;
  totalEarned: number;
  maxPossible: number;
  successRate: number; // percentage (money earned / max possible)
  successfulUsers: number; // Users who got at least 1 Kč
  userSuccessRate: number; // percentage (successful users / total participants)
}

// User accuracy breakdown
interface UserAccuracyRow {
  userName: string;
  counts: number[]; // [0/5 count, 1/5 count, 2/5 count, 3/5 count, 4/5 count, 5/5 count]
}

// Category accuracy breakdown
interface CategoryAccuracyRow {
  categoryId: number;
  categoryName: string;
  shortlistSize: number;
  counts: number[]; // [0/5 count, 1/5 count, 2/5 count, 3/5 count, 4/5 count, 5/5 count]
  minSuccessIndex: number; // minimum correct guesses needed for 1 Kč (2 for 20 films, 3 otherwise)
}

export default async function Prenom2StatsPage() {
  // Fetch all categories with shortlist size and nominations
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
        select: { movieId: true },
      },
    },
  });

  // Check if nominations exist
  const hasNominations = categories.some((cat) => cat.nominations.length > 0);

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
    const movieCountMap = new Map<string, { count: number; users: string[] }>();

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
    const movieIsTop = (movie: MovieGuess) =>
      movie.count === movieGuesses[0].count;
    const topMovies = movieGuesses.filter(movieIsTop);

    const usersWhoDidntGuessTop =
      topMovies.length > 0 && topMovies[0].count < completedUsers.length
        ? Object.fromEntries(
            topMovies.map((topMovie) => [
              topMovie.movieName,
              completedUsers
                .filter(
                  (userSel) =>
                    !userSel.movies.some((m) => m.name === topMovie.movieName)
                )
                .map((u) => u.userName)
                .sort((a, b) => a.localeCompare(b, 'cs')),
            ])
          )
        : {};

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

    // Calculate category success rate (only if nominations exist)
    const shortlistSize = category.movies.length;
    const nominatedMovieIds = new Set(
      category.nominations.map((n) => n.movieId)
    );
    let totalEarned = 0;
    let maxPossible = 0;
    let successfulUsers = 0;

    if (hasNominations) {
      completedUsers.forEach((userSel) => {
        const correctCount = userSel.movies.filter((m) =>
          nominatedMovieIds.has(m.id)
        ).length;
        const prize = calculatePrize(correctCount, shortlistSize);
        totalEarned += prize;
        maxPossible += getMaxPrize(shortlistSize);
        if (prize >= 1) {
          successfulUsers++;
        }
      });
    }

    const successRate =
      maxPossible > 0 ? Math.round((totalEarned / maxPossible) * 100) : 0;
    const userSuccessRate =
      completedUsers.length > 0
        ? Math.round((successfulUsers / completedUsers.length) * 100)
        : 0;

    return {
      categoryId: category.id,
      categoryName: category.name,
      totalUsers: completedUsers.length,
      movieGuesses,
      topMovies,
      usersWhoDidntGuessTop,
      perfectMatches,
      shortlistSize,
      totalEarned,
      maxPossible,
      successRate,
      successfulUsers,
      userSuccessRate,
    };
  });

  // Calculate user accuracy breakdown (only if nominations exist)
  let userAccuracy: UserAccuracyRow[] = [];
  let categoryAccuracy: CategoryAccuracyRow[] = [];

  if (hasNominations) {
    userAccuracy = users
      .map((user) => {
        // For each category, count how many correct
        const counts = [0, 0, 0, 0, 0, 0]; // [0/5, 1/5, 2/5, 3/5, 4/5, 5/5]

        categories.forEach((category) => {
          const userMovies = user.prenom2Selections
            .filter((sel) => sel.categoryId === category.id)
            .map((sel) => sel.movie.id);

          // Only count if user completed category
          if (userMovies.length === 5) {
            const nominatedIds = new Set(
              category.nominations.map((n) => n.movieId)
            );
            const correctCount = userMovies.filter((id) =>
              nominatedIds.has(id)
            ).length;
            counts[correctCount]++;
          }
        });

        return {
          userName: user.name,
          counts,
        };
      })
      .sort((a, b) => a.userName.localeCompare(b.userName, 'cs'));

    // Calculate category accuracy breakdown
    categoryAccuracy = categories.map((category) => {
      const counts = [0, 0, 0, 0, 0, 0]; // [0/5, 1/5, 2/5, 3/5, 4/5, 5/5]
      const nominatedIds = new Set(category.nominations.map((n) => n.movieId));
      const shortlistSize = category.movies.length;

      users.forEach((user) => {
        const userMovies = user.prenom2Selections
          .filter((sel) => sel.categoryId === category.id)
          .map((sel) => sel.movie.id);

        // Only count if user completed category
        if (userMovies.length === 5) {
          const correctCount = userMovies.filter((id) =>
            nominatedIds.has(id)
          ).length;
          counts[correctCount]++;
        }
      });

      // Minimum correct guesses for 1 Kč: 2 for shortlist >= 20, 3 otherwise
      const minSuccessIndex = shortlistSize >= 20 ? 2 : 3;

      return {
        categoryId: category.id,
        categoryName: category.name,
        shortlistSize,
        counts,
        minSuccessIndex,
      };
    });
  }

  return (
    <Prenom2StatsClient
      categories={categoryStats}
      userAccuracy={userAccuracy}
      categoryAccuracy={categoryAccuracy}
      hasNominations={hasNominations}
    />
  );
}
