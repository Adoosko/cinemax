'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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

        const response = await fetch(`/api/series?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setSeries(Array.isArray(data) ? data : data.series || []);
        }
      } catch (error) {
        console.error('Error fetching filtered series:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce API calls for search
    const timeoutId = setTimeout(fetchFilteredSeries, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGenre, sortBy]);

  // For now, filteredSeries is the same as series since filtering is done server-side
  const filteredSeries = series;

  return (
    <SeriesContext.Provider
      value={{
        series,
        filteredSeries,
        searchQuery,
        selectedGenre,
        sortBy,
        isLoading,
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
