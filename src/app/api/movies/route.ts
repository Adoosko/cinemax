import { formatDuration, formatMovieRating, formatReleaseYear } from '@/lib/utils/movie-utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        genre: true,
        duration: true,
        rating: true,
        releaseDate: true,
        description: true,
        posterUrl: true,
        backdropUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format - optimized response
    const transformedMovies = movies.map((movie, index) => ({
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      genre: movie.genre,
      duration: formatDuration(movie.duration),
      rating: formatMovieRating(movie.rating),
      releaseDate: formatReleaseYear(movie.releaseDate),
      description: movie.description || 'An exciting movie experience awaits you.',
      posterUrl: movie.posterUrl || '/placeholder-movie.jpg',
      backdropUrl: movie.backdropUrl,
      featured: index === 0, // Mark first movie as featured
    }));

    return NextResponse.json(
      {
        movies: transformedMovies,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}
