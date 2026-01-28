import prisma from '@/lib/prisma';
import { Nominations2Client } from './client';

export default async function AdminNominations2Page() {
  // Fetch all categories with their movies (only prenom2 categories)
  const categories = await prisma.category.findMany({
    where: {
      isPrenom2: true,
    },
    orderBy: { order: 'asc' },
    include: {
      shortlistNominations: {
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
    movies: cat.shortlistNominations.map((sn) => ({
      id: sn.movie.id,
      name: sn.movie.name,
    })),
    nominatedMovieIds: cat.nominations.map((n) => n.movieId),
  }));

  return <Nominations2Client categories={categoriesData} />;
}
