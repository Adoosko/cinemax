'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

// Define the Series type
export interface Series {
  id: string;
  slug: string;
  title: string;
  genre: string;
  releaseYear: string;
  description: string;
  coverUrl: string;
  backdropUrl: string;
  seasonsCount: number;
  totalEpisodes: number;
  rating: string;
  cast: string[];
  director: string;
  featured: boolean;
}

interface SeriesContextType {
  series: Series[];
  filteredSeries: Series[];
  searchQuery: string;
  selectedGenre: string;
  sortBy: string;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string) => void;
  setSortBy: (sort: string) => void;
}

const SeriesContext = createContext<SeriesContextType | undefined>(undefined);

interface SeriesProviderProps {
  children: ReactNode;
  initialSeries: Series[];
}

export function SeriesProvider({ children, initialSeries }: SeriesProviderProps) {
  const [series] = useState<Series[]>(initialSeries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('title');

  // Filter and sort series
  const filteredSeries = series
    .filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre =
        !selectedGenre ||
        selectedGenre === 'all' ||
        s.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'releaseYear':
          return parseInt(b.releaseYear) - parseInt(a.releaseYear);
        case 'rating':
          return b.rating.localeCompare(a.rating);
        default:
          return 0;
      }
    });

  return (
    <SeriesContext.Provider
      value={{
        series,
        filteredSeries,
        searchQuery,
        selectedGenre,
        sortBy,
        setSearchQuery,
        setSelectedGenre,
        setSortBy,
      }}
    >
      {children}
    </SeriesContext.Provider>
  );
}

export function useSeries() {
  const context = useContext(SeriesContext);
  if (context === undefined) {
    throw new Error('useSeries must be used within a SeriesProvider');
  }
  return context;
}
