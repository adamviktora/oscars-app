import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import { Prenom1GuessesClient } from '@/app/admin/prenom1/client';

export default async function Prenom1ResultsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prenom1FinalSubmitted: true },
  });

  if (!isAdmin(session.user.email) && !user?.prenom1FinalSubmitted) {
    redirect('/prenomination');
  }

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

  const usersData = users.map((userData) => ({
    id: userData.id,
    name: userData.name,
    email: userData.email,
    finalSubmitted: userData.prenom1FinalSubmitted,
    rankings: userData.movieSelectionsPrenom.map((sel) => ({
      ranking: sel.ranking!,
      movieName: sel.movie.name,
    })),
  }));

  return (
    <Prenom1GuessesClient
      users={usersData}
      title="Výsledky - Prenominační kolo"
      showAllMovies
    />
  );
}
