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
      },
      create: {
        id: movie.id,
        name: movie.name,
      },
    });
    console.log(`Added/Updated movie: ${movie.name}`);
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

