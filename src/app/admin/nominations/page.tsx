import prisma from '@/lib/prisma';
import { NominationsClient } from './client';

export default async function AdminNominationsPage() {
  // Fetch all movies from prenomination round 1 (have prenom1Order)
  const movies = await prisma.movie.findMany({
    where: {
      prenom1Order: { not: null },
    },
    select: {
      id: true,
      name: true,
      prenom1Order: true,
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

  // Calculate points for each movie (same as Celková preference filmů)
  const moviePointsMap = new Map<number, { points: number; frequency: number; bestPosition: number }>();

  movies.forEach((movie) => {
    moviePointsMap.set(movie.id, { points: 0, frequency: 0, bestPosition: 11 });
  });

  selections.forEach((selection) => {
    const stats = moviePointsMap.get(selection.movieId);
    if (stats && selection.ranking) {
      const points = 11 - selection.ranking;
      stats.points += points;
      stats.frequency += 1;
      if (selection.ranking < stats.bestPosition) {
        stats.bestPosition = selection.ranking;
      }
    }
  });

  // Sort movies: first by preference (points > 0), then by prenom1Order
  const sortedMovies = movies
    .map((movie) => {
      const stats = moviePointsMap.get(movie.id) || { points: 0, frequency: 0, bestPosition: 11 };
      return {
        id: movie.id,
        name: movie.name,
        prenom1Order: movie.prenom1Order ?? 999,
        points: stats.points,
        frequency: stats.frequency,
        bestPosition: stats.bestPosition,
      };
    })
    .sort((a, b) => {
      // Movies with points come first, sorted by points (desc), then frequency (desc), then bestPosition (asc)
      if (a.points > 0 && b.points > 0) {
        if (b.points !== a.points) return b.points - a.points;
        if (b.frequency !== a.frequency) return b.frequency - a.frequency;
        return a.bestPosition - b.bestPosition;
      }
      // Movies with points come before movies without
      if (a.points > 0 && b.points === 0) return -1;
      if (a.points === 0 && b.points > 0) return 1;
      // Movies without points sorted by prenom1Order
      return a.prenom1Order - b.prenom1Order;
    })
    .map(({ id, name }) => ({ id, name }));

  // Get or create the "Nejlepší film" category for nominations
  let bestPictureCategory = await prisma.prenom2Category.findUnique({
    where: { slug: 'best-picture' },
  });

  if (!bestPictureCategory) {
    bestPictureCategory = await prisma.prenom2Category.create({
      data: {
        name: 'Nejlepší film',
        slug: 'best-picture',
        order: 0,
      },
    });
  }

  // Fetch existing nominations for best picture
  const existingNominations = await prisma.nomination.findMany({
    where: {
      categoryId: bestPictureCategory.id,
    },
    select: {
      movieId: true,
    },
  });

  const nominatedMovieIds = existingNominations.map((n) => n.movieId);

  return (
    <NominationsClient
      movies={sortedMovies}
      categoryId={bestPictureCategory.id}
      initialNominations={nominatedMovieIds}
    />
  );
}
