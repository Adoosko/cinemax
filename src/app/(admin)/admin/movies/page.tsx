'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoUpload } from '@/components/admin/video-upload';
import { EditMovieModal } from '@/components/admin/edit-movie-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  Clock,
  Upload,
  Play,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Film,
  Users,
  TrendingUp,
  X,
  ExternalLink,
  Settings,
} from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  description: string;
  duration: number;
  genre: string[];
  rating?: string;
  director: string;
  cast: string[];
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  releaseDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MoviesAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [selectedMovieForUpload, setSelectedMovieForUpload] = useState<string | null>(null);
  const [selectedMovieTitleForUpload, setSelectedMovieTitleForUpload] = useState<string | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMovieForEdit, setSelectedMovieForEdit] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'title'>('newest');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/movies');

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();
      setMovies(data.movies || []);
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
      const matchesGenre = filterGenre === 'all' || movie.genre.includes(filterGenre);
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating':
          return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Get unique genres for filter
  const allGenres = [...new Set(movies.flatMap((movie) => movie.genre))];

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
      const response = await fetch(`/api/admin/movies/${movieId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMovies((prev) => prev.filter((movie) => movie.id !== movieId));
      }
    } catch (error) {
      console.error('Failed to delete movie:', error);
    }
  };

  const handleUpdateMovie = async (movieData: any) => {
    if (!selectedMovieForEdit) return;

    try {
      const response = await fetch(`/api/admin/movies/${selectedMovieForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      if (response.ok) {
        const { movie } = await response.json();
        setMovies((prev) => prev.map((m) => (m.id === movie.id ? movie : m)));
        setShowEditModal(false);
        setSelectedMovieForEdit(null);
      }
    } catch (error) {
      console.error('Failed to update movie:', error);
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
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Movies Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60"
          >
            Manage your movie catalog and content
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-netflix-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-3 shadow-lg hover:shadow-netflix-red/25"
        >
          <Plus className="w-5 h-5" />
          <span>Add Movie</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Total Movies',
            value: stats.total,
            icon: Film,
            color: 'from-netflix-red to-red-700',
          },
          {
            label: 'Active Movies',
            value: stats.active,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
          },
          {
            label: 'Avg Rating',
            value: stats.avgRating.toFixed(1),
            icon: Star,
            color: 'from-yellow-500 to-yellow-600',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-netflix-red/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search movies by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 text-white placeholder-white/40 pl-12 pr-4 py-4 rounded-xl border border-white/10 focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Genre Filter */}
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-4 focus:border-netflix-red focus:outline-none"
            >
              <option value="all">All Genres</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-4 focus:border-netflix-red focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rated</option>
              <option value="title">Alphabetical</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-netflix-red text-white'
                    : 'text-white/60 hover:text-white'
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
                  viewMode === 'list'
                    ? 'bg-netflix-red text-white'
                    : 'text-white/60 hover:text-white'
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
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white/60 text-lg">Loading movies...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-400 text-xl font-semibold mb-2">Error Loading Movies</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <motion.button
            onClick={fetchMovies}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Try Again
          </motion.button>
        </motion.div>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Film className="w-12 h-12 text-white/40" />
              </div>
              <h3 className="text-white text-2xl font-semibold mb-2">No movies found</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Start building your movie catalog'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-netflix-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-3 mx-auto shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Movie</span>
              </motion.button>
            </motion.div>
          ) : (
            /* Movies Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-netflix-red/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/50">
                    {/* Movie Image */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={
                          movie.backdropUrl ||
                          movie.posterUrl ||
                          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop'
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                          <img
                            src={movie.posterUrl}
                            alt={movie.title + ' poster'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewMovie(movie)}
                          className="bg-white/90 hover:bg-white text-black p-2 rounded-full transition-all shadow-lg"
                          title="View Movie"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedMovieForEdit(movie);
                            setShowEditModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all shadow-lg"
                          title="Edit Movie"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedMovieForUpload(movie.id);
                            setSelectedMovieTitleForUpload(movie.title);
                            setShowVideoUpload(true);
                          }}
                          className="bg-netflix-red hover:bg-red-700 text-white p-2 rounded-full transition-all shadow-lg"
                          title="Upload Videos"
                        >
                          <Upload className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMovie(movie.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-all shadow-lg"
                          title="Delete Movie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
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
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Video Upload Modal */}
      <AnimatePresence>
        {showVideoUpload && selectedMovieForUpload && (
          <VideoUpload
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
      </AnimatePresence>

      {/* Edit Movie Modal */}
      <AnimatePresence>
        {showEditModal && selectedMovieForEdit && (
          <EditMovieModal
            isOpen={showEditModal}
            movie={selectedMovieForEdit}
            onUpdateMovie={handleUpdateMovie}
            onClose={() => {
              setShowEditModal(false);
              setSelectedMovieForEdit(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
