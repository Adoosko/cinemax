'use client';

import { SearchFilterBar, Genre } from '@/components/movies/search-filter-bar';
import { useAdminMoviesContext } from './admin-movies-context';

export function AdminMovieFilters() {
  const { searchTerm, setSearchTerm, filterOptions, setFilterOptions } = useAdminMoviesContext();

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
