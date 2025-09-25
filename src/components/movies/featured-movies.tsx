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
  // During build time, return empty array to avoid fetch errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Build time: Skipping featured movies fetch');
    return [];
  }

  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://cinemx.adrianfinik.sk'
        : 'http://localhost:3000';
    // Fetch with revalidation every 10 minutes (600 seconds)
    const response = await fetch(`${baseUrl}/api/movies`, { next: { revalidate: 600 } });
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
