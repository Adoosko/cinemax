'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, Play, Info } from 'lucide-react';
import { NetflixCard } from '@/components/ui/glass-card';
import { FilterOptions } from '@/components/movies/search-filter-bar';
import { useMoviesContext } from './movies-context';

// Use the Movie type from the cached data
import { type Movie } from '@/lib/data/movies-with-use-cache';

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
          const genreMatch =
            typeof movie.genre === 'string'
              ? movie.genre.toLowerCase().includes(searchLower)
              : Array.isArray(movie.genre) &&
                movie.genre.some((g) => g.toLowerCase().includes(searchLower));
          const descMatch =
            movie.description && movie.description.toLowerCase().includes(searchLower);

          if (!titleMatch && !genreMatch && !descMatch) {
            return false;
          }
        }

        // Genre filter
        if (filterOptions.genre && filterOptions.genre !== 'all') {
          const genreFilter = filterOptions.genre.toLowerCase();
          if (typeof movie.genre === 'string') {
            if (!movie.genre.toLowerCase().includes(genreFilter)) {
              return false;
            }
          } else if (Array.isArray(movie.genre)) {
            if (!movie.genre.some((g) => g.toLowerCase().includes(genreFilter))) {
              return false;
            }
          } else {
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
            <div key={`${movie.id}-${index}`}>
              <NetflixCard className="overflow-hidden group relative h-full">
                {/* Use backdrop if available, otherwise use poster */}
                <div className="relative aspect-[2/3] overflow-hidden h-full">
                  <Image
                    src={movie.posterUrl || '/placeholder-movie.jpg'}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority={index < 5}
                  />

                  {/* Gradient overlay for text readability - only visible on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Rating badge - always visible */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-white text-xs font-medium">{movie.rating}</span>
                  </div>

                  {/* Movie Info - Only visible on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <Link href={`/movies/${movie.slug}`}>
                      <h3 className="text-white font-bold text-lg mb-2 drop-shadow-lg">
                        {movie.title}
                      </h3>
                    </Link>

                    <div className="flex items-center space-x-3 text-sm text-white/90 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{movie.duration}</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">{movie.genre}</span>
                    </div>

                    {/* Showtimes Preview - Only show if movie has showtimes */}
                    {movie.showtimes &&
                      Array.isArray(movie.showtimes) &&
                      movie.showtimes.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-white/80 mb-2">Today's Showtimes</p>
                          <div className="flex flex-wrap gap-1">
                            {movie.showtimes.slice(0, 3).map((time: string) => (
                              <span
                                key={time}
                                className="text-xs bg-netflix-red/90 text-white px-2 py-1 rounded"
                              >
                                {time}
                              </span>
                            ))}
                            {movie.showtimes.length > 3 && (
                              <Link href={`/movies/${movie.slug}/book`}>
                                <span className="text-xs text-netflix-red bg-white/90 hover:bg-white px-2 py-1 rounded cursor-pointer">
                                  +{movie.showtimes.length - 3} more
                                </span>
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Action button */}
                    <Link href={`/movies/${movie.slug}`} className="block w-full">
                      <button className="w-full bg-white hover:bg-gray-200 text-black py-2 rounded-sm flex items-center justify-center space-x-2 transition-colors font-semibold">
                        <Info className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </NetflixCard>
            </div>
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
          <p className="text-netflix-text-gray">You've seen all available movies!</p>
        </div>
      )}
    </div>
  );
}
