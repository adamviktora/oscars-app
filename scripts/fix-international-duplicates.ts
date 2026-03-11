import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find the "international" category
  const category = await prisma.category.findUnique({
    where: { slug: 'international' },
  });

  if (!category) {
    console.error('Category "international" not found!');
    return;
  }

  console.log(`Category: ${category.name} (id: ${category.id})\n`);

  // 2. Find Nominations for this category (these have the "correct/new" movie IDs)
  const nominations = await prisma.nomination.findMany({
    where: { categoryId: category.id },
    include: { movie: true },
    orderBy: { defaultOrder: 'asc' },
  });

  console.log('=== NOMINATIONS (linked movie IDs) ===');
  for (const nom of nominations) {
    console.log(
      `  Nomination #${nom.defaultOrder}: movieId=${nom.movieId} "${nom.movie.name}"`
    );
  }

  // 3. Find all duplicate movies by name
  const nominatedMovieNames = nominations.map((n) => n.movie.name);

  console.log('\n=== DUPLICATE MOVIES IN DB ===');
  for (const name of nominatedMovieNames) {
    const movies = await prisma.movie.findMany({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
      orderBy: { id: 'asc' },
    });

    if (movies.length > 1) {
      console.log(`  "${name}" has ${movies.length} entries:`);
      for (const m of movies) {
        console.log(`    id=${m.id} name="${m.name}" prenom1Order=${m.prenom1Order}`);
      }
    } else if (movies.length === 1) {
      console.log(`  "${name}" - single entry: id=${movies[0].id} (OK)`);
    }
  }

  // 4. Find ShortlistNominations for this category (prenom2 phase - has "old" movie IDs)
  const shortlistNoms = await prisma.shortlistNomination.findMany({
    where: { categoryId: category.id },
    include: { movie: true },
  });

  console.log('\n=== SHORTLIST NOMINATIONS (prenom2 phase movie IDs) ===');
  for (const sn of shortlistNoms) {
    console.log(`  movieId=${sn.movieId} "${sn.movie.name}"`);
  }

  // 5. Build mapping: old movie ID -> new movie ID
  //    Shortlist movies have "(Country)" suffix, nomination movies don't
  const movieMapping: {
    oldId: number;
    newId: number;
    oldName: string;
    newName: string;
  }[] = [];

  for (const nom of nominations) {
    const matchingShortlist = shortlistNoms.find((sn) => {
      const shortlistBase = sn.movie.name.replace(/\s*\([^)]+\)\s*$/, '').trim();
      return shortlistBase === nom.movie.name;
    });

    if (matchingShortlist && matchingShortlist.movieId !== nom.movieId) {
      movieMapping.push({
        oldId: matchingShortlist.movieId,
        newId: nom.movieId,
        oldName: matchingShortlist.movie.name,
        newName: nom.movie.name,
      });
    }
  }

  console.log('\n=== MOVIE ID MAPPING (old -> new) ===');
  for (const m of movieMapping) {
    console.log(
      `  "${m.oldName}" (id=${m.oldId}) -> "${m.newName}" (id=${m.newId})`
    );
  }

  // 6. Find UserPrenom2Selection rows that need updating
  const oldMovieIds = movieMapping.map((m) => m.oldId);

  const selectionsToFix = await prisma.userPrenom2Selection.findMany({
    where: {
      categoryId: category.id,
      movieId: { in: oldMovieIds },
    },
    include: { user: true, movie: true },
    orderBy: [{ userId: 'asc' }, { movieId: 'asc' }],
  });

  console.log(
    `\n=== USER PRENOM2 SELECTIONS TO FIX (${selectionsToFix.length} rows) ===`
  );
  for (const sel of selectionsToFix) {
    const mapping = movieMapping.find((m) => m.oldId === sel.movieId);
    console.log(
      `  id=${sel.id} user="${sel.user.name}" movie="${sel.movie.name}" ` +
        `movieId: ${sel.movieId} -> ${mapping?.newId}`
    );
  }

  // 7. Also check: are there selections already pointing to the new IDs?
  const newMovieIds = movieMapping.map((m) => m.newId);
  const existingNewSelections = await prisma.userPrenom2Selection.findMany({
    where: {
      categoryId: category.id,
      movieId: { in: newMovieIds },
    },
    include: { user: true, movie: true },
  });

  console.log(
    `\n=== EXISTING SELECTIONS ALREADY ON NEW IDs (${existingNewSelections.length} rows) ===`
  );
  for (const sel of existingNewSelections) {
    console.log(
      `  id=${sel.id} user="${sel.user.name}" movie="${sel.movie.name}" movieId=${sel.movieId}`
    );
  }

  // 8. Check for potential unique constraint conflicts
  console.log('\n=== CONFLICT CHECK ===');
  let hasConflicts = false;
  for (const sel of selectionsToFix) {
    const mapping = movieMapping.find((m) => m.oldId === sel.movieId);
    if (!mapping) continue;

    const conflict = existingNewSelections.find(
      (e) => e.userId === sel.userId && e.movieId === mapping.newId
    );
    if (conflict) {
      console.log(
        `  CONFLICT: user="${sel.user.name}" already has selection for newId=${mapping.newId} ` +
          `(existing id=${conflict.id}, would-update id=${sel.id})`
      );
      hasConflicts = true;
    }
  }
  if (!hasConflicts) {
    console.log('  No conflicts found - safe to update!');
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  Nominations category: ${category.name} (id=${category.id})`);
  console.log(`  Duplicate movie pairs: ${movieMapping.length}`);
  console.log(`  UserPrenom2Selection rows to update: ${selectionsToFix.length}`);
  console.log(`  Has conflicts: ${hasConflicts}`);

  if (hasConflicts) {
    console.log('\n❌ Aborting — resolve conflicts first.');
    return;
  }

  if (selectionsToFix.length === 0) {
    console.log('\nNothing to update.');
    return;
  }

  // 9. Perform the updates
  console.log('\n=== UPDATING... ===');
  let updated = 0;
  for (const sel of selectionsToFix) {
    const mapping = movieMapping.find((m) => m.oldId === sel.movieId);
    if (!mapping) continue;

    await prisma.userPrenom2Selection.update({
      where: { id: sel.id },
      data: { movieId: mapping.newId },
    });
    updated++;
    console.log(
      `  ✅ id=${sel.id} user="${sel.user.name}": movieId ${mapping.oldId} -> ${mapping.newId}`
    );
  }

  console.log(`\nDone! Updated ${updated} rows.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
