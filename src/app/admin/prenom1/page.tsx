import prisma from '@/lib/prisma';
import { Prenom1GuessesClient } from './client';

export default async function AdminPrenom1Page() {
  // Fetch all users with their ranked selections (ranking 1-10)
  const users = await prisma.user.findMany({
    where: {
      email: { not: 'robinzon@skaut.cz' },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      movieSelectionsPrenom: {
        where: {
          ranking: { not: null, lte: 10 },
        },
        orderBy: { ranking: 'asc' },
        select: {
          ranking: true,
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

  // Transform data for the client
  const usersData = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    rankings: user.movieSelectionsPrenom.map((sel) => ({
      ranking: sel.ranking!,
      movieName: sel.movie.name,
    })),
  }));

  return <Prenom1GuessesClient users={usersData} />;
}
