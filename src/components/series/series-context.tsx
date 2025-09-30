'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

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
  searchQuery: string;
  selectedGenre: string;
  sortBy: string;
  isLoading: boolean;
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
  const [series, setSeries] = useState<Series[]>(initialSeries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch filtered series from API when filters change
  useEffect(() => {
    const fetchFilteredSeries = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedGenre && selectedGenre !== 'all') params.append('genre', selectedGenre);
        if (sortBy) params.append('sortBy', sortBy);
        const resp = await fetch(`/api/series?${params.toString()}`);
        if (resp.ok) {
          const data = await resp.json();
          setSeries(Array.isArray(data) ? data : data.series || []);
        }
      } catch (err) {
        console.error('Error fetching filtered series:', err);
      } finally {
        setIsLoading(false);
      }
    };
    const timeoutId = setTimeout(fetchFilteredSeries, 300); // debounce fetch
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGenre, sortBy]);

  const contextValue = useMemo(
    () => ({
      series,
      searchQuery,
      selectedGenre,
      sortBy,
      isLoading,
      setSearchQuery,
      setSelectedGenre,
      setSortBy,
    }),
    [series, searchQuery, selectedGenre, sortBy, isLoading]
  );

  return <SeriesContext.Provider value={contextValue}>{children}</SeriesContext.Provider>;
}

export function useSeries() {
  const context = useContext(SeriesContext);
  if (context === undefined) {
    throw new Error('useSeries must be used within a SeriesProvider');
  }
  return context;
}
