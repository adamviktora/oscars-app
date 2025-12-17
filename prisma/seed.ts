import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Read the movies JSON file
  const moviesPath = path.join(__dirname, 'movies.json');
  const moviesData = JSON.parse(fs.readFileSync(moviesPath, 'utf-8'));

  console.log('Seeding movies...');

  // Insert movies into the database
  for (const movie of moviesData) {
    await prisma.movie.upsert({
      where: { id: movie.id },
      update: {
        name: movie.name,
        prenom1Order: movie.id, // All movies from JSON are in Prenom 1.0
      },
      create: {
        id: movie.id,
        name: movie.name,
        prenom1Order: movie.id, // All movies from JSON are in Prenom 1.0
      },
    });
    console.log(`Added/Updated movie: ${movie.name} (prenom1Order: ${movie.id})`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

