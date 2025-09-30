'use client';
import { useEffect, useMemo, useState } from 'react';
import { MovieCard } from './movie-card';
import { useMoviesContext } from './movies-context';

export default function MovieGrid() {
  // Pagination state if you choose to support infinite scroll
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { searchTerm, filterOptions, movies, isLoading } = useMoviesContext();
  const MOVIES_PER_PAGE = 10;

  // Reset pagination if filters/search change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [searchTerm, filterOptions]);

  // Filter + sort logic. Move to Web Worker for very large datasets (>500 items).
  const filteredMovies = useMemo(() => {
    if (!movies || movies.length === 0) return [];

    return movies
      .filter((movie) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const titleMatch = movie.title.toLowerCase().includes(searchLower);
          let genreMatch = false;
          if (Array.isArray(movie.genre)) {
            genreMatch = movie.genre.some((g) => g.toLowerCase().includes(searchLower));
          } else if (typeof movie.genre === 'string') {
            genreMatch = movie.genre.toLowerCase().includes(searchLower);
          }
          const descMatch = movie.description?.toLowerCase().includes(searchLower);

          if (!titleMatch && !genreMatch && !descMatch) return false;
        }
        // Genre filter
        if (filterOptions.genres && filterOptions.genres.length > 0) {
          let genreMatch = false;
          if (Array.isArray(movie.genre)) {
            genreMatch = movie.genre.some((mGenre) =>
              filterOptions.genres!.some((fGenre) =>
                mGenre.toLowerCase().includes(fGenre.toLowerCase())
              )
            );
          } else if (typeof movie.genre === 'string') {
            const movieGenreString = movie.genre.toLowerCase();
            genreMatch = filterOptions.genres.some((fGenre) =>
              movieGenreString.includes(fGenre.toLowerCase())
            );
          }
          if (!genreMatch) return false;
        }
        // Year filter
        if (filterOptions.years && filterOptions.years.length > 0 && movie.releaseDate) {
          const movieYear = new Date(movie.releaseDate).getFullYear();
          if (!filterOptions.years.includes(movieYear)) return false;
        }
        // Rating filter
        if (filterOptions.rating && movie.rating) {
          const movieRating =
            typeof movie.rating === 'string' ? parseFloat(movie.rating) : movie.rating;
          if (movieRating < filterOptions.rating) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filterOptions.sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else if (filterOptions.sortBy === 'rating') {
          const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : a.rating || 0;
          const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : b.rating || 0;
          return ratingB - ratingA;
        } else if (filterOptions.sortBy === 'releaseDate' && a.releaseDate && b.releaseDate) {
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        }
        return 0; // default (unsorted)
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
              priority={index < 6} // Ensures above-the-fold images use 'priority'
            />
          ))
        )}
      </div>
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2 text-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-netflix-red"></div>
            <span>Loading more movies...</span>
          </div>
        </div>
      )}
      {!hasMore && filteredMovies.length > 0 && (
        <div className="text-center py-8">
          <p className="text-netflix-text-gray">You have seen all available movies!</p>
        </div>
      )}
    </div>
  );
}
