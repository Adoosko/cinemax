import {
  EnhancedCachedMovieData,
  fetchAllMoviesStatic,
  fetchStaticMovieData,
  getMovieCacheTags,
} from '@/components/movies/enhanced-cached-movie-data';
import { MovieDetailClient } from '@/components/movies/movie-detail-client';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MovieHeroSkeleton } from '@/components/ui/netflix-skeletons';
import { ScrollReset } from '@/components/ui/scroll-reset';
import { PrismaClient } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

// Import the Movie types from both sources
import { type Movie as DetailMovie } from '@/components/movies/movie-detail-client';
import { type Movie as CachedMovie } from '@/lib/data/movies-with-use-cache';

// Use the imported type
type Movie = CachedMovie;

// Import the Movie type for proper typing

// PPR configuration for dynamic movie pages - static parts pre-rendered, dynamic parts on-demand
export const experimental_ppr = true;

// Generate static params with caching for all active movies
export async function generateStaticParams() {
  return unstable_cache(
    async () => {
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
    },
    ['generate-static-params-movies'],
    {
      revalidate: 3600, // 1 hour
      tags: ['movies-all'],
    }
  )();
}

// Generate metadata for SEO with enhanced caching
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return unstable_cache(
    async (movieSlug: string) => {
      try {
        const movie = await fetchStaticMovieData(movieSlug, await getMovieCacheTags(movieSlug));

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
    },
    [`movie-metadata-${slug}`],
    {
      revalidate: 3600, // 1 hour for metadata
      tags: await getMovieCacheTags(slug),
    }
  )(slug);
}

export default function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <ScrollReset />
      {/* Enhanced movie details with PPR splitting - Prevent layout shifts */}
      <Suspense fallback={<MovieHeroSkeleton />}>
        <div className="animate-fade-in">
          <MovieDetailsContent params={params} />
        </div>
      </Suspense>
    </NetflixBg>
  );
}

// Enhanced movie details content with PPR splitting
async function MovieDetailsContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { movie } = await EnhancedCachedMovieData({
    slug: resolvedParams.slug,
    includeRelated: false, // We'll get all movies separately
    includeComments: false,
  });

  if (!movie) {
    notFound();
  }

  // Get all movies for similar recommendations
  const allMovies = await fetchAllMoviesStatic([]);

  // Transform the movie data to match the expected format for MovieDetailClient
  const transformedMovie = {
    ...movie,
    // Add missing fields for compatibility
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    showtimes: transformShowtimes([]), // Use empty array since static data doesn't have showtimes
  } as unknown as DetailMovie;

  // Transform all movies for similar movies recommendations
  const transformedAllMovies = allMovies.map((m: CachedMovie) => ({
    ...m,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    showtimes: transformShowtimes([]), // Use empty array for consistency
  })) as unknown as DetailMovie[];

  return <MovieDetailClient movie={transformedMovie} allMovies={transformedAllMovies} />;
}

// Enhanced skeleton replaced with Netflix-style skeletons from the dedicated component

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
