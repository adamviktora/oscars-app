import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prenom2GuessesClient } from './client';

export default async function Prenom2ResultsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Get current user's final submission status
  const currentUser = session ? await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prenom2FinalSubmitted: true },
  }) : null;

  // Fetch all categories (excluding best-picture which is not part of prenom2)
  const categories = await prisma.prenom2Category.findMany({
    where: {
      slug: { not: 'best-picture' },
    },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  // Fetch all users with their prenom2 selections
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

  // Transform data for the client
  const usersData = users.map((user) => {
    // Group selections by category
    const selectionsByCategory = new Map<number, string[]>();
    
    user.prenom2Selections.forEach((sel) => {
      const existing = selectionsByCategory.get(sel.categoryId) || [];
      existing.push(sel.movie.name);
      selectionsByCategory.set(sel.categoryId, existing);
    });

    // Count complete categories (5 selections)
    let completeCategories = 0;
    selectionsByCategory.forEach((movies) => {
      if (movies.length === 5) completeCategories++;
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      finalSubmitted: user.prenom2FinalSubmitted,
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
      viewerFinalized={currentUser?.prenom2FinalSubmitted ?? false}
    />
  );
}
