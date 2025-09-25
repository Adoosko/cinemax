'use client';

import { useEffect, useMemo, useState } from 'react';
import { MovieCard } from './movie-card';

// Use the Movie type from the cached data

import { useMoviesContext } from './movies-context';

export function MovieGrid() {
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { searchTerm, filterOptions, movies, isLoading } = useMoviesContext();

  const MOVIES_PER_PAGE = 10;

  useEffect(() => {
    // Reset pagination when filters change
    setPage(1);
    setHasMore(true);
  }, [searchTerm, filterOptions]);

  // We're now using the movies from context, so we don't need to fetch them here
  // This is just a placeholder for pagination if needed in the future
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    // We would fetch more movies here if needed
  };

  // Filter movies based on search term and filter options
  const filteredMovies = useMemo(() => {
    if (!movies || movies.length === 0) {
      return [];
    }

    return movies
      .filter((movie) => {
        // Search term filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const titleMatch = movie.title.toLowerCase().includes(searchLower);
          const genreMatch = movie.genre.some((g) => g.toLowerCase().includes(searchLower));
          const descMatch =
            movie.description && movie.description.toLowerCase().includes(searchLower);

          if (!titleMatch && !genreMatch && !descMatch) {
            return false;
          }
        }

        // Genre filter
        if (filterOptions.genre && filterOptions.genre !== 'all') {
          const genreFilter = filterOptions.genre.toLowerCase();
          if (!movie.genre.some((g) => g.toLowerCase().includes(genreFilter))) {
            return false;
          }
        }

        // Year filter (using years array from filterOptions)
        if (filterOptions.years && filterOptions.years.length > 0 && movie.releaseDate) {
          const movieYear = new Date(movie.releaseDate).getFullYear();
          if (!filterOptions.years.includes(movieYear)) {
            return false;
          }
        }

        // Rating filter
        if (filterOptions.rating && movie.rating) {
          const movieRating =
            typeof movie.rating === 'string' ? parseFloat(movie.rating) : movie.rating;

          if (movieRating < filterOptions.rating) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort based on sort option
        if (filterOptions.sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else if (filterOptions.sortBy === 'rating') {
          const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : a.rating || 0;
          const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : b.rating || 0;
          return ratingB - ratingA;
        } else if (filterOptions.sortBy === 'releaseDate' && a.releaseDate && b.releaseDate) {
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        }

        // Default sort (popularity or no sort)
        return 0;
      });
  }, [movies, searchTerm, filterOptions]);

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-white text-xl">Loading movies...</div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">All Movies</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        {filteredMovies.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-netflix-text-gray mb-4">No movies found matching your filters</p>
            <p className="text-netflix-text-gray text-sm">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredMovies.map((movie, index) => (
            <MovieCard
              key={`${movie.id}-${index}`}
              movie={movie}
              index={index}
              showPlayButton={false}
              showShowtimes={true}
              showDetails={true}
              showStats={false}
              showDetailsOnMobile={false}
            />
          ))
        )}
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2 text-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-netflix-red"></div>
            <span>Loading more movies...</span>
          </div>
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && filteredMovies.length > 0 && (
        <div className="text-center py-8">
          <p className="text-netflix-text-gray">You have seen all available movies!</p>
        </div>
      )}
    </div>
  );
}
