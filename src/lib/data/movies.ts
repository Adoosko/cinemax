'use server';

import { unstable_cache } from 'next/cache';

export type Movie = {
  id: string;
  title: string;
  description: string;
  duration: number;
  genre: string[];
  rating?: string;
  director: string;
  cast: string[];
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  releaseDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  slug?: string;
};

// Cache the movies fetch for 1 minute (60 seconds)
export const getMovies = unstable_cache(
  async (isAdmin: boolean = false): Promise<Movie[]> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const endpoint = isAdmin ? '/api/admin/movies' : '/api/movies';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        next: { tags: ['movies'] },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.status}`);
      }

      const data = await response.json();
      return data.movies || [];
    } catch (error) {
      console.error('Error fetching movies:', error);
      return [];
    }
  },
  ['movies'],
  { revalidate: 60, tags: ['movies'] }
);

// Cache a single movie fetch for 1 minute
export const getMovieById = unstable_cache(
  async (id: string): Promise<Movie | null> => {
    try {
      const url = new URL(`/api/movies/${id}`, ``);
      const response = await fetch(url, {
        next: { tags: [`movie-${id}`] },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch movie: ${response.status}`);
      }

      const data = await response.json();
      return data.movie || null;
    } catch (error) {
      console.error(`Error fetching movie ${id}:`, error);
      return null;
    }
  },
  ['movie-by-id'],
  { revalidate: 60, tags: ['movies'] }
);

// Cache a single movie fetch by slug for 1 minute
export const getMovieBySlug = unstable_cache(
  async (slug: string): Promise<Movie | null> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/movies/slug/${slug}`, {
        next: { tags: [`movie-${slug}`] },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch movie by slug: ${response.status}`);
      }

      const data = await response.json();
      return data.movie || null;
    } catch (error) {
      console.error(`Error fetching movie by slug ${slug}:`, error);
      return null;
    }
  },
  ['movie-by-slug'],
  { revalidate: 60, tags: ['movies'] }
);

// Function to revalidate the movies cache
export async function revalidateMoviesCache() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const revalidateResponse = await fetch(`${baseUrl}/api/revalidate?tag=movies`, {
      method: 'POST',
    });

    if (!revalidateResponse.ok) {
      throw new Error(`Failed to revalidate: ${revalidateResponse.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error revalidating movies cache:', error);
    return false;
  }
}

// Add a movie and revalidate the cache
export async function addMovie(movieData: Partial<Movie>): Promise<Movie | null> {
  try {
    // Use full URL to ensure correct routing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add movie: ${response.status}`);
    }

    const { movie } = await response.json();

    // Revalidate the cache
    await revalidateMoviesCache();

    return movie;
  } catch (error) {
    console.error('Error adding movie:', error);
    return null;
  }
}

// Update a movie and revalidate the cache
export async function updateMovie(id: string, movieData: Partial<Movie>): Promise<Movie | null> {
  try {
    const url = new URL(
      `/api/admin/movies/${id}`,
      process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk'
    );
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update movie: ${response.status}`);
    }

    const { movie } = await response.json();

    // Revalidate the cache
    await revalidateMoviesCache();

    return movie;
  } catch (error) {
    console.error(`Error updating movie ${id}:`, error);
    return null;
  }
}

// Delete a movie and revalidate the cache
export async function deleteMovie(id: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/movies/${id}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        `Failed to delete movie: ${response.status} - ${errorData.error || response.statusText}`
      );
    }

    // Revalidate the cache
    await revalidateMoviesCache();

    return true;
  } catch (error) {
    console.error(`Error deleting movie ${id}:`, error);
    return false;
  }
}
