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

    // Fetch movie by slug with related data
    const movie = await prisma.movie.findUnique({
      where: {
        slug: slug,
        isActive: true,
      },
      include: {
        showtimes: {
          where: {
            isActive: true,
            startTime: {
              gte: new Date(), // Only future showtimes
            },
          },
          include: {
            theater: {
              include: {
                cinema: true,
              },
            },
            bookings: {
              select: {
                bookingSeats: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
        reviews: {
          where: {
            isApproved: true,
          },
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Check if videos exist for this movie
    let streamingUrl = null;
    try {
      const availableQualities = await VideoService.discoverVideoQualities(movie.slug);
      if (availableQualities && availableQualities.length > 0) {
        // Use the highest quality video as the streaming URL
        const bestQuality = availableQualities[0];
        streamingUrl = bestQuality.url;
      }
    } catch (error) {
      console.log(`No videos found for movie ${movie.slug}, using fallback logic`);
      // Fallback for specific movies (like The Beekeeper)
      if (movie.slug === 'the-beekeeper') {
        streamingUrl = `${process.env.BUNNY_CDN_URL || 'https://cinemax.b-cdn.net'}/beekeeper-2024/playlist.m3u8`;
      }
    }

    // Transform the movie data
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
      streamingUrl,

      // Showtimes grouped by date
      showtimes: movie.showtimes.reduce((acc: any, showtime) => {
        const date = showtime.startTime.toISOString().split('T')[0];

        if (!acc[date]) {
          acc[date] = [];
        }

        acc[date].push({
          id: showtime.id,
          time: showtime.startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          theater: showtime.theater.name,
          cinema: showtime.theater.cinema.name,
          price: parseFloat(showtime.basePrice.toString()),
          available: Math.max(
            0,
            showtime.theater.totalSeats -
              (showtime.bookings?.reduce(
                (sum: number, booking: any) => sum + booking.bookingSeats?.length || 0,
                0
              ) || 0)
          ),
        });

        return acc;
      }, {}),

      // Reviews with user info
      reviews: movie.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          name:
            review.user.name ||
            `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() ||
            'Anonymous User',
        },
      })),

      // Average rating from reviews
      averageReview:
        movie.reviews.length > 0
          ? movie.reviews.reduce((sum, review) => sum + review.rating, 0) / movie.reviews.length
          : null,

      // Metadata
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    };

    return NextResponse.json(transformedMovie);
  } catch (error) {
    console.error('Failed to fetch movie by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 });
  }
}
