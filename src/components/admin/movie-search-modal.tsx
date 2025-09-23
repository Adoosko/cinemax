'use client';

import { TMDBService } from '@/lib/services/tmdb-service';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetflixCard } from '@/components/ui/glass-card';
import { Search, X, Star, Calendar, MapPin, Download } from 'lucide-react';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
}

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movieData: any) => void;
}

export function MovieSearchModal({ isOpen, onClose, onSelectMovie }: MovieSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/movies/search-csfd?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search TMDB');
      }

      const data = await response.json();
      setSearchResults(data.movies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TMDB search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMovie = async (tmdbId: number) => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/movies/search-csfd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tmdbId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }

      const data = await response.json();
      onSelectMovie(data.movieData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movie details');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-netflix-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <NetflixCard className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-netflix-medium-gray">
                <h2 className="text-2xl font-bold text-netflix-white">Search ČSFD Movies</h2>
                <button
                  onClick={onClose}
                  className="text-netflix-text-gray hover:text-netflix-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-netflix-medium-gray">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-netflix-text-gray" />
                    <input
                      type="text"
                      placeholder="Search for movies on ČSFD..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full bg-netflix-medium-gray text-netflix-white placeholder-netflix-text-gray pl-12 pr-4 py-3 rounded-lg border border-netflix-light-gray focus:border-netflix-red focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="bg-netflix-red hover:bg-netflix-dark-red disabled:bg-netflix-medium-gray text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="p-6 overflow-y-auto max-h-96">
                {error && <div className="text-red-400 text-center py-4">{error}</div>}

                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-netflix-red mx-auto mb-4"></div>
                    <p className="text-netflix-text-gray">Searching ČSFD...</p>
                  </div>
                )}

                {!loading && searchResults.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-netflix-text-gray">No movies found for "{searchQuery}"</p>
                  </div>
                )}

                {!loading && searchResults.length > 0 && (
                  <div className="space-y-4">
                    {searchResults.map((movie) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-4 p-4 bg-netflix-medium-gray/30 rounded-lg hover:bg-netflix-medium-gray/50 transition-colors"
                      >
                        {/* Poster */}
                        <div className="w-16 h-24 rounded overflow-hidden bg-netflix-medium-gray flex-shrink-0">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-netflix-text-gray text-xs">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Movie Info */}
                        <div className="flex-1">
                          <h3 className="text-netflix-white font-bold text-lg mb-1">
                            {movie.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-netflix-text-gray mb-2">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {movie.release_date
                                  ? new Date(movie.release_date).getFullYear()
                                  : 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4" />
                              <span>{movie.vote_average.toFixed(1)}/10</span>
                            </div>
                          </div>
                          <div className="text-sm text-netflix-text-gray">
                            <span className="font-medium">Overview:</span>{' '}
                            {movie.overview
                              ? movie.overview.slice(0, 100) + '...'
                              : 'No description available'}
                          </div>
                        </div>

                        {/* Select Button */}
                        <button
                          onClick={() => handleSelectMovie(movie.id)}
                          className="bg-netflix-red hover:bg-netflix-dark-red text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Import</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </NetflixCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
