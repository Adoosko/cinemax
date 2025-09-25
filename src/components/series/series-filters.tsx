'use client';

import { useSeries } from './series-context';
import {
  SeriesFilterOptions,
  SeriesGenre,
  SeriesSearchFilterBar,
} from './series-search-filter-bar';

export function SeriesFilters() {
  const { searchQuery, setSearchQuery, selectedGenre, setSelectedGenre, sortBy, setSortBy } =
    useSeries();

  const genres: SeriesGenre[] = [
    { id: 'all', name: 'All Series' },
    { id: 'action', name: 'Action' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'crime', name: 'Crime' },
    { id: 'drama', name: 'Drama' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'horror', name: 'Horror' },
    { id: 'mystery', name: 'Mystery' },
    { id: 'romance', name: 'Romance' },
    { id: 'sci-fi', name: 'Sci-Fi' },
    { id: 'thriller', name: 'Thriller' },
    { id: 'documentary', name: 'Documentary' },
    { id: 'animation', name: 'Animation' },
  ];

  const handleFilterChange = (filters: SeriesFilterOptions) => {
    // For now, we'll just handle the basic filters that the context supports
    if (filters.genre) {
      setSelectedGenre(filters.genre);
    } else {
      setSelectedGenre('all');
    }

    if (filters.sortBy) {
      setSortBy(filters.sortBy);
    } else {
      setSortBy('title');
    }

    // TODO: Handle years and rating filters when context is updated
  };

  return (
    <SeriesSearchFilterBar
      onSearch={setSearchQuery}
      onFilterChange={handleFilterChange}
      genres={genres}
      initialSearchTerm={searchQuery}
      initialFilters={{
        genre: selectedGenre === 'all' ? undefined : selectedGenre,
        sortBy: sortBy as any,
      }}
    />
  );
}
