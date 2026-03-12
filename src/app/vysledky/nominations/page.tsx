import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import { calculatePrize } from '@/lib/prenom2';
import { getPrenom1PositionMap } from '@/lib/prenom1';
import { NominationResultsClient } from './client';

const CATEGORY_ORDER = [
  'best-picture',
  'director',
  'actor',
  'actress',
  'supporting-actor',
  'supporting-actress',
  'casting',
  'original-screenplay',
  'adapted-screenplay',
  'camera',
  'film-editing',
  'music',
  'song',
  'production-design',
  'costume-design',
  'makeup',
  'sound',
  'visual-effects',
  'international',
  'animated-feature',
  'documentary',
  'short-live-action',
  'short-animated',
  'short-documentary',
];

const ACTOR_CATEGORIES = new Set([
  'actor',
  'actress',
  'supporting-actor',
  'supporting-actress',
]);

export default async function NominationResultsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const currentUser = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { nominationFinalSubmitted: true, email: true },
      })
    : null;

  // Fetch nomination categories sorted by CATEGORY_ORDER
  const categories = await prisma.category.findMany({
    where: {
      nominations: { some: {} },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      nominations: {
        orderBy: { defaultOrder: 'asc' },
        select: {
          id: true,
          movieId: true,
          movie: { select: { name: true } },
          actor: { select: { fullName: true } },
        },
      },
    },
  });

  const sortedCategories = [...categories].sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a.slug);
    const bIdx = CATEGORY_ORDER.indexOf(b.slug);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  // Fetch prenom2 categories for bonus calculation
  const prenom2Categories = await prisma.category.findMany({
    where: { isPrenom2: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      shortlistNominations: { select: { movieId: true } },
      nominations: { select: { movieId: true } },
    },
  });

  const prenom2CategoryInfo = new Map(
    prenom2Categories.map((cat) => [
      cat.id,
      {
        shortlistSize: cat.shortlistNominations.length,
        nominatedMovieIds: new Set(cat.nominations.map((n) => n.movieId)),
      },
    ])
  );

  const prenom1PositionMap = await getPrenom1PositionMap();

  // Fetch all users with nomination rankings + prenom2 selections
  const users = await prisma.user.findMany({
    where: {
      email: { not: 'robinzon@skaut.cz' },
    },
    select: {
      id: true,
      name: true,
      email: true,
      nominationFinalSubmitted: true,
      nominationRankings: {
        select: {
          nominationId: true,
          ranking: true,
        },
      },
      prenom2Selections: {
        select: {
          categoryId: true,
          movieId: true,
        },
      },
    },
  });

  // Build nomination lookup
  const nominationLookup = new Map<
    number,
    {
      movieName: string;
      actorName: string | null;
      categoryId: number;
    }
  >();
  for (const cat of sortedCategories) {
    for (const nom of cat.nominations) {
      nominationLookup.set(nom.id, {
        movieName: nom.movie.name,
        actorName: nom.actor?.fullName ?? null,
        categoryId: cat.id,
      });
    }
  }

  const categoriesData = sortedCategories.map((cat) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    slug: cat.slug,
    isActorCategory: ACTOR_CATEGORIES.has(cat.slug),
    maxRanking: cat.slug === 'best-picture' ? 10 : 5,
  }));

  const songCategoryId = categoriesData.find(
    (c) => c.slug === 'song'
  )?.categoryId;

  const movieNominationInfo = new Map<
    string,
    {
      isNominatedForBestPicture: boolean;
      nominationCount: number;
      bestCategoryOrder: number;
    }
  >();
  for (const cat of sortedCategories) {
    const isBestPicture = cat.slug === 'best-picture';
    const isSong = cat.slug === 'song';
    const catOrder = CATEGORY_ORDER.indexOf(cat.slug);
    for (const nom of cat.nominations) {
      let resolvedName = nom.movie.name;
      if (isSong) {
        const sep = resolvedName.indexOf(' \u2013 ');
        if (sep !== -1) resolvedName = resolvedName.substring(0, sep);
      }
      const existing = movieNominationInfo.get(resolvedName);
      if (existing) {
        if (isBestPicture) existing.isNominatedForBestPicture = true;
        existing.nominationCount++;
        existing.bestCategoryOrder = Math.min(
          existing.bestCategoryOrder,
          catOrder
        );
      } else {
        movieNominationInfo.set(resolvedName, {
          isNominatedForBestPicture: isBestPicture,
          nominationCount: 1,
          bestCategoryOrder: catOrder,
        });
      }
    }
  }

  const usersData = users.map((user) => {
    // --- Nomination rankings ---
    const rankingsByCategory = new Map<
      number,
      { ranking: number; movieName: string; actorName: string | null }[]
    >();

    for (const r of user.nominationRankings) {
      const nom = nominationLookup.get(r.nominationId);
      if (!nom) continue;
      const existing = rankingsByCategory.get(nom.categoryId) || [];
      existing.push({
        ranking: r.ranking,
        movieName: nom.movieName,
        actorName: nom.actorName,
      });
      rankingsByCategory.set(nom.categoryId, existing);
    }

    let completeCategories = 0;
    for (const cat of categoriesData) {
      const rankings = rankingsByCategory.get(cat.categoryId);
      if (rankings && rankings.length === cat.maxRanking) {
        completeCategories++;
      }
    }

    // --- 1st place movies ---
    const firstPlaceCounts = new Map<string, number>();
    for (const r of user.nominationRankings) {
      if (r.ranking !== 1) continue;
      const nom = nominationLookup.get(r.nominationId);
      if (!nom) continue;
      let movieName = nom.movieName;
      if (songCategoryId != null && nom.categoryId === songCategoryId) {
        const sep = movieName.indexOf(' \u2013 ');
        if (sep !== -1) movieName = movieName.substring(0, sep);
      }
      firstPlaceCounts.set(
        movieName,
        (firstPlaceCounts.get(movieName) || 0) + 1
      );
    }

    const firstPlaceMovies = Array.from(firstPlaceCounts.entries())
      .map(([movieName, count]) => ({ movieName, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const aInfo = movieNominationInfo.get(a.movieName);
        const bInfo = movieNominationInfo.get(b.movieName);
        const aBP = aInfo?.isNominatedForBestPicture ? 1 : 0;
        const bBP = bInfo?.isNominatedForBestPicture ? 1 : 0;
        if (bBP !== aBP) return bBP - aBP;
        const aNom = aInfo?.nominationCount ?? 0;
        const bNom = bInfo?.nominationCount ?? 0;
        if (bNom !== aNom) return bNom - aNom;
        const aOrder = aInfo?.bestCategoryOrder ?? Infinity;
        const bOrder = bInfo?.bestCategoryOrder ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.movieName.localeCompare(b.movieName, 'cs');
      });

    const uniqueAwardedMovies = firstPlaceCounts.size;

    // --- Prenom2 bonus ---
    const selectionsByPrenom2Cat = new Map<number, number[]>();
    for (const sel of user.prenom2Selections) {
      const existing = selectionsByPrenom2Cat.get(sel.categoryId) || [];
      existing.push(sel.movieId);
      selectionsByPrenom2Cat.set(sel.categoryId, existing);
    }

    let prenom2Bonus = 0;
    for (const [catId, info] of prenom2CategoryInfo) {
      const movieIds = selectionsByPrenom2Cat.get(catId) || [];
      if (movieIds.length !== 5) continue;
      const correctCount = movieIds.filter((id) =>
        info.nominatedMovieIds.has(id)
      ).length;
      prenom2Bonus += calculatePrize(correctCount, info.shortlistSize);
    }

    return {
      id: user.id,
      name: user.name,
      finalSubmitted: user.nominationFinalSubmitted,
      prenom1Position: prenom1PositionMap.get(user.id) ?? null,
      completeCategories,
      totalCategories: categoriesData.length,
      prenom2Bonus,
      firstPlaceMovies,
      uniqueAwardedMovies,
      categoryRankings: categoriesData.map((cat) => {
        const rankings = rankingsByCategory.get(cat.categoryId) || [];
        rankings.sort((a, b) => a.ranking - b.ranking);
        return {
          categoryId: cat.categoryId,
          rankedCount: rankings.length,
          nominations: rankings.map((r) => ({
            ranking: r.ranking,
            movieName: r.movieName,
            actorName: r.actorName,
          })),
        };
      }),
    };
  });

  usersData.sort((a, b) => {
    const posA = a.prenom1Position ?? Infinity;
    const posB = b.prenom1Position ?? Infinity;
    return posA - posB;
  });

  return (
    <NominationResultsClient
      users={usersData}
      categories={categoriesData}
      viewerFinalized={currentUser?.nominationFinalSubmitted ?? false}
      viewerIsAdmin={isAdmin(currentUser?.email)}
    />
  );
}
