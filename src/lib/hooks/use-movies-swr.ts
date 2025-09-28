'use client';

import { type Movie } from '@/lib/data/movies-with-use-cache';
import useSWR from 'swr';

// SWR keys for consistent caching
export const MOVIES_SWR_KEYS = {
  all: '/api/movies',
  movie: (slug: string) => `/api/movies/${slug}`,
  featured: '/api/movies?featured=true',
  recommendations: (userId: string) => `/api/movies/recommendations/${userId}`,
  continue_watching: (userId: string) => `/api/watch/history/${userId}`,
} as const;

// Hook for fetching all movies with instant caching
export function useMovies() {
  const { data, error, isLoading, mutate } = useSWR<Movie[]>(MOVIES_SWR_KEYS.all, {
    // Cache for 10 minutes
    dedupingInterval: 10 * 60 * 1000,
    // Keep data fresh
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    movies: data || [],
    isLoading,
    isError: error,
    mutate,
    // Helper functions for instant updates
    addMovie: (newMovie: Movie) => {
      mutate([...(data || []), newMovie], false);
    },
    updateMovie: (updatedMovie: Movie) => {
      mutate(
        (data || []).map((movie) => (movie.id === updatedMovie.id ? updatedMovie : movie)),
        false
      );
    },
    removeMovie: (movieId: string) => {
      mutate(
        (data || []).filter((movie) => movie.id !== movieId),
        false
      );
    },
  };
}

// Hook for fetching single movie with aggressive caching
export function useMovie(slug: string) {
  const { data, error, isLoading, mutate } = useSWR<Movie>(
    slug ? MOVIES_SWR_KEYS.movie(slug) : null,
    {
      // Cache for 15 minutes for individual movies
      dedupingInterval: 15 * 60 * 1000,
      // Keep previous data while loading new
      keepPreviousData: true,
      // Less frequent revalidation for stable movie data
      revalidateOnFocus: false,
    }
  );

  return {
    movie: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for featured movies with preloading
export function useFeaturedMovies() {
  const { data, error, isLoading } = useSWR<Movie[]>(MOVIES_SWR_KEYS.featured, {
    // Cache for 30 minutes for featured content
    dedupingInterval: 30 * 60 * 1000,
    // Preload on mount
    revalidateOnMount: true,
  });

  return {
    featuredMovies: data || [],
    isLoading,
    isError: error,
  };
}

// Hook for user recommendations with personalized caching
export function useMovieRecommendations(userId?: string) {
  const { data, error, isLoading } = useSWR<Movie[]>(
    userId ? MOVIES_SWR_KEYS.recommendations(userId) : null,
    {
      // Cache for 1 hour for recommendations
      dedupingInterval: 60 * 60 * 1000,
      // Revalidate less frequently for stable recommendations
      revalidateOnFocus: false,
    }
  );

  return {
    recommendations: data || [],
    isLoading,
    isError: error,
  };
}

// Hook for continue watching with real-time updates
export function useContinueWatching(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR<Movie[]>(
    userId ? MOVIES_SWR_KEYS.continue_watching(userId) : null,
    {
      // Shorter cache for frequently changing watch history
      dedupingInterval: 5 * 60 * 1000,
      // Update when user focuses tab
      revalidateOnFocus: true,
    }
  );

  return {
    continueWatching: data || [],
    isLoading,
    isError: error,
    // Helper to update continue watching instantly
    updateWatchProgress: (movieId: string, progress: number) => {
      if (data) {
        const updated = data.map((movie) => {
          if (movie.id === movieId) {
            return { ...movie, watchProgress: progress };
          }
          return movie;
        });
        mutate(updated, false);
      }
    },
    addToContinueWatching: (movie: Movie) => {
      mutate([movie, ...(data || [])], false);
    },
  };
}

// Preload function for instant navigation using SWR's mutate
export async function preloadMovie(slug: string) {
  const { mutate } = await import('swr');

  try {
    const response = await fetch(MOVIES_SWR_KEYS.movie(slug));
    if (response.ok) {
      const movie = await response.json();
      // Pre-populate the cache
      mutate(MOVIES_SWR_KEYS.movie(slug), movie, false);
    }
  } catch (error) {
    // Silent fail for preloading
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to preload movie:', error);
    }
  }
}

// Cache warming function for critical data
export async function warmMovieCache() {
  const { mutate } = await import('swr');

  try {
    // Preload all movies
    const [moviesResponse, featuredResponse] = await Promise.all([
      fetch(MOVIES_SWR_KEYS.all),
      fetch(MOVIES_SWR_KEYS.featured),
    ]);

    if (moviesResponse.ok) {
      const movies = await moviesResponse.json();
      mutate(MOVIES_SWR_KEYS.all, movies, false);
    }

    if (featuredResponse.ok) {
      const featured = await featuredResponse.json();
      mutate(MOVIES_SWR_KEYS.featured, featured, false);
    }
  } catch (error) {
    // Silent fail for cache warming
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to warm movie cache:', error);
    }
  }
}
