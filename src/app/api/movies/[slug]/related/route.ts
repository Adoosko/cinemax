import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // First, get the current movie to find its genre
    const currentMovie = await prisma.movie.findUnique({
      where: { slug, isActive: true },
      select: { id: true, genre: true },
    });

    if (!currentMovie) {
      return NextResponse.json({ movies: [] });
    }

    // Genre is always string[] in Prisma schema
    const genreToMatch: string[] = currentMovie.genre || [];

    // Convert to lowercase for case-insensitive matching
    const lowerGenreArray = genreToMatch.map((g) => g.toLowerCase().trim());

    // Get all active movies except current one
    const allMovies = await prisma.movie.findMany({
      where: {
        isActive: true,
        id: { not: currentMovie.id },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        streamingUrl: true,
        description: true,
        duration: true,
        genre: true,
        rating: true,
        director: true,
        cast: true,
        posterUrl: true,
        backdropUrl: true,
        trailerUrl: true,
        releaseDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    });

    // Filter movies with similar genres using same logic as SimilarMovies component
    let matchingMovies: typeof allMovies = [];

    if (lowerGenreArray.length > 0) {
      matchingMovies = allMovies.filter((movie) => {
        if (!movie.genre || !Array.isArray(movie.genre)) return false;

        // Convert movie genres to lowercase for comparison
        const movieGenres = movie.genre.map((g: string) => g.toLowerCase().trim());

        // Check if any genre matches using partial matching (same as SimilarMovies)
        return lowerGenreArray.some((matchGenre) =>
          movieGenres.some(
            (movieGenre) => movieGenre.includes(matchGenre) || matchGenre.includes(movieGenre)
          )
        );
      });
    }

    // If we don't have enough matching movies, add some random ones
    if (matchingMovies.length < limit) {
      const remainingMovies = allMovies.filter((m) => !matchingMovies.some((mm) => mm.id === m.id));

      const additionalCount = limit - matchingMovies.length;
      const randomMovies = remainingMovies
        .sort(() => 0.5 - Math.random())
        .slice(0, additionalCount);

      matchingMovies.push(...randomMovies);
    }

    // Return limited results
    const finalMovies = matchingMovies.slice(0, limit);

    return NextResponse.json({ movies: finalMovies });
  } catch (error) {
    console.error('Error fetching related movies:', error);
    return NextResponse.json({ error: 'Internal server error', movies: [] }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
