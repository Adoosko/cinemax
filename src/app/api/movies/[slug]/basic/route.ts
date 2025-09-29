import { VideoService } from '@/lib/services/video-service';
import {
  formatDuration,
  formatGenre,
  formatMovieRating,
  formatReleaseYear,
} from '@/lib/utils/movie-utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Movie slug is required' }, { status: 400 });
    }

    // Fetch ONLY basic movie data for instant loading - no heavy joins
    const movie = await prisma.movie.findUnique({
      where: {
        slug: slug,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        duration: true,
        genre: true,
        rating: true,
        director: true,
        cast: true,
        posterUrl: true,
        backdropUrl: true,
        trailerUrl: true,
        streamingUrl: true, // Use existing streamingUrl if available
        releaseDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Check if videos exist for this movie using S3 discovery
    let streamingUrl = movie.streamingUrl; // Use database streamingUrl as fallback
    try {
      const availableQualities = await VideoService.discoverVideoQualities(movie.slug);
      if (availableQualities && availableQualities.length > 0) {
        // Use the highest quality video as the streaming URL
        const bestQuality = availableQualities[0];
        streamingUrl = bestQuality.url;
      }
    } catch (error) {
      console.log(`No videos found for movie ${movie.slug}, checking fallback logic`);
      // Fallback for specific movies (like The Beekeeper)
      if (movie.slug === 'the-beekeeper') {
        streamingUrl = `${process.env.BUNNY_CDN_URL || 'https://CINEMX.b-cdn.net'}/beekeeper-2024/playlist.m3u8`;
      }
    }

    // Minimal transformation for instant loading
    const transformedMovie = {
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      description: movie.description || 'An exciting movie experience awaits you.',
      duration: formatDuration(movie.duration),
      durationMinutes: movie.duration,
      genre: formatGenre(movie.genre),
      genreArray: movie.genre,
      rating: formatMovieRating(movie.rating),
      releaseDate: formatReleaseYear(movie.releaseDate),
      releaseDateFull: movie.releaseDate,
      director: movie.director || 'Unknown Director',
      cast: movie.cast || [],
      posterUrl:
        movie.posterUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      backdropUrl:
        movie.backdropUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
      trailerUrl: movie.trailerUrl || null,
      streamingUrl, // Use discovered streamingUrl or fallback

      // Empty data for instant loading - these will be loaded separately
      showtimes: {},
      reviews: [],
      averageReview: null,

      // Metadata
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    };

    return NextResponse.json(transformedMovie);
  } catch (error) {
    console.error('Failed to fetch basic movie data:', error);
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
