import { MovieDetailClient } from '@/components/movies/movie-detail-client';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { ScrollReset } from '@/components/ui/scroll-reset';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

// Import the Movie types from both sources
import { type Movie as DetailMovie } from '@/components/movies/movie-detail-client';

// PPR configuration for dynamic movie pages - static parts pre-rendered, dynamic parts on-demand
export const experimental_ppr = true;

// Generate static params for all active movies
export async function generateStaticParams() {
  const prisma = new PrismaClient();

  try {
    const movies = await prisma.movie.findMany({
      where: { isActive: true },
      select: { slug: true },
      take: 50, // Limit to most important movies for initial build
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

// Fetch movie data server-side
async function getMovie(slug: string): Promise<DetailMovie | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/movies/${slug}/basic`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const movieData = await response.json();

    return {
      ...movieData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      showtimes: transformShowtimes([]),
    } as unknown as DetailMovie;
  } catch (error) {
    console.error('Error fetching movie:', error);
    return null;
  }
}

// Fetch related movies server-side
// async function getRelatedMovies(slug: string): Promise<DetailMovie[]> {
//   try {
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
//     const response = await fetch(`${baseUrl}/api/movies/${slug}/related?limit=12`, {
//       next: { revalidate: 3600 }, // Cache for 1 hour
//     });

//     if (!response.ok) {
//       return [];
//     }

//     const relatedData = await response.json();

//     if (relatedData?.movies) {
//       return relatedData.movies.map((m: CachedMovie) => ({
//         ...m,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         showtimes: transformShowtimes([]),
//       })) as DetailMovie[];
//     }

//     return [];
//   } catch (error) {
//     console.error('Error fetching related movies:', error);
//     return [];
//   }
// }

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const movie = await getMovie((await params).slug);

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
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const movie = await getMovie(resolvedParams.slug);

  if (!movie) {
    notFound();
  }

  // Fetch related movies in parallel (doesn't block main content)
  // const relatedMoviesPromise = getRelatedMovies(resolvedParams.slug);

  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <ScrollReset />
      {/* Main movie content loads immediately */}
      <MovieDetailClient movie={movie} allMovies={[]} />

      {/* Related movies load asynchronously */}
      {/* <Suspense fallback={null}>
        <RelatedMoviesLoader relatedMoviesPromise={relatedMoviesPromise} />
      </Suspense> */}
    </NetflixBg>
  );
}

// Component to handle async loading of related movies
// async function RelatedMoviesLoader({
//   relatedMoviesPromise,
// }: {
//   relatedMoviesPromise: Promise<DetailMovie[]>;
// }) {
//   const relatedMovies = await relatedMoviesPromise;

//   // This could trigger a re-render of the SimilarMovies component
//   // For now, we'll let the client handle related movies loading
//   return null;
// }

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
