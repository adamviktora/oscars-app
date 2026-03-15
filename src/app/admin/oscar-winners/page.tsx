import prisma from '@/lib/prisma';
import { OscarWinnersClient } from '@/app/admin/oscar-winners/client';
import { sortByCategory } from '@/lib/category-order';

const ACTOR_CATEGORIES = new Set([
  'actor',
  'actress',
  'supporting-actor',
  'supporting-actress',
]);

export default async function AdminOscarWinnersPage() {
  const categories = await prisma.category.findMany({
    where: {
      nominations: { some: {} },
    },
    include: {
      nominations: {
        include: {
          movie: { select: { name: true } },
          actor: { select: { fullName: true } },
        },
        orderBy: { defaultOrder: 'asc' },
      },
      oscarWinner: {
        select: { nominationId: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  const data = sortByCategory(
    categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      isActorCategory: ACTOR_CATEGORIES.has(cat.slug),
      nominations: cat.nominations.map((nom) => ({
        id: nom.id,
        displayName: nom.actor?.fullName
          ? `${nom.actor.fullName} (${nom.movie.name})`
          : nom.movie.name,
      })),
      currentWinnerNominationId: cat.oscarWinner?.nominationId ?? null,
    }))
  );

  return <OscarWinnersClient categories={data} />;
}
