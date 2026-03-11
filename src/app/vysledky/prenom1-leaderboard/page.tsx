import prisma from '@/lib/prisma';
import { fetchPrenom1LeaderboardData, computePrenom1Scores } from '@/lib/prenom1';
import { Prenom1LeaderboardClient } from './client';

interface UserScore {
  id: string;
  name: string;
  email: string;
  successCount: number;
  rankSum: number;
  preferencePoints: number;
  position: number;
  successfulMovies: { name: string; rank: number; points: number }[];
}

export default async function Prenom1LeaderboardPage() {
  const { nominatedMovieIds, moviePreferencePoints, movieNames } =
    await fetchPrenom1LeaderboardData();

  if (nominatedMovieIds.size === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Žebříček - Prenominační kolo</h1>
        <p className="text-base-content/60">
          Nominace zatím nebyly zadány. Žebříček bude dostupný po zadání nominací.
        </p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    where: {
      prenom1FinalSubmitted: true,
      email: { not: 'robinzon@skaut.cz' },
    },
    select: {
      id: true,
      name: true,
      email: true,
      movieSelectionsPrenom: {
        where: { ranking: { not: null, lte: 10 } },
        select: { movieId: true, ranking: true },
      },
    },
  });

  const baseScores = computePrenom1Scores(
    users.map((u) => ({ id: u.id, selections: u.movieSelectionsPrenom })),
    nominatedMovieIds,
    moviePreferencePoints,
  );
  const scoreMap = new Map(baseScores.map((s) => [s.id, s]));

  const userScores: UserScore[] = users.map((user) => {
    const base = scoreMap.get(user.id)!;
    const successfulMovies: { name: string; rank: number; points: number }[] = [];

    user.movieSelectionsPrenom.forEach((selection) => {
      if (selection.ranking && nominatedMovieIds.has(selection.movieId)) {
        successfulMovies.push({
          name: movieNames.get(selection.movieId) || 'Unknown',
          rank: selection.ranking,
          points: moviePreferencePoints.get(selection.movieId) || 0,
        });
      }
    });
    successfulMovies.sort((a, b) => a.rank - b.rank);

    return {
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      successCount: base.successCount,
      rankSum: base.rankSum,
      preferencePoints: base.preferencePoints,
      position: base.position,
      successfulMovies,
    };
  });

  userScores.sort((a, b) => a.position - b.position);

  const totalUsers = users.length;
  const prizeAmount = 35 * totalUsers;

  return (
    <Prenom1LeaderboardClient
      users={userScores}
      totalUsers={totalUsers}
      prizeAmount={prizeAmount}
      nominatedCount={nominatedMovieIds.size}
    />
  );
}
