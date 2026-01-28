import 'dotenv/config';
import { PrismaClient, Gender } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Map Czech category names to slugs
const categoryMap: Record<string, string> = {
  'NEJLEPŠÍ FILM': 'best-picture',
  REŽIE: 'director',
  'HEREC V HLAVNÍ ROLI': 'actor',
  'HEREČKA V HLAVNÍ ROLI': 'actress',
  'HEREC VE VEDLEJŠÍ ROLI': 'supporting-actor',
  'HEREČKA VE VEDLEJŠÍ ROLI': 'supporting-actress',
  CASTING: 'casting',
  MASKY: 'makeup',
  KOSTÝMY: 'costume-design',
  PÍSEŇ: 'song',
  HUDBA: 'music',
  STŘIH: 'film-editing',
  KAMERA: 'camera',
  'ADAPTOVANÝ SCÉNÁŘ': 'adapted-screenplay',
  'PŮVODNÍ SCÉNÁŘ': 'original-screenplay',
  VÝPRAVA: 'production-design',
  'NEJLEPŠÍ KRÁTKOMETRÁŽNÍ DOKUMENT': 'short-documentary',
  'NEJLEPŠÍ KRÁTKOMETRÁŽNÍ ANIMOVANÝ FILM': 'short-animated',
  'NEJLEPŠÍ KRÁTKOMETRÁŽNÍ HRANÝ FILM': 'short-live-action',
  'NEJLEPŠÍ CELOVEČERNÍ DOKUMENT': 'documentary',
  'NEJLEPŠÍ ANIMOVANÝ FILM': 'animated-feature',
  'NEJLEPŠÍ MEZINÁRODNÍ FILM': 'international',
  'VIZUÁLNÍ EFEKTY': 'visual-effects',
  ZVUK: 'sound',
};

// Actor categories (need actor info)
const actorCategories = [
  'actor',
  'actress',
  'supporting-actor',
  'supporting-actress',
];

// Categories with female actors
const femaleCategories = ['actress', 'supporting-actress'];

interface NominationData {
  categorySlug: string;
  categoryName: string;
  movieName: string;
  actorName?: string;
  gender?: Gender;
  order: number;
}

// Parse the NOMINATIONS.md content
const nominationsContent = `NEJLEPŠÍ FILM
Hříšníci (Z. Coogler, S. Ohanian, R. Coogler)
Jedna bitva za druhou (A. Somner, S. Murphy, P. T. Anderson)
Citová hodnota (M. Ekerhovd, A. Berentsen Ottmar)
Velký Marty (E. Bush, R. Bonstein, J. Safdie, A. Katagas, T. Chalamet)
Frankenstein (G. del Toro, J. M. Dale, S. Stuber)
Hamnet (L. Marshall, P. Harris, N. Gonda, S. Spielberg, S. Mendes)
Tajný agent (E. Lesclaux)
Bugonia (E. Guiney, A. Lowe, Y. Lanthimos, E. Stone, L. Knudsen)
Sny o vlacích (M. McMahon, T. Schwarzman, W. Janowitz, A. Schlaifer, M. Heimler)
F1 (C. Oman, B. Pitt, D. Gardner, J. Kleiner, J. Kosinski, J. Bruckheimer)

REŽIE
Ryan Coogler (Hříšníci)
Paul Thomas Anderson (Jedna bitva za druhou)
Joachim Trier (Citová hodnota)
Josh Safdie (Velký Marty)
Chloé Zhao (Hamnet)

HEREC V HLAVNÍ ROLI
Michael B. Jordan (Hříšníci)
Leonardo DiCaprio (Jedna bitva za druhou)
Timothée Chalamet (Velký Marty)
Wagner Moura (Tajný agent)
Ethan Hawke (Blue Moon)

HEREČKA V HLAVNÍ ROLI
Renate Reinsve (Citová hodnota)
Jessie Buckley (Hamnet)
Emma Stone (Bugonia)
Rose Byrne (Kdybych měla nohy, tak ti nakopu)
Kate Hudson (Smutný song)

HEREC VE VEDLEJŠÍ ROLI
Delroy Lindo (Hříšníci)
Sean Penn (Jedna bitva za druhou)
Benicio del Toro (Jedna bitva za druhou)
Stellan Skarsgård (Citová hodnota)
Jacob Elordi (Frankenstein)

HEREČKA VE VEDLEJŠÍ ROLI
Wunmi Mosaku (Hříšníci)
Teyana Taylor (Jedna bitva za druhou)
Inga Ibsdotter Lilleaas (Citová hodnota)
Elle Fanning (Citová hodnota)
Amy Madigan (Hodina zmizení)

CASTING
Francine Maisler (Hříšníci)
Cassandra Kulukundis (Jedna bitva za druhou)
Jennifer Venditti (Velký Marty)
Nina Gold (Hamnet)
Gabriel Domingues (Tajný agent)

MASKY
K. Diaz, M. Fontaine, S. Terry (Hříšníci)
M. Hill, J. Samuel, C. Furey (Frankenstein)
K. Hiro, G. Griffin, B. Rehbein (Mlátička)
K. Toyokawa, N. Hibino, T. Nishimatsu (Národní poklad)
T. Foldberg, A. C. Sauerberg (Ošklivá sestra)

KOSTÝMY
R. E. Carter (Hříšníci)
M. Bellizzi (Velký Marty)
K. Hawley (Frankenstein)
M. Turzanska (Hamnet)
D. L. Scott (Avatar: Oheň a popel)

PÍSEŇ
"I Lied to You" – R. Saadiq, L. Göransson (hudba a text) (Hříšníci)
"Train Dreams" – N. Cave (hudba a text); B. Dessner (text) (Sny o vlacích)
"Golden" – EJAE, M. Sonnenblick, J. G. Kwak, Y. H. Lee, H. D. Nam, J. H. Seo, T. Park (hudba a text) (K-pop: Lovkyně démonů)
"Sweat Dreams of Joy" – N. Pike (hudba a text) (Ať žije Verdi!)
"Dear Me" – D. Warren (hudba a text) (Diane Warren: Neoblomná)

HUDBA
Ludwig Göransson (Hříšníci)
Jonny Greenwood (Jedna bitva za druhou)
Alexandre Desplat (Frankenstein)
Max Richter (Hamnet)
Jerskin Fendrix (Bugonia)

STŘIH
Michael P. Shawver (Hříšníci)
Andy Jurgensen (Jedna bitva za druhou)
Ronald Bronstein a Josh Safdie (Velký Marty)
Olivier Bugge Coutté (Citová hodnota)
Stephen Mirrione (F1)

KAMERA
Autumn Durald Arkapaw (Hříšníci)
Michael Bauman (Jedna bitva za druhou)
Darius Khondji (Velký Marty)
Dan Laustsen (Frankenstein)
Adolpho Veloso (Sny o vlacích)

ADAPTOVANÝ SCÉNÁŘ
Paul Thomas Anderson podle románu Městečko Vineland (Jedna bitva za druhou)
Guillermo del Toro podle románu Frankenstein (Frankenstein)
Chloé Zhao a Maggie O'Farrell; podle románu Hamnet (Hamnet)
Will Tracy podle filmu Zachraňte zelenou planetu! (Bugonia)
Clint Bentley a Greg Kwedar podle novely Sny o vlacích (Sny o vlacích)

PŮVODNÍ SCÉNÁŘ
Ryan Coogler (Hříšníci)
Eskil Vogt a Joachim Trier (Citová hodnota)
Ronald Bronstein a Josh Safdie (Velký Marty)
Jafar Panahi ve spolupráci s Naderem Saïvarem, Shadmehrem Rastinem a Mehdím Mahmoudianem (Drobná nehoda)
Robert Kaplow (Blue Moon)

VÝPRAVA
H. Beachler (scénogr.); M. Champagne (set dek.) (Hříšníci)
F. Martin (scénogr.); A. Carlino (set dek.) (Jedna bitva za druhou)
J. Fisk (scénogr.); A. Willis (set dek.) (Velký Marty)
T. Deverell (scénogr.); S. Vieau (set dek.) (Frankenstein)
F. Crombie (scénogr.); A. Felton (set dek.) (Hamnet)

NEJLEPŠÍ KRÁTKOMETRÁŽNÍ DOKUMENT
Dokonalá podivnost (A. McAlpine)
Ďábel má napilno (C. Hampton, G. Gandbhir)
Ozbrojen objektivem: Život a smrt Brenta Renauda (C. Renaud, J. Arredondo)
Už žádné děti: Byly a už nejsou (H. Medalia, S. Nevins)
Všechny prázdné pokoje (J. Seftel, C. Jones)

NEJLEPŠÍ KRÁTKOMETRÁŽNÍ ANIMOVANÝ FILM
Dívka, která plakala perly (C. Lavis, M. Szczerbowski)
Motýlek (F. Miailhe, R. Dyens)
Navždy zelený (N.Engelhardt, J. Spears)
Plán na důchod (J. Kelly and A. Freedman)
Tři sestry (K. Bronzit)

NEJLEPŠÍ KRÁTKOMETRÁŽNÍ HRANÝ FILM
Dorothin kamarád (L. Knight, J. Dean)
Dvě osoby vyměňující si sliny (A. Singh, N. Musteata)
Menstruační drama Jane Austen (J. Aks, S. Pinder)
Řezníkova skvrna (M. Levinson-Blount, O. Caspi)
Zpěváci (S. A. Davis, J. Piatt)

NEJLEPŠÍ CELOVEČERNÍ DOKUMENT
Dokonalá sousedka (G. Gandbhir, A. Payne, N. Kwantu, S. Bisbee)
Lámání skal (S. Khaki, M. Eyni)
Pan Nikdo proti Putinovi (nominovaní nebyli dosud určeni)
Poznej mě v dobrém světle (R. White, J. Hargrave, T. Notaro, S. Willen)
Řešení jménem Alabama (A. Jarecki, C. Kaufman)

NEJLEPŠÍ ANIMOVANÝ FILM
K-pop: Lovkyně démonů (M. Kang, C. Appelhans, M. L.M. Wong)
Arco (U. Bienvenu, F. de Givry, S. Mas, N. Portman)
Elio (M. Sharafian, D. Shi, A. Molina, M. A. Drumm)
Malá Amélie (M. Vallade, L.-C. Han, N. Santiago, H. Magalon)
Zootropolis: Město zvířat 2 (J. Bush, B. Howard, Y. Merino)

NEJLEPŠÍ MEZINÁRODNÍ FILM
Citová hodnota Norsko (Joachim Trier)
Tajný agent Brazílie (Kleber Mendonça Filho)
Drobná nehoda Francie (Jafar Panahi)
Sirat Španělsko (Óliver Laxe)
Hlas Hind Radžab Tunisko (Kaouther Ben Hania)

VIZUÁLNÍ EFEKTY
M. Ralla, E. Nordahl, G. Wolter, D. Dean (Hříšníci)
R. Tudhope, N. Chevallier, R. Harrington, K. Dawson (F1)
J. Letteri, R. Baneham, E. Saindon, D. Barrett (Avatar: Oheň a popel)
C. Noble, D. Zaretti, R. Bowen, B. K. McLaughlin (Autobus naděje)
D. Vickery, S. Aplin, C. Chan, N. Corbould (Jurský svět: Znovuzrození)

ZVUK
C. Welcker, B. A. Burtt, F. Pacheco, B. Proctor, S. Boeddeker (Hříšníci)
J. A. García, C. Scarabosio, T. Villaflor (Jedna bitva za druhou)
G. Chapman, N. Robitaille, N. Ferreira, C. Cooke, B. Zoern (Frankenstein)
G. John, A. Nelson, G. Yates Whittle, G. A. Rizzo, J. Peralta (F1)
A. Villavieja, L. Casanovas, Y. Praderas (Sirat)`;

function parseNominations(content: string): NominationData[] {
  const lines = content.split('\n');
  const nominations: NominationData[] = [];
  let currentCategory = '';
  let currentSlug = '';
  let order = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      order = 0; // Reset order for new category
      continue;
    }

    // Check if this is a category header
    if (categoryMap[trimmed]) {
      currentCategory = trimmed;
      currentSlug = categoryMap[trimmed];
      order = 0;
      continue;
    }

    // Skip if no current category
    if (!currentCategory) continue;

    order++;

    // Parse nomination line
    const isActorCategory = actorCategories.includes(currentSlug);
    const isFemale = femaleCategories.includes(currentSlug);

    if (isActorCategory) {
      // Format: "Actor Name (Movie Name)"
      const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (match) {
        nominations.push({
          categorySlug: currentSlug,
          categoryName: currentCategory,
          actorName: match[1].trim(),
          movieName: match[2].trim(),
          gender: isFemale ? Gender.FEMALE : Gender.MALE,
          order,
        });
      }
    } else {
      let movieName = trimmed;

      // Categories where movie name is BEFORE parentheses
      const movieFirstCategories = [
        'best-picture',
        'short-documentary',
        'short-animated',
        'short-live-action',
        'documentary',
        'animated-feature',
      ];

      if (movieFirstCategories.includes(currentSlug)) {
        // Format: "Movie Name (producers/directors)" - movie is BEFORE parentheses
        const parenIndex = trimmed.indexOf('(');
        if (parenIndex > 0) {
          movieName = trimmed.substring(0, parenIndex).trim();
        }
      } else if (currentSlug === 'international') {
        // Format: "Movie Name Country (Director)" - movie is before country name
        const intlMatch = trimmed.match(
          /^(.+?)\s+(Norsko|Brazílie|Francie|Španělsko|Tunisko|Argentina|Irák|Taiwan|Indie|Japonsko|Jižní Korea|Palestina|Německo|Švýcarsko|Jordánsko)\s*\(/
        );
        if (intlMatch) {
          movieName = intlMatch[1].trim();
        }
      } else if (currentSlug === 'song') {
        // Format: "Song Title" – credits (Movie Name) - movie is in LAST parentheses
        const songMatch = trimmed.match(/\(([^)]+)\)$/);
        if (songMatch) {
          movieName = songMatch[1].trim();
        }
      } else {
        // Standard format: "Person Name (Movie Name)" - movie is INSIDE parentheses
        const match = trimmed.match(/\(([^)]+)\)$/);
        if (match) {
          movieName = match[1].trim();
        }
      }

      nominations.push({
        categorySlug: currentSlug,
        categoryName: currentCategory,
        movieName,
        order,
      });
    }
  }

  return nominations;
}

async function askUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question + ' (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function findOrCreateMovie(movieName: string): Promise<number | null> {
  // Try to find existing movie (case insensitive)
  let movie = await prisma.movie.findFirst({
    where: {
      name: {
        equals: movieName,
        mode: 'insensitive',
      },
    },
  });

  if (movie) {
    return movie.id;
  }

  // Ask user if they want to create the movie
  console.log(`\n⚠️  Movie not found: "${movieName}"`);
  const shouldCreate = await askUser(`   Create new movie "${movieName}"?`);

  if (shouldCreate) {
    movie = await prisma.movie.create({
      data: { name: movieName },
    });
    console.log(`   ✅ Created movie: ${movieName} (ID: ${movie.id})`);
    return movie.id;
  } else {
    console.log(`   ⏭️  Skipped movie: ${movieName}`);
    return null;
  }
}

async function findOrCreateActor(
  fullName: string,
  gender: Gender
): Promise<number> {
  let actor = await prisma.actor.findFirst({
    where: {
      fullName: {
        equals: fullName,
        mode: 'insensitive',
      },
    },
  });

  if (!actor) {
    actor = await prisma.actor.create({
      data: { fullName, gender },
    });
    console.log(`   ✅ Created actor: ${fullName} (${gender})`);
  }

  return actor.id;
}

async function waitForEnter(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  console.log('Parsing nominations...\n');
  const nominations = parseNominations(nominationsContent);

  // Group nominations by category
  const nominationsByCategory = new Map<string, NominationData[]>();
  for (const nom of nominations) {
    const existing = nominationsByCategory.get(nom.categorySlug) || [];
    existing.push(nom);
    nominationsByCategory.set(nom.categorySlug, existing);
  }

  console.log(
    `Found ${nominations.length} nominations across ${nominationsByCategory.size} categories.\n`
  );

  // Get all categories from DB
  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // Track statistics
  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Process each category one by one
  for (const [categorySlug, categoryNominations] of nominationsByCategory) {
    const categoryName = categoryNominations[0]?.categoryName || categorySlug;
    const dbCategory = categoryBySlug.get(categorySlug);

    console.log('\n========================================');
    console.log(`📁 ${categoryName} (${categorySlug})`);
    console.log('========================================');

    if (!dbCategory) {
      console.log(`❌ Category not found in database!`);
      console.log(`   Skipping ${categoryNominations.length} nominations.`);
      skipped += categoryNominations.length;
      await waitForEnter('\nPress ENTER to continue to next category...');
      continue;
    }

    // Print all nominations for this category
    console.log(`\nNominations (${categoryNominations.length}):`);
    for (const nom of categoryNominations) {
      const actorInfo = nom.actorName ? ` | Actor: ${nom.actorName} (${nom.gender})` : '';
      console.log(`  ${nom.order}. ${nom.movieName}${actorInfo}`);
    }

    // Ask user to proceed
    const shouldProcess = await askUser('\nProcess this category?');

    if (!shouldProcess) {
      console.log(`⏭️  Skipped category: ${categoryName}`);
      skipped += categoryNominations.length;
      continue;
    }

    // Process nominations for this category
    for (const nom of categoryNominations) {
      // Find or create movie
      const movieId = await findOrCreateMovie(nom.movieName);
      if (!movieId) {
        skipped++;
        continue;
      }

      // Find or create actor (if actor category)
      let actorId: number | null = null;
      if (nom.actorName && nom.gender) {
        actorId = await findOrCreateActor(nom.actorName, nom.gender);
      }

      // Check if nomination already exists
      const existingNomination = await prisma.nomination.findFirst({
        where: {
          categoryId: dbCategory.id,
          movieId,
          actorId,
        },
      });

      if (existingNomination) {
        // Update defaultOrder
        await prisma.nomination.update({
          where: { id: existingNomination.id },
          data: { defaultOrder: nom.order },
        });
        console.log(
          `📝 Updated: #${nom.order} ${nom.movieName}${nom.actorName ? ` (${nom.actorName})` : ''}`
        );
        updated++;
      } else {
        // Create new nomination
        await prisma.nomination.create({
          data: {
            categoryId: dbCategory.id,
            movieId,
            actorId,
            defaultOrder: nom.order,
          },
        });
        console.log(
          `✅ Created: #${nom.order} ${nom.movieName}${nom.actorName ? ` (${nom.actorName})` : ''}`
        );
        created++;
      }
    }
  }

  console.log('\n========================================');
  console.log('FINAL SUMMARY');
  console.log('========================================');
  console.log(`✅ Created: ${created}`);
  console.log(`📝 Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
