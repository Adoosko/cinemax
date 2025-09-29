'use client';

import { AdminMovieFilters } from '@/components/admin/admin-movie-filters';
import {
  AdminMoviesProvider,
  useAdminMoviesContext,
} from '@/components/admin/admin-movies-context';
import { DynamicEditMovieModal, DynamicVideoUpload } from '@/components/modals/dynamic-modals';
import { ProgressiveImage } from '@/components/ui/progressive-image';
import { deleteMovie, getMovies, updateMovie, type Movie } from '@/lib/data/movies';
import { AlertCircle, Clock, Edit, Eye, Film, Mic, Plus, Star, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
interface MoviesAdminContentProps {
  initialMovies?: Movie[];
}

function MoviesAdminContent({ initialMovies = [] }: MoviesAdminContentProps) {
  const { searchTerm, filterOptions } = useAdminMoviesContext();
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [loading, setLoading] = useState(initialMovies.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [selectedMovieForUpload, setSelectedMovieForUpload] = useState<string | null>(null);
  const [selectedMovieTitleForUpload, setSelectedMovieTitleForUpload] = useState<string | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMovieForEdit, setSelectedMovieForEdit] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [generatingTrailerFor, setGeneratingTrailerFor] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch movies if we don't have initial movies
    if (initialMovies.length === 0) {
      fetchMovies();
    }
  }, [initialMovies.length]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const moviesData = await getMovies(true); // true for admin mode
      setMovies(moviesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered and sorted movies
  const filteredMovies = movies
    .filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre =
        !filterOptions.genres ||
        filterOptions.genres.length === 0 ||
        filterOptions.genres.some((genre) => movie.genre.includes(genre));
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      if (filterOptions.sortBy) {
        switch (filterOptions.sortBy) {
          case 'releaseDate':
            return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
          case 'rating':
            return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
          case 'title':
            return a.title.localeCompare(b.title);
          case 'popularity':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      } else {
        // Default sort by newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
      const success = await deleteMovie(movieId);
      if (success) {
        setMovies((prev) => prev.filter((movie) => movie.id !== movieId));
        toast.success('Movie deleted successfully');
      } else {
        toast.error('Failed to delete movie');
      }
    } catch (error) {
      console.error('Failed to delete movie:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete movie';
      toast.error(errorMessage);
    }
  };

  const handleGenerateTrailer = async (movie: Movie) => {
    if (!movie.slug) {
      alert('Movie must have a slug before generating trailers');
      return;
    }

    setGeneratingTrailerFor(movie.id);

    try {
      const response = await fetch('/api/admin/ai-trailers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.id,
          voiceStyle: 'epic',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate trailer');
      }

      const data = await response.json();
      alert(`AI trailer generated successfully for "${movie.title}"!`);
      console.log('Trailer generated:', data.trailer);
    } catch (error) {
      console.error('Error generating trailer:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate trailer');
    } finally {
      setGeneratingTrailerFor(null);
    }
  };

  const handleUpdateMovie = async (movieData: any) => {
    if (!selectedMovieForEdit) return;

    try {
      const updatedMovie = await updateMovie(selectedMovieForEdit.id, movieData);

      if (updatedMovie) {
        setMovies((prev) => prev.map((m) => (m.id === updatedMovie.id ? updatedMovie : m)));
        setShowEditModal(false);
        setSelectedMovieForEdit(null);
        toast.success('Movie updated successfully');
      } else {
        toast.error('Failed to update movie');
      }
    } catch (error) {
      console.error('Failed to update movie:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update movie';
      toast.error(errorMessage);
    }
  };

  const handleViewMovie = (movie: Movie) => {
    // Open movie in new tab
    window.open(`/movies/${movie.title.toLowerCase().replace(/\s+/g, '-')}/watch`, '_blank');
  };

  const stats = {
    total: movies.length,
    active: movies.filter((m) => m.isActive).length,
    avgRating: movies.reduce((acc, m) => acc + parseFloat(m.rating || '0'), 0) / movies.length || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Movies Management</h1>
          <p className="text-white/60">Manage your movie catalog and content</p>
        </div>
        <button
          onClick={() => setShowAddMovieModal(true)}
          className="bg-netflix-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-3 shadow-lg hover:shadow-netflix-red/25"
        >
          <Plus className="w-5 h-5" />
          <span>Add Movie</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div>
        <AdminMovieFilters />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-netflix-red text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-current rounded-sm" />
              ))}
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-netflix-red text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="w-4 h-4 flex flex-col space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-current h-0.5 rounded" />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden animate-pulse"
            >
              {/* Skeleton Image */}
              <div className="aspect-video bg-white/5"></div>

              {/* Skeleton Content */}
              <div className="p-6 space-y-3">
                <div className="h-6 bg-white/5 rounded-lg w-3/4"></div>
                <div className="flex space-x-2">
                  <div className="h-4 bg-white/5 rounded-full w-16"></div>
                  <div className="h-4 bg-white/5 rounded-full w-12"></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <div className="h-6 bg-white/5 rounded-full w-14"></div>
                  <div className="h-6 bg-white/5 rounded-full w-16"></div>
                  <div className="h-6 bg-white/5 rounded-full w-12"></div>
                </div>
                <div className="h-4 bg-white/5 rounded-lg w-full"></div>
                <div className="h-4 bg-white/5 rounded-lg w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-400 text-xl font-semibold mb-2">Error Loading Movies</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={fetchMovies}
            className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Movies Content */}
      {!loading && !error && (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-white/60">
              {filteredMovies.length} of {movies.length} movies
              {searchTerm && <span className="ml-2 text-netflix-red">matching "{searchTerm}"</span>}
            </div>
          </div>

          {filteredMovies.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Film className="w-12 h-12 text-white/40" />
              </div>
              <h3 className="text-white text-2xl font-semibold mb-2">No movies found</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Start building your movie catalog'}
              </p>
              <button
                onClick={() => setShowAddMovieModal(true)}
                className="bg-netflix-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-3 mx-auto shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Movie</span>
              </button>
            </div>
          ) : (
            /* Movies Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="group relative">
                  <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-netflix-red/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/50">
                    {/* Movie Image */}
                    <div className="relative aspect-video overflow-hidden">
                      <ProgressiveImage
                        src={
                          movie.backdropUrl ||
                          movie.posterUrl ||
                          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop'
                        }
                        alt={movie.title}
                        width={500}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={75}
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            movie.isActive
                              ? 'bg-netflix-red text-white'
                              : 'bg-white/20 text-white/60'
                          }`}
                        >
                          {movie.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Poster Thumbnail */}
                      {movie.posterUrl && (
                        <div className="absolute left-4 top-4 w-16 h-24 shadow-xl rounded-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
                          <ProgressiveImage
                            src={movie.posterUrl}
                            alt={movie.title + ' poster'}
                            width={64}
                            height={96}
                            className="w-full h-full object-cover"
                            quality={60}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <button
                          onClick={() => handleViewMovie(movie)}
                          className="bg-white/90 hover:bg-white text-black p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
                          title="View Movie"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMovieForEdit(movie);
                            setShowEditModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
                          title="Edit Movie"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMovieForUpload(movie.id);
                            setSelectedMovieTitleForUpload(movie.title);
                            setShowVideoUpload(true);
                          }}
                          className="bg-netflix-red hover:bg-red-700 text-white p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
                          title="Upload Videos"
                        >
                          <Upload className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleGenerateTrailer(movie)}
                          disabled={generatingTrailerFor === movie.id}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95 disabled:scale-100"
                          title="Generate AI Trailer"
                        >
                          {generatingTrailerFor === movie.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteMovie(movie.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
                          title="Delete Movie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="p-6">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                        {movie.title}
                      </h3>

                      <div className="flex items-center space-x-4 text-sm text-white/60 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{movie.duration} min</span>
                        </div>
                        {movie.rating && (
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span>{movie.rating}</span>
                          </div>
                        )}
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {movie.genre.slice(0, 3).map((genre, idx) => (
                          <span
                            key={idx}
                            className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                        {movie.genre.length > 3 && (
                          <span className="text-white/60 text-xs px-2 py-1">
                            +{movie.genre.length - 3} more
                          </span>
                        )}
                      </div>

                      <p className="text-white/60 text-sm line-clamp-2">{movie.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Video Upload Modal */}
      {showVideoUpload && selectedMovieForUpload && (
        <DynamicVideoUpload
          movieId={selectedMovieForUpload}
          movieTitle={selectedMovieTitleForUpload || undefined}
          onUploadComplete={(videoUrl) => {
            console.log('Video uploaded:', videoUrl);
            setShowVideoUpload(false);
            setSelectedMovieForUpload(null);
            setSelectedMovieTitleForUpload(null);
            fetchMovies(); // Refresh the list
          }}
          onClose={() => {
            setShowVideoUpload(false);
            setSelectedMovieForUpload(null);
            setSelectedMovieTitleForUpload(null);
          }}
        />
      )}

      {/* Edit Movie Modal */}
      {showEditModal && selectedMovieForEdit && (
        <DynamicEditMovieModal
          isOpen={showEditModal}
          movie={selectedMovieForEdit}
          onUpdateMovie={handleUpdateMovie}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMovieForEdit(null);
          }}
        />
      )}

      {/* Add Movie Modal */}
      {showAddMovieModal && (
        <DynamicEditMovieModal
          isOpen={showAddMovieModal}
          isNew={true}
          onUpdateMovie={async (movieData) => {
            try {
              const response = await fetch('/api/admin/movies', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(movieData),
              });

              const data = await response.json();

              if (response.ok) {
                setMovies((prev) => [data.movie, ...prev]);
                setShowAddMovieModal(false);
                toast.success('Movie added successfully');
                fetchMovies(); // Refresh the list
              } else {
                toast.error(data.error || 'Failed to add movie');
              }
            } catch (error) {
              console.error('Failed to add movie:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to add movie';
              toast.error(errorMessage);
            }
          }}
          onClose={() => setShowAddMovieModal(false)}
        />
      )}
    </div>
  );
}

interface MoviesAdminClientProps {
  initialMovies?: Movie[];
}

export function MoviesAdminClient({ initialMovies = [] }: MoviesAdminClientProps) {
  return (
    <AdminMoviesProvider>
      <MoviesAdminContent initialMovies={initialMovies} />
    </AdminMoviesProvider>
  );
}
