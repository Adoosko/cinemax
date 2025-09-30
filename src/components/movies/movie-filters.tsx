'use client';

import { useMoviesContext } from './movies-context';
import { Genre, SearchFilterBar } from './search-filter-bar';

export default function MovieFilters() {
  const { searchTerm, setSearchTerm, filterOptions, setFilterOptions } = useMoviesContext();

  // Genres list—customize as needed
  const genres: Genre[] = [
    { id: 'all', name: 'All Movies' },
    { id: 'action', name: 'Action' },
    { id: 'sci-fi', name: 'Sci-Fi' },
    { id: 'thriller', name: 'Thriller' },
    { id: 'drama', name: 'Drama' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'horror', name: 'Horror' },
    { id: 'romance', name: 'Romance' },
    { id: 'animation', name: 'Animation' },
    { id: 'family', name: 'Family' },
    { id: 'music', name: 'Music' },
    { id: 'sport', name: 'Sport' },
    { id: 'war', name: 'War' },
    { id: 'western', name: 'Western' },
    { id: 'documentary', name: 'Documentary' },
    { id: 'history', name: 'History' },
  ];

  return (
    <SearchFilterBar
      onSearch={setSearchTerm}
      onFilterChange={setFilterOptions}
      genres={genres}
      initialSearchTerm={searchTerm}
      initialFilters={filterOptions}
    />
  );
}
