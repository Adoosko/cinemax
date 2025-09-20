'use server';

import { cache } from 'react';
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

// Cache the movies fetch for 5 minutes (300 seconds)
export const getMovies = unstable_cache(
  async (isAdmin: boolean = false): Promise<Movie[]> => {
    try {
      const endpoint = isAdmin ? '/api/admin/movies' : '/api/movies';
      const url = new URL(endpoint, 'http://localhost:3000');
      const response = await fetch(url, {
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
  { revalidate: 300, tags: ['movies'] }
);

// Cache a single movie fetch for 5 minutes
export const getMovieById = unstable_cache(
  async (id: string): Promise<Movie | null> => {
    try {
      const url = new URL(`/api/movies/${id}`, 'http://localhost:3000');
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
  { revalidate: 300, tags: ['movies'] }
);

// Cache a single movie fetch by slug for 5 minutes
export const getMovieBySlug = unstable_cache(
  async (slug: string): Promise<Movie | null> => {
    try {
      const url = new URL(`/api/movies/slug/${slug}`, 'http://localhost:3000');
      const response = await fetch(url, {
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
  { revalidate: 300, tags: ['movies'] }
);

// Function to revalidate the movies cache
export async function revalidateMoviesCache() {
  try {
    const revalidateUrl = new URL('/api/revalidate?tag=movies', 'http://localhost:3000');
    const revalidateResponse = await fetch(revalidateUrl, {
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
    const url = new URL('/api/admin/movies', 'http://localhost:3000');
    const response = await fetch(url, {
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
    const url = new URL(`/api/admin/movies/${id}`, 'http://localhost:3000');
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
    const url = new URL(`/api/admin/movies/${id}`, 'http://localhost:3000');
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete movie: ${response.status}`);
    }

    // Revalidate the cache
    await revalidateMoviesCache();

    return true;
  } catch (error) {
    console.error(`Error deleting movie ${id}:`, error);
    return false;
  }
}
