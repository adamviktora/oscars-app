import prisma from '@/lib/prisma';
import { Nominations2Client } from './client';

export default async function AdminNominations2Page() {
  // Fetch all categories with their movies (excluding best-picture which is handled separately)
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
      },
      nominations: {
        select: {
          movieId: true,
        },
      },
    },
  });

  // Transform data for client
  const categoriesData = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    movies: cat.movies.map((cm) => ({
      id: cm.movie.id,
      name: cm.movie.name,
    })),
    nominatedMovieIds: cat.nominations.map((n) => n.movieId),
  }));

  return <Nominations2Client categories={categoriesData} />;
}
