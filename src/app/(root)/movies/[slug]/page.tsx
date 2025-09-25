import {
  CachedMovieData,
  fetchCachedMovieBySlug,
  fetchCachedPublicMovies,
} from '@/components/movies/cached-movie-data';
import { MovieDetailClient } from '@/components/movies/movie-detail-client';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { notFound } from 'next/navigation';

// Import the Movie types from both sources
import { type Movie as DetailMovie } from '@/components/movies/movie-detail-client';
import { type Movie as CachedMovie } from '@/lib/data/movies-with-use-cache';

// Use the imported type
type Movie = CachedMovie;

// Force dynamic rendering to avoid build-time fetch errors
export const dynamic = 'force-dynamic';

// Fetch movie data with caching using 'use cache' directive
async function getMovie(slug: string): Promise<Movie | null> {
  return fetchCachedMovieBySlug(slug);
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const movie = await getMovie((await params).slug);

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
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
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

  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <MovieDetailClient movie={transformedMovie} allMovies={transformedAllMovies} />
    </NetflixBg>
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
