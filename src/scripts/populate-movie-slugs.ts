/**
 * Script to populate slug field for existing movies
 * Run with: bun run src/scripts/populate-movie-slugs.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateSlug, ensureUniqueSlug } from '../lib/utils/movie-utils';

const prisma = new PrismaClient();

async function populateMovieSlugs() {
  try {
    console.log('Starting to populate movie slugs...');

    // Get all movies without slugs
    const movies = await prisma.movie.findMany({
      where: {
        slug: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`Found ${movies.length} movies without slugs`);

    if (movies.length === 0) {
      console.log('All movies already have slugs!');
      return;
    }

    // Get existing slugs to avoid conflicts
    const existingMovies = await prisma.movie.findMany({
      where: {
        slug: {
          not: null,
        },
      },
      select: {
        slug: true,
      },
    });

    const existingSlugs = existingMovies
      .map((m) => m.slug)
      .filter((slug): slug is string => slug !== null);

    // Generate and update slugs
    for (const movie of movies) {
      const baseSlug = generateSlug(movie.title);
      const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

      console.log(`Updating "${movie.title}" -> "${uniqueSlug}"`);

      await prisma.movie.update({
        where: { id: movie.id },
        data: { slug: uniqueSlug },
      });

      // Add to existing slugs to avoid future conflicts
      existingSlugs.push(uniqueSlug);
    }

    console.log(`Successfully updated ${movies.length} movies with slugs!`);
  } catch (error) {
    console.error('Error populating movie slugs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateMovieSlugs();
