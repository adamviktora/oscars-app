import prisma from '@/lib/prisma';
import { Prenom1PreferencesClient } from './client';

interface MovieStats {
  id: number;
  name: string;
  points: number;
  frequency: number;
  bestPosition: number; // Best (lowest) ranking position
  position: number; // Display position (can be same for ties)
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

  // Calculate points, frequency, and best position for each movie
  const movieStatsMap = new Map<
    number,
    { points: number; frequency: number; bestPosition: number }
  >();

  // Initialize all movies with 0 points, 0 frequency, and worst position (11)
  movies.forEach((movie) => {
    movieStatsMap.set(movie.id, { points: 0, frequency: 0, bestPosition: 11 });
  });

  // Calculate stats from selections
  selections.forEach((selection) => {
    const stats = movieStatsMap.get(selection.movieId);
    if (stats && selection.ranking) {
      // Points: rank 1 = 10 points, rank 2 = 9 points, ..., rank 10 = 1 point
      const points = 11 - selection.ranking;
      stats.points += points;
      stats.frequency += 1;
      // Track best (lowest) position
      if (selection.ranking < stats.bestPosition) {
        stats.bestPosition = selection.ranking;
      }
    }
  });

  // Create sorted array of movie stats (excluding movies with 0 points)
  const sortedMovies = movies
    .map((movie) => {
      const stats = movieStatsMap.get(movie.id) || {
        points: 0,
        frequency: 0,
        bestPosition: 11,
      };
      return {
        id: movie.id,
        name: movie.name,
        points: stats.points,
        frequency: stats.frequency,
        bestPosition: stats.bestPosition,
        position: 0, // Will be assigned after sorting
      };
    })
    .filter((movie) => movie.points > 0)
    .sort((a, b) => {
      // Sort by points descending
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // Then by frequency descending
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      // Then by best position ascending (lower = better)
      return a.bestPosition - b.bestPosition;
    });

  // Assign display positions (same position for identical stats)
  const movieStats: MovieStats[] = sortedMovies.reduce<MovieStats[]>(
    (acc, movie, index) => {
      let position = 1;
      if (index > 0) {
        const prev = acc[index - 1];
        // If stats are same as previous, use same position
        if (
          movie.points === prev.points &&
          movie.frequency === prev.frequency &&
          movie.bestPosition === prev.bestPosition
        ) {
          position = prev.position;
        } else {
          position = index + 1;
        }
      }
      acc.push({ ...movie, position });
      return acc;
    },
    []
  );

  return (
    <Prenom1PreferencesClient
      movies={movieStats}
      maxFrequency={finalizedUsersCount}
    />
  );
}
