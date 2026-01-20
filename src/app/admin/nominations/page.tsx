import prisma from '@/lib/prisma';
import { NominationsClient } from './client';

export default async function AdminNominationsPage() {
  // Fetch all movies from prenomination round 1 (have prenom1Order)
  const movies = await prisma.movie.findMany({
    where: {
      prenom1Order: { not: null },
    },
    orderBy: { prenom1Order: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

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
      movies={movies}
      categoryId={bestPictureCategory.id}
      initialNominations={nominatedMovieIds}
    />
  );
}
