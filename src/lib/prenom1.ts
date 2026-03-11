import prisma from '@/lib/prisma';

interface Prenom1Score {
  id: string;
  successCount: number;
  rankSum: number;
  preferencePoints: number;
  position: number;
}

export function computePrenom1Scores(
  users: { id: string; selections: { movieId: number; ranking: number | null }[] }[],
  nominatedMovieIds: Set<number>,
  moviePreferencePoints: Map<number, number>,
): Prenom1Score[] {
  const scores = users.map((user) => {
    let successCount = 0;
    let rankSum = 0;
    let preferencePoints = 0;
    for (const sel of user.selections) {
      if (sel.ranking && nominatedMovieIds.has(sel.movieId)) {
        successCount++;
        rankSum += sel.ranking;
        preferencePoints += moviePreferencePoints.get(sel.movieId) || 0;
      }
    }
    return { id: user.id, successCount, rankSum, preferencePoints, position: 0 };
  });

  // 1. successCount desc  2. rankSum asc  3. preferencePoints asc
  scores.sort((a, b) => {
    if (b.successCount !== a.successCount) return b.successCount - a.successCount;
    if (a.rankSum !== b.rankSum) return a.rankSum - b.rankSum;
    return a.preferencePoints - b.preferencePoints;
  });

  scores.forEach((s, idx) => {
    if (idx === 0) {
      s.position = 1;
    } else {
      const prev = scores[idx - 1];
      s.position =
        s.successCount === prev.successCount &&
        s.rankSum === prev.rankSum &&
        s.preferencePoints === prev.preferencePoints
          ? prev.position
          : idx + 1;
    }
  });

  return scores;
}

export async function fetchPrenom1LeaderboardData() {
  const bestPictureCategory = await prisma.category.findUnique({
    where: { slug: 'best-picture' },
    include: { nominations: { select: { movieId: true } } },
  });
  const nominatedMovieIds = new Set(
    bestPictureCategory?.nominations.map((n) => n.movieId) ?? []
  );

  const allMovies = await prisma.movie.findMany({
    where: { prenom1Order: { not: null } },
    select: { id: true, name: true },
  });

  const allSelections = await prisma.userMovieSelectionPrenom.findMany({
    where: {
      ranking: { not: null, lte: 10 },
      user: {
        prenom1FinalSubmitted: true,
        email: { not: 'robinzon@skaut.cz' },
      },
    },
    select: { movieId: true, ranking: true },
  });

  const moviePreferencePoints = new Map<number, number>();
  allMovies.forEach((m) => moviePreferencePoints.set(m.id, 0));
  allSelections.forEach((s) => {
    if (s.ranking) {
      moviePreferencePoints.set(
        s.movieId,
        (moviePreferencePoints.get(s.movieId) || 0) + (11 - s.ranking),
      );
    }
  });

  const movieNames = new Map<number, string>();
  allMovies.forEach((m) => movieNames.set(m.id, m.name));

  return { nominatedMovieIds, moviePreferencePoints, movieNames };
}

export async function getPrenom1PositionMap(): Promise<Map<string, number>> {
  const { nominatedMovieIds, moviePreferencePoints } =
    await fetchPrenom1LeaderboardData();

  const users = await prisma.user.findMany({
    where: {
      prenom1FinalSubmitted: true,
      email: { not: 'robinzon@skaut.cz' },
    },
    select: {
      id: true,
      movieSelectionsPrenom: {
        where: { ranking: { not: null, lte: 10 } },
        select: { movieId: true, ranking: true },
      },
    },
  });

  const scores = computePrenom1Scores(
    users.map((u) => ({ id: u.id, selections: u.movieSelectionsPrenom })),
    nominatedMovieIds,
    moviePreferencePoints,
  );

  return new Map(scores.map((s) => [s.id, s.position]));
}
