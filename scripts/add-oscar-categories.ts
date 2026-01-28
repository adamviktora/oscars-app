import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Classic Oscar categories that are NOT part of prenom2.
 * These are the main categories where predictions happen.
 * 
 * Note: Some categories like Cinematography, Sound, Music, etc. are already in the database
 * as prenom2 categories (isPrenom2 = true).
 * 
 * The categories below are the standard Oscar categories that were missing.
 */
const newOscarCategories = [
  // Major categories
  {
    name: 'Režie',
    slug: 'director',
    order: 101,
    isPrenom2: false,
  },
  {
    name: 'Herec v hlavní roli',
    slug: 'actor',
    order: 102,
    isPrenom2: false,
  },
  {
    name: 'Herečka v hlavní roli',
    slug: 'actress',
    order: 103,
    isPrenom2: false,
  },
  {
    name: 'Herec ve vedlejší roli',
    slug: 'supporting-actor',
    order: 104,
    isPrenom2: false,
  },
  {
    name: 'Herečka ve vedlejší roli',
    slug: 'supporting-actress',
    order: 105,
    isPrenom2: false,
  },
  {
    name: 'Původní scénář',
    slug: 'original-screenplay',
    order: 106,
    isPrenom2: false,
  },
  {
    name: 'Adaptovaný scénář',
    slug: 'adapted-screenplay',
    order: 107,
    isPrenom2: false,
  },
  {
    name: 'Nejlepší animovaný film',
    slug: 'animated-feature',
    order: 108,
    isPrenom2: false,
  },
  {
    name: 'Výprava',
    slug: 'production-design',
    order: 109,
    isPrenom2: false,
  },
  {
    name: 'Kostýmy',
    slug: 'costume-design',
    order: 110,
    isPrenom2: false,
  },
  {
    name: 'Střih',
    slug: 'film-editing',
    order: 111,
    isPrenom2: false,
  },
];

async function main() {
  console.log('Adding new Oscar categories...\n');

  for (const category of newOscarCategories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (existing) {
      console.log(`  ⏭️  Skipping "${category.name}" (already exists)`);
      continue;
    }

    await prisma.category.create({
      data: category,
    });
    console.log(`  ✅ Added "${category.name}"`);
  }

  // Also update the best-picture category to have isPrenom2 = false (if it exists)
  const bestPicture = await prisma.category.findUnique({
    where: { slug: 'best-picture' },
  });

  if (bestPicture) {
    await prisma.category.update({
      where: { slug: 'best-picture' },
      data: { isPrenom2: false },
    });
    console.log('\n  ✅ Updated "Nejlepší film" (best-picture) to isPrenom2 = false');
  }

  console.log('\n✅ Done! New Oscar categories have been added.');
  console.log('\nSummary of all categories:');
  
  const allCategories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      order: true,
      isPrenom2: true,
    },
  });

  console.log('\nPrenom2 categories (shortlist voting):');
  allCategories
    .filter((c) => c.isPrenom2)
    .forEach((c) => console.log(`  - ${c.name} (${c.slug})`));

  console.log('\nOther Oscar categories:');
  allCategories
    .filter((c) => !c.isPrenom2)
    .forEach((c) => console.log(`  - ${c.name} (${c.slug})`));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
