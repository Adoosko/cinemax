import { notFound } from 'next/navigation';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MovieDetailClient } from '@/components/movies/movie-detail-client';

interface Movie {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  durationMinutes: number;
  genre: string;
  genreArray: string[];
  rating: number;
  releaseDate: string;
  releaseDateFull: Date | null;
  director: string;
  cast: string[];
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  streamingUrl: string | null;
  showtimes: Record<
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
  >;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
  averageReview: number | null;
  createdAt: string;
  updatedAt: string;
}

// Generate static params for popular movies (optional)
export async function generateStaticParams() {
  try {
    const response = await fetch('http://localhost:3000/api/movies');
    const movies = await response.json();

    // Generate static params for the first 20 movies
    return movies.slice(0, 20).map((movie: Movie) => ({
      slug: movie.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Fetch movie data with caching
async function getMovie(slug: string): Promise<Movie | null> {
  try {
    // Cache for 30 minutes (1800 seconds) and revalidate every 5 minutes (300 seconds)
    const response = await fetch(`http://localhost:3000/api/movies/${slug}`, {
      next: {
        revalidate: 300, // Revalidate every 5 minutes
        tags: [`movie-${slug}`], // Tag for on-demand revalidation
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch movie: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching movie:', error);
    return null;
  }
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

export default async function MovieDetailsPage({ params }: { params: { slug: string } }) {
  const movie = await getMovie(params.slug);

  if (!movie) {
    notFound();
  }

  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <MovieDetailClient movie={movie} />
    </NetflixBg>
  );
}
