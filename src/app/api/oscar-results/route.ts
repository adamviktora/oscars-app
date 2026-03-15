import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getNominationCashReward } from '@/lib/nomination-cash';
import { getPrenom2TotalsByUser } from '@/lib/prenom2';
import { isAdmin } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [winners, users, allCategories, prenom2Totals] = await Promise.all([
      prisma.oscarWinner.findMany({
        include: {
          category: { select: { id: true, name: true, slug: true, order: true } },
          nomination: {
            include: {
              movie: { select: { name: true } },
              actor: { select: { fullName: true } },
              userRankings: {
                select: { userId: true, ranking: true },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          email: { not: 'robinzon@skaut.cz' },
          nominationFinalSubmitted: true,
        },
        select: { id: true, name: true },
      }),
      prisma.category.findMany({
        where: {
          nominations: { some: {} },
        },
        select: { id: true, name: true, slug: true, order: true },
        orderBy: { order: 'asc' },
      }),
      getPrenom2TotalsByUser(),
    ]);

    const leaderboard: Record<
      string,
      {
        name: string;
        total: number;
        firstPlaces: number;
        prenom2Total: number;
        categories: Record<string, { cash: number; ranking: number | null }>;
      }
    > = {};

    for (const u of users) {
      leaderboard[u.id] = {
        name: u.name,
        total: 0,
        firstPlaces: 0,
        prenom2Total: prenom2Totals.get(u.id) ?? 0,
        categories: {},
      };
    }

    const announcedCategories = winners.map((w) => {
      const slug = w.category.slug;
      const displayName =
        w.nomination.actor?.fullName ?? w.nomination.movie.name;

      const rankingsByUser = new Map(
        w.nomination.userRankings.map((r) => [r.userId, r.ranking])
      );

      for (const u of users) {
        const entry = leaderboard[u.id];
        if (!entry) continue;

        const userRanking = rankingsByUser.get(u.id) ?? null;
        const cash = userRanking !== null
          ? getNominationCashReward(slug, userRanking)
          : 0;

        entry.total += cash;
        entry.categories[slug] = { cash, ranking: userRanking };
        if (userRanking === 1) {
          entry.firstPlaces += 1;
        }
      }

      return {
        categoryId: w.category.id,
        categoryName: w.category.name,
        categorySlug: slug,
        categoryOrder: w.category.order,
        winnerName: displayName,
        movieName: w.nomination.movie.name,
        actorName: w.nomination.actor?.fullName ?? null,
      };
    });

    announcedCategories.sort((a, b) => a.categoryOrder - b.categoryOrder);

    const sortedLeaderboard = Object.entries(leaderboard)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return b.firstPlaces - a.firstPlaces;
      });

    const allCategoriesList = allCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      order: c.order,
      announced: winners.some((w) => w.categoryId === c.id),
    }));

    return NextResponse.json({
      leaderboard: sortedLeaderboard,
      announcedCategories,
      allCategories: allCategoriesList,
      isAdmin: isAdmin(session.user.email),
    });
  } catch (error) {
    console.error('Error fetching oscar results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oscar results' },
      { status: 500 }
    );
  }
}
