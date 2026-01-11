import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all UserMovieSelectionPrenom where the movie's prenom1Order is NULL
  // const result = await prisma.userMovieSelectionPrenom.deleteMany({
  //   where: {
  //     movie: {
  //       prenom1Order: null,
  //     },
  //   },
  // });

  // console.log(`Deleted ${result.count} selections where prenom1Order = NULL`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
