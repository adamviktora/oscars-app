import prisma from '@/lib/prisma';

// Prize calculation based on correct guesses and shortlist size
// Based on PRENOM_2_CASH.md
export function calculatePrize(correctGuesses: number, shortlistSize: number): number {
  if (correctGuesses === 5) {
    if (shortlistSize <= 10) return 10;
    if (shortlistSize <= 16) return 13;
    return 17; // 20 nominací
  }
  if (correctGuesses === 4) {
    if (shortlistSize <= 10) return 5;
    if (shortlistSize <= 16) return 6;
    return 8; // 20 nominací
  }
  if (correctGuesses === 3) {
    if (shortlistSize <= 10) return 2;
    if (shortlistSize <= 16) return 3;
    return 4; // 20 nominací
  }
  if (correctGuesses === 2) {
    if (shortlistSize >= 20) return 1;
  }
  return 0;
}

export async function getPrenom2TotalsByUser(): Promise<Map<string, number>> {
  const categories = await prisma.category.findMany({
    where: { isPrenom2: true },
    select: {
      id: true,
      shortlistNominations: { select: { movieId: true } },
      nominations: { select: { movieId: true } },
    },
  });

  const categoryInfo = new Map(
    categories.map((cat) => [
      cat.id,
      {
        shortlistSize: cat.shortlistNominations.length,
        nominatedMovieIds: new Set(cat.nominations.map((n) => n.movieId)),
      },
    ])
  );

  const users = await prisma.user.findMany({
    where: {
      email: { not: 'robinzon@skaut.cz' },
      nominationFinalSubmitted: true,
    },
    select: {
      id: true,
      prenom2Selections: {
        select: { categoryId: true, movieId: true },
      },
    },
  });

  const totals = new Map<string, number>();

  for (const user of users) {
    const selectionsByCategory = new Map<number, number[]>();
    for (const sel of user.prenom2Selections) {
      const existing = selectionsByCategory.get(sel.categoryId) || [];
      existing.push(sel.movieId);
      selectionsByCategory.set(sel.categoryId, existing);
    }

    let total = 0;
    for (const cat of categories) {
      const info = categoryInfo.get(cat.id)!;
      const selections = selectionsByCategory.get(cat.id) || [];
      if (selections.length !== 5) continue;
      const correctCount = selections.filter((mid) => info.nominatedMovieIds.has(mid)).length;
      total += calculatePrize(correctCount, info.shortlistSize);
    }

    totals.set(user.id, total);
  }

  return totals;
}
