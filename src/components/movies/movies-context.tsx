'use client';

import { FilterOptions } from '@/components/movies/search-filter-bar';
import { type Movie } from '@/lib/data/movies-with-use-cache'; // Update path as needed
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

interface MoviesContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  movies: Movie[];
  isLoading: boolean;
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

interface MoviesProviderProps {
  children: ReactNode;
  initialMovies?: Movie[];
}

export function MoviesProvider({ children, initialMovies = [] }: MoviesProviderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [isLoading, setIsLoading] = useState(initialMovies.length === 0);

  // Only fetch if no initial movies provided (streaming SSR gives initial data)
  useEffect(() => {
    let ignore = false;
    if (initialMovies.length === 0) {
      setIsLoading(true);
      fetch('/api/movies')
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (!ignore) setMovies(data.movies || []);
        })
        .catch(() => {})
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [initialMovies]);

  // Performance optimization: context value is memoized for minimal re-renders
  const contextValue = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      filterOptions,
      setFilterOptions,
      movies,
      isLoading,
    }),
    [searchTerm, filterOptions, movies, isLoading]
  );

  return <MoviesContext.Provider value={contextValue}>{children}</MoviesContext.Provider>;
}

// Hook to access movies
export function useMoviesContext() {
  const context = useContext(MoviesContext);
  if (context === undefined) {
    throw new Error('useMoviesContext must be used within a MoviesProvider');
  }
  return context;
}
