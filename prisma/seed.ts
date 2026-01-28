import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  slug: string;
  order: number;
  movies: string[];
}

async function main() {
  // Reset the movie ID sequence to the max existing ID
  // This fixes issues where the sequence gets out of sync
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('movie', 'id'), COALESCE((SELECT MAX(id) FROM movie), 0) + 1, false)`;

  // ========================
  // Seed Movies for Prenom 1.0
  // ========================
  // const moviesPath = path.join(__dirname, 'movies.json');
  // const moviesData = JSON.parse(fs.readFileSync(moviesPath, 'utf-8'));

  // console.log('Seeding movies for Prenom 1.0...');

  // for (const movie of moviesData) {
  //   await prisma.movie.upsert({
  //     where: { id: movie.id },
  //     update: {
  //       name: movie.name,
  //       prenom1Order: movie.id,
  //     },
  //     create: {
  //       id: movie.id,
  //       name: movie.name,
  //       prenom1Order: movie.id,
  //     },
  //   });
  //   console.log(`  Added/Updated: ${movie.name}`);
  // }

  // ========================
  // Seed Categories and Movies for Prenom 2.0
  // ========================
  const categoriesPath = path.join(__dirname, 'prenom2-categories.json');
  const categoriesData: CategoryData[] = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

  console.log('\nSeeding Prenom 2.0 categories and movies...');

  for (const categoryData of categoriesData) {
    // Create or update the category (mark as prenom2 category)
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {
        name: categoryData.name,
        order: categoryData.order,
        isPrenom2: true,
      },
      create: {
        name: categoryData.name,
        slug: categoryData.slug,
        order: categoryData.order,
        isPrenom2: true,
      },
    });
    console.log(`\nCategory: ${category.name}`);

    // Create movies and link them to the category
    for (const movieName of categoryData.movies) {
      // First, find or create the movie
      let movie = await prisma.movie.findFirst({
        where: { name: movieName },
      });

      if (!movie) {
        movie = await prisma.movie.create({
          data: { name: movieName },
        });
        console.log(`  Created movie: ${movieName}`);
      }

      // Link movie to category shortlist (upsert to avoid duplicates)
      await prisma.shortlistNomination.upsert({
        where: {
          categoryId_movieId: {
            categoryId: category.id,
            movieId: movie.id,
          },
        },
        update: {},
        create: {
          categoryId: category.id,
          movieId: movie.id,
        },
      });
      console.log(`  Linked: ${movieName}`);
    }
  }

  console.log('\nSeeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

