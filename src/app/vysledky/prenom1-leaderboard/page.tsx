import prisma from '@/lib/prisma';
import { Prenom1LeaderboardClient } from './client';

interface UserScore {
  id: string;
  name: string;
  email: string;
  successCount: number;
  rankSum: number;
  preferencePoints: number;
  position: number;
  successfulMovies: { name: string; rank: number; points: number }[];
}

export default async function Prenom1LeaderboardPage() {
  // Get the best-picture category and its nominations
  const bestPictureCategory = await prisma.category.findUnique({
    where: { slug: 'best-picture' },
    include: {
      nominations: {
        select: { movieId: true },
      },
    },
  });

  // If no nominations yet, show a message
  if (!bestPictureCategory || bestPictureCategory.nominations.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Žebříček - Prenominační kolo</h1>
        <p className="text-base-content/60">
          Nominace zatím nebyly zadány. Žebříček bude dostupný po zadání nominací.
        </p>
      </div>
    );
  }

  const nominatedMovieIds = new Set(bestPictureCategory.nominations.map((n) => n.movieId));

  // Calculate overall preference points for all movies (same as prenom1-preferences)
  const allMovies = await prisma.movie.findMany({
    where: { prenom1Order: { not: null } },
    select: { id: true, name: true },
  });

  const allSelections = await prisma.userMovieSelectionPrenom.findMany({
    where: {
      ranking: { not: null, lte: 10 },
      user: {
        prenom1FinalSubmitted: true,
        email: { not: 'robinzon@skaut.cz' },
      },
    },
    select: {
      movieId: true,
      ranking: true,
    },
  });

  // Calculate preference points for each movie
  const moviePreferencePoints = new Map<number, number>();
  allMovies.forEach((movie) => {
    moviePreferencePoints.set(movie.id, 0);
  });

  allSelections.forEach((selection) => {
    if (selection.ranking) {
      const points = 11 - selection.ranking;
      const current = moviePreferencePoints.get(selection.movieId) || 0;
      moviePreferencePoints.set(selection.movieId, current + points);
    }
  });

  // Get movie names map
  const movieNames = new Map<number, string>();
  allMovies.forEach((movie) => {
    movieNames.set(movie.id, movie.name);
  });

  // Get all users with their top 10 guesses who have finalized
  const users = await prisma.user.findMany({
    where: {
      prenom1FinalSubmitted: true,
      email: { not: 'robinzon@skaut.cz' },
    },
    select: {
      id: true,
      name: true,
      email: true,
      movieSelectionsPrenom: {
        where: {
          ranking: { not: null, lte: 10 },
        },
        select: {
          movieId: true,
          ranking: true,
        },
      },
    },
  });

  // Calculate scores for each user
  const userScores: UserScore[] = users.map((user) => {
    const successfulMovies: { name: string; rank: number; points: number }[] = [];
    let rankSum = 0;
    let preferencePoints = 0;

    user.movieSelectionsPrenom.forEach((selection) => {
      if (selection.ranking && nominatedMovieIds.has(selection.movieId)) {
        const movieName = movieNames.get(selection.movieId) || 'Unknown';
        const points = moviePreferencePoints.get(selection.movieId) || 0;
        
        successfulMovies.push({
          name: movieName,
          rank: selection.ranking,
          points: points,
        });
        
        rankSum += selection.ranking;
        preferencePoints += points;
      }
    });

    // Sort successful movies by rank
    successfulMovies.sort((a, b) => a.rank - b.rank);

    return {
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      successCount: successfulMovies.length,
      rankSum,
      preferencePoints,
      position: 0,
      successfulMovies,
    };
  });

  // Sort users by the algorithm:
  // 1. successCount (desc)
  // 2. rankSum (asc) - lower is better
  // 3. preferencePoints (asc) - lower is better (riskier picks)
  userScores.sort((a, b) => {
    if (b.successCount !== a.successCount) {
      return b.successCount - a.successCount;
    }
    if (a.rankSum !== b.rankSum) {
      return a.rankSum - b.rankSum;
    }
    return a.preferencePoints - b.preferencePoints;
  });

  // Assign positions (same position for ties)
  userScores.forEach((user, index) => {
    if (index === 0) {
      user.position = 1;
    } else {
      const prev = userScores[index - 1];
      if (
        user.successCount === prev.successCount &&
        user.rankSum === prev.rankSum &&
        user.preferencePoints === prev.preferencePoints
      ) {
        user.position = prev.position;
      } else {
        user.position = index + 1;
      }
    }
  });

  const totalUsers = users.length;
  const prizeAmount = 35 * totalUsers;

  return (
    <Prenom1LeaderboardClient
      users={userScores}
      totalUsers={totalUsers}
      prizeAmount={prizeAmount}
      nominatedCount={nominatedMovieIds.size}
    />
  );
}
