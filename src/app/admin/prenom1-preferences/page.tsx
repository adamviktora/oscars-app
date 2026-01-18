import prisma from '@/lib/prisma';
import { Prenom1PreferencesClient } from './client';

interface MovieStats {
  id: number;
  name: string;
  points: number;
  frequency: number;
}

export default async function AdminPrenom1PreferencesPage() {
  // Get all movies that are in prenom1 (have prenom1Order)
  const movies = await prisma.movie.findMany({
    where: {
      prenom1Order: { not: null },
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Get all selections with ranking 1-10 from users who have finalized
  const selections = await prisma.userMovieSelectionPrenom.findMany({
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

  // Count users who finalized prenom1
  const finalizedUsersCount = await prisma.user.count({
    where: {
      prenom1FinalSubmitted: true,
      email: { not: 'robinzon@skaut.cz' },
    },
  });

  // Calculate points and frequency for each movie
  const movieStatsMap = new Map<number, { points: number; frequency: number }>();

  // Initialize all movies with 0 points and 0 frequency
  movies.forEach((movie) => {
    movieStatsMap.set(movie.id, { points: 0, frequency: 0 });
  });

  // Calculate stats from selections
  selections.forEach((selection) => {
    const stats = movieStatsMap.get(selection.movieId);
    if (stats && selection.ranking) {
      // Points: rank 1 = 10 points, rank 2 = 9 points, ..., rank 10 = 1 point
      const points = 11 - selection.ranking;
      stats.points += points;
      stats.frequency += 1;
    }
  });

  // Create sorted array of movie stats (excluding movies with 0 points)
  const movieStats: MovieStats[] = movies
    .map((movie) => {
      const stats = movieStatsMap.get(movie.id) || { points: 0, frequency: 0 };
      return {
        id: movie.id,
        name: movie.name,
        points: stats.points,
        frequency: stats.frequency,
      };
    })
    .filter((movie) => movie.points > 0)
    .sort((a, b) => {
      // Sort by points descending, then frequency descending as tiebreaker
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.frequency - a.frequency;
    });

  return (
    <Prenom1PreferencesClient
      movies={movieStats}
      maxFrequency={finalizedUsersCount}
    />
  );
}
