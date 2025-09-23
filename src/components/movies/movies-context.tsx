'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type Movie } from '@/lib/data/movies-with-use-cache';
import { FilterOptions } from '@/components/movies/search-filter-bar';

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

  // Fetch movies if no initial movies were provided
  useEffect(() => {
    if (initialMovies.length === 0) {
      // Fetch movies from API
      const fetchMovies = async () => {
        try {
          const response = await fetch('/api/movies');
          if (response.ok) {
            const data = await response.json();
            setMovies(data.movies || []);
          }
        } catch (error) {
          console.error('Error fetching movies:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMovies();
    }
  }, [initialMovies]);

  return (
    <MoviesContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        filterOptions,
        setFilterOptions,
        movies,
        isLoading,
      }}
    >
      {children}
    </MoviesContext.Provider>
  );
}

export function useMoviesContext() {
  const context = useContext(MoviesContext);
  if (context === undefined) {
    throw new Error('useMoviesContext must be used within a MoviesProvider');
  }
  return context;
}
