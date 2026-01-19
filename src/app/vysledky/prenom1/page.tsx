import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prenom1GuessesClient } from './client';

export default async function Prenom1ResultsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Get current user's final submission status
  const currentUser = session ? await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prenom1FinalSubmitted: true },
  }) : null;

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
      prenom1FinalSubmitted: true,
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
    finalSubmitted: user.prenom1FinalSubmitted,
    rankings: user.movieSelectionsPrenom.map((sel) => ({
      ranking: sel.ranking!,
      movieName: sel.movie.name,
    })),
  }));

  return (
    <Prenom1GuessesClient
      users={usersData}
      viewerFinalized={currentUser?.prenom1FinalSubmitted ?? false}
    />
  );
}
