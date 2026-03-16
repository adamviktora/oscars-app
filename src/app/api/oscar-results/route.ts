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

    const winnersByCategory = new Map<number, typeof winners>();
    for (const w of winners) {
      const existing = winnersByCategory.get(w.categoryId) ?? [];
      existing.push(w);
      winnersByCategory.set(w.categoryId, existing);
    }

    const announcedCategories: {
      categoryId: number;
      categoryName: string;
      categorySlug: string;
      categoryOrder: number;
      winnerName: string;
      movieName: string;
      actorName: string | null;
    }[] = [];

    for (const [, categoryWinners] of winnersByCategory) {
      const first = categoryWinners[0];
      const slug = first.category.slug;

      const winnerNames = categoryWinners.map(
        (w) => w.nomination.actor?.fullName ?? w.nomination.movie.name
      );

      for (const u of users) {
        const entry = leaderboard[u.id];
        if (!entry) continue;

        let bestRanking: number | null = null;
        for (const w of categoryWinners) {
          const ranking = w.nomination.userRankings.find(
            (r) => r.userId === u.id
          )?.ranking ?? null;
          if (ranking !== null && (bestRanking === null || ranking < bestRanking)) {
            bestRanking = ranking;
          }
        }

        const cash = bestRanking !== null
          ? getNominationCashReward(slug, bestRanking)
          : 0;

        entry.total += cash;
        entry.categories[slug] = { cash, ranking: bestRanking };
        if (bestRanking === 1) {
          entry.firstPlaces += 1;
        }
      }

      announcedCategories.push({
        categoryId: first.category.id,
        categoryName: first.category.name,
        categorySlug: slug,
        categoryOrder: first.category.order,
        winnerName: winnerNames.join(' / '),
        movieName: categoryWinners.map((w) => w.nomination.movie.name).join(' / '),
        actorName: categoryWinners.some((w) => w.nomination.actor)
          ? categoryWinners
              .map((w) => w.nomination.actor?.fullName)
              .filter(Boolean)
              .join(' / ')
          : null,
      });
    }

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
      announced: winnersByCategory.has(c.id),
    }));

    return NextResponse.json({
      leaderboard: sortedLeaderboard,
      announcedCategories,
      allCategories: allCategoriesList,
      isAdmin: isAdmin(session?.user.email),
    });
  } catch (error) {
    console.error('Error fetching oscar results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oscar results' },
      { status: 500 }
    );
  }
}
