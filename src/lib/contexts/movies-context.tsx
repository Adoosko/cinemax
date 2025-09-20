'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the filter options type
export interface FilterOptions {
  genre?: string;
  year?: number | number[];
  rating?: number;
  sortBy?: string;
  [key: string]: any;
}

// Define the movie type
export interface Movie {
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
}

// Define the context type
interface MoviesContextType {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterOptions: FilterOptions;
  setSearchTerm: (term: string) => void;
  setFilterOptions: (options: FilterOptions) => void;
  fetchMovies: (isAdmin?: boolean) => Promise<void>;
  addMovie: (movieData: Partial<Movie>) => Promise<Movie | null>;
  updateMovie: (id: string, movieData: Partial<Movie>) => Promise<Movie | null>;
  deleteMovie: (id: string) => Promise<boolean>;
  getMovieById: (id: string) => Movie | undefined;
  getMovieBySlug: (slug: string) => Movie | undefined;
}

// Create the context
const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

// Create the provider component
export function MoviesProvider({
  children,
  initialMovies = [],
  isAdmin = false,
}: {
  children: ReactNode;
  initialMovies?: Movie[];
  isAdmin?: boolean;
}) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  // Fetch movies from API
  const fetchMovies = async (isAdminFetch = isAdmin) => {
    try {
      setLoading(true);
      const endpoint = isAdminFetch ? '/api/admin/movies' : '/api/movies';
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();
      setMovies(data.movies || []);
      return data.movies;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add a new movie
  const addMovie = async (movieData: Partial<Movie>): Promise<Movie | null> => {
    try {
      const response = await fetch('/api/admin/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      if (!response.ok) {
        throw new Error('Failed to add movie');
      }

      const { movie } = await response.json();
      setMovies((prev) => [movie, ...prev]);
      return movie;
    } catch (error) {
      console.error('Failed to add movie:', error);
      return null;
    }
  };

  // Update an existing movie
  const updateMovie = async (id: string, movieData: Partial<Movie>): Promise<Movie | null> => {
    try {
      const response = await fetch(`/api/admin/movies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      if (!response.ok) {
        throw new Error('Failed to update movie');
      }

      const { movie } = await response.json();
      setMovies((prev) => prev.map((m) => (m.id === movie.id ? movie : m)));
      return movie;
    } catch (error) {
      console.error('Failed to update movie:', error);
      return null;
    }
  };

  // Delete a movie
  const deleteMovie = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/movies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete movie');
      }

      setMovies((prev) => prev.filter((movie) => movie.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete movie:', error);
      return false;
    }
  };

  // Helper functions to get movies by ID or slug
  const getMovieById = (id: string) => movies.find((movie) => movie.id === id);
  const getMovieBySlug = (slug: string) => movies.find((movie) => movie.slug === slug);

  // Load movies on initial render if not provided
  useEffect(() => {
    if (initialMovies.length === 0) {
      fetchMovies();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <MoviesContext.Provider
      value={{
        movies,
        loading,
        error,
        searchTerm,
        filterOptions,
        setSearchTerm,
        setFilterOptions,
        fetchMovies,
        addMovie,
        updateMovie,
        deleteMovie,
        getMovieById,
        getMovieBySlug,
      }}
    >
      {children}
    </MoviesContext.Provider>
  );
}

// Create a hook to use the context
export function useMovies() {
  const context = useContext(MoviesContext);
  if (context === undefined) {
    throw new Error('useMovies must be used within a MoviesProvider');
  }
  return context;
}
