'use client';

import { useSeries } from './series-context';
import {
  SeriesFilterOptions,
  SeriesGenre,
  SeriesSearchFilterBar,
} from './series-search-filter-bar';

export default function SeriesFilters() {
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
    if (filters.genres && filters.genres.length > 0) {
      setSelectedGenre(filters.genres[0]);
    } else {
      setSelectedGenre('all');
    }
    if (filters.sortBy) setSortBy(filters.sortBy);
    else setSortBy('title');
    // TODO: Integrate years/rating filter
  };

  return (
    <SeriesSearchFilterBar
      onSearch={setSearchQuery}
      onFilterChange={handleFilterChange}
      genres={genres}
      initialSearchTerm={searchQuery}
      initialFilters={{
        genres: selectedGenre === 'all' ? undefined : [selectedGenre],
        sortBy: sortBy as any,
      }}
    />
  );
}
