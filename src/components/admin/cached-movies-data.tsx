'use cache';

import { type Movie } from '@/lib/data/movies-with-use-cache';

// This component fetches and caches movie data
export async function fetchCachedMovies(isAdmin: boolean = false): Promise<Movie[]> {
  // The 'use cache' directive at the top of the file will handle caching
  // with default cache settings

  try {
    const endpoint = isAdmin ? '/api/admin/movies' : '/api/movies';
    // When running on the server, we need to use an absolute URL
    // For Next.js App Router, we can use the URL constructor with a base URL
    const url = new URL(endpoint, 'http://localhost:3000');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`);
    }

    const data = await response.json();
    return data.movies || [];
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
}

// This component renders a movie list with cached data
export async function CachedMoviesData({ isAdmin = false }: { isAdmin?: boolean }) {
  const movies = await fetchCachedMovies(isAdmin);

  // Return the data as a serializable object
  return {
    movies,
    count: movies.length,
    activeCount: movies.filter((m) => m.isActive).length,
    avgRating: movies.reduce((acc, m) => acc + parseFloat(m.rating || '0'), 0) / movies.length || 0,
    fetchedAt: new Date().toISOString(),
  };
}
