import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import { Prenom2GuessesClient } from '@/app/admin/prenom2/client';

export default async function Prenom2ResultsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prenom2FinalSubmitted: true },
  });

  if (!isAdmin(session.user.email) && !user?.prenom2FinalSubmitted) {
    redirect('/prenomination2');
  }

  const categories = await prisma.prenom2Category.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  const users = await prisma.user.findMany({
    where: {
      email: { not: 'robinzon@skaut.cz' },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      prenom2FinalSubmitted: true,
      prenom2Selections: {
        select: {
          categoryId: true,
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

  const usersData = users.map((userData) => {
    const selectionsByCategory = new Map<number, string[]>();

    userData.prenom2Selections.forEach((sel) => {
      const existing = selectionsByCategory.get(sel.categoryId) || [];
      existing.push(sel.movie.name);
      selectionsByCategory.set(sel.categoryId, existing);
    });

    let completeCategories = 0;
    selectionsByCategory.forEach((movies) => {
      if (movies.length === 5) completeCategories++;
    });

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      finalSubmitted: userData.prenom2FinalSubmitted,
      completeCategories,
      totalCategories: categories.length,
      categorySelections: categories.map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        movies: (selectionsByCategory.get(cat.id) || []).sort((a, b) =>
          a.localeCompare(b, 'cs')
        ),
      })),
    };
  });

  return (
    <Prenom2GuessesClient
      users={usersData}
      title="Výsledky - Prenominační kolo 2.0"
      viewerFinalized
    />
  );
}
