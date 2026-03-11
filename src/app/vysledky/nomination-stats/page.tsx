import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/constants';
import { NOMINATION_CASH } from '@/lib/nomination-cash';
import { NominationStatsClient } from '@/app/vysledky/nomination-stats/client';

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

export default async function NominationStatsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const currentUser = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      })
    : null;

  const userIsAdmin = isAdmin(currentUser?.email);

  const allUsers = await prisma.user.findMany({
    where: { email: { not: 'robinzon@skaut.cz' } },
    select: { id: true, name: true, nominationFinalSubmitted: true },
  });

  const totalUsers = allUsers.length;
  const finalizedUsers = allUsers.filter((u) => u.nominationFinalSubmitted);
  const allFinalized = finalizedUsers.length === totalUsers;

  if (!allFinalized && !userIsAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">
          Statistiky — Nominační kolo
        </h1>
        <div className="bg-base-100 rounded-lg shadow p-6">
          <p className="text-base-content/60">
            Stránka bude dostupná po odevzdání všech účastníků.
          </p>
        </div>
      </div>
    );
  }

  const finalizedUserIds = new Set(finalizedUsers.map((u) => u.id));

  const categories = await prisma.category.findMany({
    where: { nominations: { some: {} } },
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

  const rankings = await prisma.userNominationRanking.findMany({
    where: {
      userId: { in: [...finalizedUserIds] },
    },
    select: {
      userId: true,
      nominationId: true,
      ranking: true,
    },
  });

  const rankingsByNomination = new Map<number, number[]>();
  for (const r of rankings) {
    const existing = rankingsByNomination.get(r.nominationId) || [];
    existing.push(r.ranking);
    rankingsByNomination.set(r.nominationId, existing);
  }

  const numRespondents = finalizedUsers.length;

  // === Celkový posudek data ===
  const posudekCategories = sortedCategories.map((cat) => {
    const cashTier = NOMINATION_CASH[cat.slug];
    const maxRanking = cat.slug === 'best-picture' ? 10 : 5;
    const isActorCategory = ACTOR_CATEGORIES.has(cat.slug);

    const movies = cat.nominations.map((nom) => {
      const userRankings = rankingsByNomination.get(nom.id) || [];

      let totalCash = 0;
      const placementCounts = new Array(maxRanking).fill(0) as number[];

      for (const ranking of userRankings) {
        if (cashTier && ranking >= 1 && ranking <= maxRanking) {
          totalCash += cashTier[ranking - 1];
          placementCounts[ranking - 1]++;
        }
      }

      return {
        movieName: nom.movie.name,
        actorName: nom.actor?.fullName ?? null,
        totalCash,
        avgCash:
          numRespondents > 0
            ? Math.round((totalCash / numRespondents) * 10) / 10
            : 0,
        placementCounts,
      };
    });

    movies.sort((a, b) => {
      if (b.totalCash !== a.totalCash) return b.totalCash - a.totalCash;
      for (let i = 0; i < a.placementCounts.length; i++) {
        if (b.placementCounts[i] !== a.placementCounts[i]) {
          return b.placementCounts[i] - a.placementCounts[i];
        }
      }
      return 0;
    });

    const moviesWithPosition: (typeof movies[number] & {
      position: number;
    })[] = [];
    for (let idx = 0; idx < movies.length; idx++) {
      const m = movies[idx];
      let position: number;
      if (idx === 0) {
        position = 1;
      } else {
        const prev = movies[idx - 1];
        const sameScore = m.totalCash === prev.totalCash;
        const samePlacements = m.placementCounts.every(
          (count, j) => count === prev.placementCounts[j]
        );
        position =
          sameScore && samePlacements
            ? moviesWithPosition[idx - 1].position
            : idx + 1;
      }
      moviesWithPosition.push({ ...m, position });
    }

    return {
      categoryName: cat.name,
      slug: cat.slug,
      isActorCategory,
      maxRanking,
      movies: moviesWithPosition,
    };
  });

  // === Celková šance filmů data ===
  // Keyed by resolved movie name (songs stripped of " – SongTitle" suffix)
  const movieAggregates = new Map<
    string,
    {
      movieName: string;
      totalCash: number;
      nominationCount: number;
      lowestCategoryTier: number;
      categories: string[];
    }
  >();

  for (const cat of sortedCategories) {
    const cashTier = NOMINATION_CASH[cat.slug];
    const maxRanking = cat.slug === 'best-picture' ? 10 : 5;
    const categoryFirstPlaceCash = cashTier ? cashTier[0] : 0;
    const isSong = cat.slug === 'song';

    for (const nom of cat.nominations) {
      let resolvedName = nom.movie.name;
      if (isSong) {
        const sep = resolvedName.indexOf(' \u2013 ');
        if (sep !== -1) resolvedName = resolvedName.substring(0, sep);
      }

      const userRankings = rankingsByNomination.get(nom.id) || [];
      let nomCash = 0;
      for (const ranking of userRankings) {
        if (cashTier && ranking >= 1 && ranking <= maxRanking) {
          nomCash += cashTier[ranking - 1];
        }
      }

      const existing = movieAggregates.get(resolvedName);
      if (existing) {
        existing.totalCash += nomCash;
        existing.nominationCount++;
        existing.lowestCategoryTier = Math.min(
          existing.lowestCategoryTier,
          categoryFirstPlaceCash
        );
        if (!existing.categories.includes(cat.name)) {
          existing.categories.push(cat.name);
        }
      } else {
        movieAggregates.set(resolvedName, {
          movieName: resolvedName,
          totalCash: nomCash,
          nominationCount: 1,
          lowestCategoryTier: categoryFirstPlaceCash,
          categories: [cat.name],
        });
      }
    }
  }

  const sortedMovies = [...movieAggregates.values()]
    .filter((m) => m.totalCash > 0)
    .sort((a, b) => {
      if (b.totalCash !== a.totalCash) return b.totalCash - a.totalCash;
      if (a.nominationCount !== b.nominationCount)
        return a.nominationCount - b.nominationCount;
      return a.lowestCategoryTier - b.lowestCategoryTier;
    });

  const movieChances: {
    movieName: string;
    totalCash: number;
    nominationCount: number;
    categories: string[];
    position: number;
  }[] = [];

  for (let idx = 0; idx < sortedMovies.length; idx++) {
    const m = sortedMovies[idx];
    let position: number;
    if (idx === 0) {
      position = 1;
    } else {
      const prev = sortedMovies[idx - 1];
      const sameAsPrev =
        m.totalCash === prev.totalCash &&
        m.nominationCount === prev.nominationCount &&
        m.lowestCategoryTier === prev.lowestCategoryTier;
      position = sameAsPrev ? movieChances[idx - 1].position : idx + 1;
    }
    movieChances.push({
      movieName: m.movieName,
      totalCash: m.totalCash,
      nominationCount: m.nominationCount,
      categories: m.categories,
      position,
    });
  }

  // === Objektivita / Subjektivita data ===

  const userNameMap = new Map(
    allUsers
      .filter((u) => finalizedUserIds.has(u.id))
      .map((u) => [u.id, u.name])
  );

  const nominationInfoMap = new Map<
    number,
    { movieName: string; actorName: string | null; catSlug: string }
  >();
  for (const cat of sortedCategories) {
    for (const nom of cat.nominations) {
      nominationInfoMap.set(nom.id, {
        movieName: nom.movie.name,
        actorName: nom.actor?.fullName ?? null,
        catSlug: cat.slug,
      });
    }
  }

  // Per-user, per-category ranking maps: userId → catSlug → (nominationId → ranking)
  const userCatRankMap = new Map<
    string,
    Map<string, Map<number, number>>
  >();
  for (const r of rankings) {
    const info = nominationInfoMap.get(r.nominationId);
    if (!info) continue;
    let userMap = userCatRankMap.get(r.userId);
    if (!userMap) {
      userMap = new Map();
      userCatRankMap.set(r.userId, userMap);
    }
    let catMap = userMap.get(info.catSlug);
    if (!catMap) {
      catMap = new Map();
      userMap.set(info.catSlug, catMap);
    }
    catMap.set(r.nominationId, r.ranking);
  }

  // Consensus groups per category (nominations grouped by equal total cash)
  const consensusByCategory = new Map<
    string,
    { nomIds: Set<number>; cash: number }[]
  >();
  for (const cat of sortedCategories) {
    const cashTier = NOMINATION_CASH[cat.slug];
    const maxRanking = cat.slug === 'best-picture' ? 10 : 5;
    const nomCashList: { nomId: number; cash: number }[] = [];
    for (const nom of cat.nominations) {
      const allRanks = rankingsByNomination.get(nom.id) || [];
      let totalCash = 0;
      for (const rank of allRanks) {
        if (cashTier && rank >= 1 && rank <= maxRanking) {
          totalCash += cashTier[rank - 1];
        }
      }
      nomCashList.push({ nomId: nom.id, cash: totalCash });
    }
    nomCashList.sort((a, b) => b.cash - a.cash);

    const groups: { nomIds: Set<number>; cash: number }[] = [];
    for (const item of nomCashList) {
      if (groups.length > 0 && groups[groups.length - 1].cash === item.cash) {
        groups[groups.length - 1].nomIds.add(item.nomId);
      } else {
        groups.push({ nomIds: new Set([item.nomId]), cash: item.cash });
      }
    }
    consensusByCategory.set(cat.slug, groups);
  }

  const finalizedUserIdArr = [...finalizedUserIds];

  const objectivityCategories = sortedCategories.map((cat) => {
    const maxRanking = cat.slug === 'best-picture' ? 10 : 5;
    const isActorCategory = ACTOR_CATEGORIES.has(cat.slug);

    // 1. User-user matches: group users with identical complete ranking vectors
    const vectorGroups = new Map<string, string[]>();
    for (const userId of finalizedUserIdArr) {
      const catRanks = userCatRankMap.get(userId)?.get(cat.slug);
      if (!catRanks) continue;
      const rankedEntries = [...catRanks.entries()].filter(
        ([, rank]) => rank >= 1 && rank <= maxRanking
      );
      if (rankedEntries.length < maxRanking) continue;
      rankedEntries.sort((a, b) => a[0] - b[0]);
      const key = rankedEntries
        .map(([nId, r]) => `${nId}:${r}`)
        .join(',');
      if (!vectorGroups.has(key)) vectorGroups.set(key, []);
      vectorGroups.get(key)!.push(userId);
    }

    const matchingGroups = [...vectorGroups.values()]
      .filter((group) => group.length > 1)
      .sort((a, b) => b.length - a.length)
      .map((group) =>
        group.map((uid) => userNameMap.get(uid) ?? uid)
      );

    // 2. Consensus match (respecting ties — tied nominations are interchangeable)
    const consensusGroups = consensusByCategory.get(cat.slug) ?? [];
    const consensusMatchers: string[] = [];
    for (const userId of finalizedUserIdArr) {
      const catRanks = userCatRankMap.get(userId)?.get(cat.slug);
      if (!catRanks) continue;
      const rankedEntries = [...catRanks.entries()].filter(
        ([, rank]) => rank >= 1 && rank <= maxRanking
      );
      if (rankedEntries.length < maxRanking) continue;

      const userPosToNom = new Map<number, number>();
      for (const [nomId, rank] of rankedEntries) {
        userPosToNom.set(rank, nomId);
      }

      let matches = true;
      let pos = 1;
      for (const group of consensusGroups) {
        if (pos > maxRanking) break;
        const groupEnd = Math.min(
          pos + group.nomIds.size - 1,
          maxRanking
        );
        for (let p = pos; p <= groupEnd; p++) {
          const userNom = userPosToNom.get(p);
          if (!userNom || !group.nomIds.has(userNom)) {
            matches = false;
            break;
          }
        }
        if (!matches) break;
        pos = groupEnd + 1;
      }

      if (matches) {
        consensusMatchers.push(userNameMap.get(userId) ?? userId);
      }
    }
    consensusMatchers.sort((a, b) => a.localeCompare(b, 'cs'));

    // 3. Unique first-place picks (only one user picked this nomination at #1)
    const firstPlacePickers = new Map<number, string[]>();
    for (const userId of finalizedUserIdArr) {
      const catRanks = userCatRankMap.get(userId)?.get(cat.slug);
      if (!catRanks) continue;
      for (const [nomId, rank] of catRanks) {
        if (rank !== 1) continue;
        if (!firstPlacePickers.has(nomId))
          firstPlacePickers.set(nomId, []);
        firstPlacePickers.get(nomId)!.push(userId);
      }
    }

    const uniqueFirstPlaces: {
      displayName: string;
      userName: string;
    }[] = [];
    for (const [nomId, pickers] of firstPlacePickers) {
      if (pickers.length !== 1) continue;
      const info = nominationInfoMap.get(nomId);
      if (!info) continue;
      const displayName =
        isActorCategory && info.actorName
          ? `${info.actorName} — ${info.movieName}`
          : info.movieName;
      uniqueFirstPlaces.push({
        displayName,
        userName: userNameMap.get(pickers[0]) ?? pickers[0],
      });
    }

    return {
      categoryName: cat.name,
      slug: cat.slug,
      isActorCategory,
      maxRanking,
      matchingGroups,
      consensusMatchers,
      uniqueFirstPlaces,
    };
  });

  return (
    <NominationStatsClient
      posudekCategories={posudekCategories}
      movieChances={movieChances}
      objectivityCategories={objectivityCategories}
      numRespondents={numRespondents}
      allFinalized={allFinalized}
      totalUsers={totalUsers}
    />
  );
}
