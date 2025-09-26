import {
  CachedMovieData,
  fetchCachedMovieBySlug,
  fetchCachedPublicMovies,
} from '@/components/movies/cached-movie-data';
import { MovieDetailClient } from '@/components/movies/movie-detail-client';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

// Import the Movie types from both sources
import { type Movie as DetailMovie } from '@/components/movies/movie-detail-client';
import { type Movie as CachedMovie } from '@/lib/data/movies-with-use-cache';

// Use the imported type
type Movie = CachedMovie;

// PPR configuration for dynamic movie pages - static parts pre-rendered, dynamic parts on-demand
export const experimental_ppr = true;

// Generate static params for all active movies
export async function generateStaticParams() {
  const prisma = new PrismaClient();

  try {
    const movies = await prisma.movie.findMany({
      where: { isActive: true },
      select: { slug: true },
    });

    return movies.map((movie) => ({
      slug: movie.slug,
    }));
  } catch (error) {
    console.error('Failed to generate static params for movies:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Generate metadata for SEO - can be pre-rendered
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const movie = await fetchCachedMovieBySlug(slug);

    if (!movie) {
      return {
        title: 'Movie Not Found | CinemaX',
        description: 'The requested movie could not be found.',
      };
    }

    return {
      title: `${movie.title} | CinemaX`,
      description: movie.description,
      openGraph: {
        title: movie.title,
        description: movie.description,
        images: [movie.backdropUrl, movie.posterUrl],
        type: 'video.movie',
      },
      twitter: {
        card: 'summary_large_image',
        title: movie.title,
        description: movie.description,
        images: [movie.backdropUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Movie | CinemaX',
      description: 'Watch movies online',
    };
  }
}

export default function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <Suspense fallback={<MovieDetailSkeleton />}>
        <MovieDetailsContent params={params} />
      </Suspense>
    </NetflixBg>
  );
}

// Separate component for dynamic content
async function MovieDetailsContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { movie } = await CachedMovieData({ slug: resolvedParams.slug });

  // Fetch all movies for similar movies recommendations
  const allMovies = await fetchCachedPublicMovies();

  if (!movie) {
    notFound();
  }

  // Transform the movie data to match the expected format for MovieDetailClient
  const transformedMovie = {
    ...movie,
    // Transform showtimes from string[] to the expected Record format if it exists
    showtimes: transformShowtimes(movie.showtimes),
  } as DetailMovie;

  // Transform all movies for similar movies recommendations
  const transformedAllMovies = allMovies.map((m) => ({
    ...m,
    showtimes: transformShowtimes(m.showtimes),
  })) as DetailMovie[];

  return <MovieDetailClient movie={transformedMovie} allMovies={transformedAllMovies} />;
}

// Skeleton for movie details
function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero section skeleton */}
      <div className="relative h-[70vh] bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-8 left-8 max-w-2xl space-y-4">
          <div className="h-12 w-96 bg-white/20 rounded"></div>
          <div className="h-6 w-48 bg-white/20 rounded"></div>
          <div className="h-20 w-full bg-white/20 rounded"></div>
          <div className="flex space-x-4">
            <div className="h-12 w-32 bg-white/20 rounded"></div>
            <div className="h-12 w-32 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="h-8 w-64 bg-white/10 rounded"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-lg bg-white/10"></div>
              <div className="h-4 w-full bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to transform showtimes from string[] to the expected Record format
function transformShowtimes(showtimes?: string[]):
  | Record<
      string,
      Array<{
        id: string;
        time: string;
        startTime: string;
        endTime: string;
        theater: string;
        cinema: string;
        price: number;
        available: number;
      }>
    >
  | undefined {
  if (!showtimes || !Array.isArray(showtimes) || showtimes.length === 0) {
    return {};
  }

  // Create a default structure for showtimes
  // Using the current date as the key
  const currentDate = new Date().toISOString().split('T')[0];

  // Create a simple transformation of string[] to the expected format
  return {
    [currentDate]: showtimes.map((time, index) => ({
      id: `showtime-${index}`,
      time,
      startTime: time,
      endTime: calculateEndTime(time, 120), // Assuming 2 hour movies
      theater: 'Main Theater',
      cinema: 'CinemaX',
      price: 12.99,
      available: 50,
    })),
  };
}

// Helper function to calculate end time based on start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  try {
    // Simple time calculation (this is a basic implementation)
    const [hours, minutes] = startTime.split(':').map(Number);

    let endHours = hours + Math.floor(durationMinutes / 60);
    let endMinutes = minutes + (durationMinutes % 60);

    if (endMinutes >= 60) {
      endHours += 1;
      endMinutes -= 60;
    }

    endHours = endHours % 24; // Handle day overflow

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  } catch (e) {
    // If there's any error in parsing, return a placeholder
    return '00:00';
  }
}
