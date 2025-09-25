import { FeaturedMoviesClient } from './featured-movies-client';

interface Movie {
  id: string;
  slug: string;
  title: string;
  genre: string;
  duration: string;
  rating: number;
  releaseDate: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  showtimes: string[];
  featured?: boolean;
}

async function getFeaturedMovies() {
  try {
    // Fetch with revalidation every 10 minutes (600 seconds)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/movies`,
      { next: { revalidate: 600 } }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`);
    }
    const movies = await response.json();
    // Get 5 latest movies for hero carousel
    return movies.slice(0, 5);
  } catch (error) {
    console.error('Error fetching featured movies:', error);
    return [];
  }
}

export async function FeaturedMovies() {
  const heroMovies = await getFeaturedMovies();

  return <FeaturedMoviesClient heroMovies={heroMovies} />;
}
