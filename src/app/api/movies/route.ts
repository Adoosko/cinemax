import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  formatDuration,
  formatMovieRating,
  formatReleaseYear,
  formatGenre,
} from '@/lib/utils/movie-utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        isActive: true,
      },
      include: {
        showtimes: {
          where: {
            isActive: true,
            startTime: {
              gte: new Date(),
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedMovies = movies.map((movie, index) => ({
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      genre: formatGenre(movie.genre),
      duration: formatDuration(movie.duration),
      rating: formatMovieRating(movie.rating),
      releaseDate: formatReleaseYear(movie.releaseDate),
      description: movie.description || 'An exciting movie experience awaits you.',
      posterUrl:
        movie.posterUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      backdropUrl:
        movie.backdropUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
      showtimes:
        movie.showtimes?.map((showtime: any) =>
          new Date(showtime.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
        ) || [],
      featured: index === 0, // Mark first movie as featured
    }));

    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error('Failed to fetch movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}
