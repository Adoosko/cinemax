import {
  EnhancedCachedMovieData,
  fetchStaticMovieData,
  getMovieCacheTags,
} from '@/components/movies/enhanced-cached-movie-data';
import { MovieDetailClient } from '@/components/movies/movie-detail-client';
import { NetflixBg } from '@/components/ui/netflix-bg';
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
            title: 'Movie Not Found | CINEMX',
            description: 'The requested movie could not be found.',
          };
        }

        return {
          title: `${movie.title} | CINEMX`,
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
          title: 'Movie | CINEMX',
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
      {/* Static hero loads instantly, dynamic content loads separately */}
      <StaticMovieHero params={params} />
      {/* Dynamic content loads separately without blocking hero */}
      <Suspense
        fallback={
          <div className="p-6">
            <div className="animate-pulse bg-white/10 h-48 rounded-xl" />
          </div>
        }
      >
        <DynamicMovieContent params={params} />
      </Suspense>
    </NetflixBg>
  );
}

// Static movie hero - loads instantly with cached data
async function StaticMovieHero({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { movie } = await EnhancedCachedMovieData({
    slug: resolvedParams.slug,
    includeRelated: false, // Skip dynamic data for instant loading
    includeComments: false,
  });

  if (!movie) {
    notFound();
  }

  // Transform just the basic movie data for the hero section
  const transformedMovie = {
    ...movie,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    showtimes: transformShowtimes([]),
  } as unknown as DetailMovie;

  // Only render the hero section - no similar movies or comments
  return <MovieDetailClient movie={transformedMovie} allMovies={[]} showOnlyHero={true} />;
}

// Dynamic content - loads separately without blocking hero
async function DynamicMovieContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { movie, relatedMovies } = await EnhancedCachedMovieData({
    slug: resolvedParams.slug,
    includeRelated: true, // Get related movies
    includeComments: false,
  });

  if (!movie) {
    return null;
  }

  // Transform movie and related movies
  const transformedMovie = {
    ...movie,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    showtimes: transformShowtimes([]),
  } as unknown as DetailMovie;

  const transformedRelatedMovies = relatedMovies.map((m: CachedMovie) => ({
    ...m,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    showtimes: transformShowtimes([]),
  })) as unknown as DetailMovie[];

  // Only render dynamic content - similar movies and comments
  return (
    <MovieDetailClient
      movie={transformedMovie}
      allMovies={transformedRelatedMovies}
      showOnlyDynamic={true}
    />
  );
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
      cinema: 'CINEMX',
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
