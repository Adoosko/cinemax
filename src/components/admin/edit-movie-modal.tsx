'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Download,
  Film,
  ImageIcon,
  Info,
  Loader,
  Mic,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
  User,
  Video,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import AiTrailerGenerator from './ai-trailer-generator';

interface EditMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMovie: (movieData: MovieFormData) => Promise<void>;
  movie?: {
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
  };
  isNew?: boolean;
}

export interface MovieFormData {
  title: string;
  description: string;
  duration: number;
  genre: string[];
  rating: string;
  director: string;
  cast: string[];
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  releaseDate: string;
  isActive: boolean;
}

export interface TMDBMovie {
  tmdbId: number;
  title: string;
  description: string;
  posterUrl: string | null;
  releaseDate: string;
  rating?: string | null;
  genre?: string[];
  director?: string;
  cast?: string[];
  duration?: number;
}
function EditMovieModal({
  isOpen,
  onClose,
  onUpdateMovie,
  movie,
  isNew = false,
}: EditMovieModalProps) {
  // Form state
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    description: '',
    duration: 0,
    genre: [],
    rating: '',
    director: '',
    cast: [],
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    releaseDate: '',
    isActive: true,
  });

  // TMDB Search State
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbSearchResults, setTmdbSearchResults] = useState<TMDBMovie[]>([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);

  // Other state
  const [castInput, setCastInput] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'trailers'>('details');
  const [genreInput, setGenreInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof MovieFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldStatus, setFieldStatus] = useState<
    Partial<Record<keyof MovieFormData, 'valid' | 'invalid' | 'empty'>>
  >({});

  // TMDB Search Functions
  const searchTMDB = async (query: string) => {
    if (!query.trim()) return;

    setTmdbSearching(true);
    try {
      const response = await fetch(`/api/admin/movies/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search TMDB');

      const data = await response.json();
      setTmdbSearchResults(data.movies || []);
      setShowTmdbResults(true);
    } catch (error) {
      console.error('TMDB search error:', error);
      setTmdbSearchResults([]);
    } finally {
      setTmdbSearching(false);
    }
  };

  // TMDB Search Effects
  useEffect(() => {
    if (!tmdbSearchQuery.trim()) {
      setTmdbSearchResults([]);
      setShowTmdbResults(false);
      return;
    }

    // Debounce search to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      searchTMDB(tmdbSearchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [tmdbSearchQuery]);

  const populateFromTMDB = async (tmdbMovie: TMDBMovie) => {
    try {
      // Get full movie details from TMDB API
      const response = await fetch('/api/admin/movies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tmdbId: tmdbMovie.tmdbId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get movie details');
      }

      const data = await response.json();
      const fullMovieData = data.movie;

      setFormData({
        ...formData,
        title: fullMovieData.title,
        description: fullMovieData.description,
        releaseDate: fullMovieData.releaseDate,
        genre: fullMovieData.genre,
        rating: fullMovieData.rating,
        director: fullMovieData.director,
        cast: fullMovieData.cast,
        posterUrl: fullMovieData.posterUrl,
        backdropUrl: fullMovieData.backdropUrl || '',
        trailerUrl: fullMovieData.trailerUrl || '',
        duration: fullMovieData.duration,
      });
    } catch (error) {
      console.error('Error fetching full movie details:', error);
      // Fallback to basic data if detailed fetch fails
      setFormData({
        ...formData,
        title: tmdbMovie.title,
        description: tmdbMovie.description,
        releaseDate: tmdbMovie.releaseDate,
        genre: tmdbMovie.genre || [],
        rating: tmdbMovie.rating ? tmdbMovie.rating.toString() : '',
        director: tmdbMovie.director || '',
        cast: tmdbMovie.cast || [],
        posterUrl: tmdbMovie.posterUrl || '',
        duration: tmdbMovie.duration || 120,
      });
    }

    setShowTmdbResults(false);
    setTmdbSearchQuery('');
  };

  // Initialize form data when movie changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (movie && !isNew) {
        // Editing existing movie
        setFormData({
          title: movie.title,
          description: movie.description,
          duration: movie.duration,
          genre: movie.genre,
          rating: movie.rating || '',
          director: movie.director,
          cast: movie.cast,
          posterUrl: movie.posterUrl || '',
          backdropUrl: movie.backdropUrl || '',
          trailerUrl: movie.trailerUrl || '',
          releaseDate: movie.releaseDate,
          isActive: movie.isActive,
        });
      } else {
        // Adding new movie - use defaults
        setFormData({
          title: '',
          description: '',
          duration: 120,
          genre: [],
          rating: '',
          director: '',
          cast: [],
          posterUrl: '',
          backdropUrl: '',
          trailerUrl: '',
          releaseDate: new Date().toISOString().split('T')[0], // Today's date
          isActive: true,
        });
      }
    }
  }, [movie, isNew, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    validateField(name as keyof MovieFormData, value);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({ ...prev, [name]: numValue }));

    // Real-time validation
    validateField(name as keyof MovieFormData, numValue);
  };

  const addGenre = () => {
    if (genreInput.trim() && !formData.genre.includes(genreInput.trim())) {
      const newGenres = [...formData.genre, genreInput.trim()];
      setFormData((prev) => ({ ...prev, genre: newGenres }));
      setGenreInput('');
      // Validate genre field
      validateField('genre', newGenres);
    }
  };

  const removeGenre = (genre: string) => {
    const newGenres = formData.genre.filter((g) => g !== genre);
    setFormData((prev) => ({ ...prev, genre: newGenres }));
    // Validate genre field
    validateField('genre', newGenres);
  };

  const addCastMember = () => {
    if (castInput.trim() && !formData.cast.includes(castInput.trim())) {
      setFormData((prev) => ({ ...prev, cast: [...prev.cast, castInput.trim()] }));
      setCastInput('');
    }
  };

  const removeCastMember = (castMember: string) => {
    setFormData((prev) => ({ ...prev, cast: prev.cast.filter((c) => c !== castMember) }));
  };

  // Real-time field validation
  const validateField = (
    fieldName: keyof MovieFormData,
    value: string | number | boolean | string[]
  ) => {
    let isValid = false;
    let error = '';

    switch (fieldName) {
      case 'title':
        if (typeof value === 'string') {
          isValid = value.trim().length > 0;
          error = isValid ? '' : 'Title is required';
        }
        break;
      case 'description':
        if (typeof value === 'string') {
          isValid = value.trim().length > 0;
          error = isValid ? '' : 'Description is required';
        }
        break;
      case 'duration':
        if (typeof value === 'number') {
          isValid = value > 0;
          error = isValid ? '' : 'Duration must be greater than 0';
        }
        break;
      case 'genre':
        if (Array.isArray(value)) {
          isValid = value.length > 0;
          error = isValid ? '' : 'At least one genre is required';
        }
        break;
      case 'director':
        if (typeof value === 'string') {
          isValid = value.trim().length > 0;
          error = isValid ? '' : 'Director is required';
        }
        break;
      case 'releaseDate':
        if (typeof value === 'string') {
          isValid = value.trim().length > 0;
          error = isValid ? '' : 'Release date is required';
        }
        break;
      default:
        isValid = true;
    }

    setFieldStatus((prev) => ({ ...prev, [fieldName]: isValid ? 'valid' : 'invalid' }));
    setErrors((prev) => ({ ...prev, [fieldName]: error }));

    return isValid;
  };

  const validateForm = () => {
    const requiredFields: (keyof MovieFormData)[] = [
      'title',
      'description',
      'duration',
      'genre',
      'director',
      'releaseDate',
    ];
    let isFormValid = true;

    requiredFields.forEach((field) => {
      const fieldValid = validateField(field, formData[field]);
      if (!fieldValid) isFormValid = false;
    });

    return isFormValid;
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    const requiredFields: (keyof MovieFormData)[] = [
      'title',
      'description',
      'duration',
      'genre',
      'director',
      'releaseDate',
    ];
    const completedFields = requiredFields.filter((field) => {
      const value = formData[field];
      switch (field) {
        case 'title':
        case 'description':
        case 'director':
        case 'releaseDate':
          return value && String(value).trim().length > 0;
        case 'duration':
          return typeof value === 'number' && value > 0;
        case 'genre':
          return Array.isArray(value) && value.length > 0;
        default:
          return false;
      }
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onUpdateMovie(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update movie:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-white/10">
          <div className="flex items-center justify-between p-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-netflix-red rounded-xl flex items-center justify-center">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">
                  {isNew ? 'Add New Movie' : 'Edit Movie'}
                </h1>
                <p className="text-white/60 text-sm">
                  {isNew
                    ? 'Import from TMDB or manually add movie details'
                    : 'Update movie details and generate AI trailers'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Progress Indicator */}
              {isNew && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-white text-sm font-semibold">
                      {completionPercentage}% Complete
                    </div>
                    <div className="text-white/60 text-xs">Required fields</div>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={completionPercentage === 100 ? '#22c55e' : '#e50914'}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(completionPercentage / 100) * 176} 176`}
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {completionPercentage === 100 ? (
                        <Check className="w-6 h-6 text-green-500" />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {completionPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Required Fields Checklist */}
          {isNew && completionPercentage < 100 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-8 pb-4"
            >
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-netflix-red" />
                  Complete these required fields to add the movie:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: 'title', label: 'Movie Title' },
                    { field: 'description', label: 'Description' },
                    { field: 'duration', label: 'Duration' },
                    { field: 'director', label: 'Director' },
                    { field: 'genre', label: 'At least one genre' },
                    { field: 'releaseDate', label: 'Release Date' },
                  ].map(({ field, label }) => {
                    const isComplete = (() => {
                      const value = formData[field as keyof MovieFormData];
                      switch (field) {
                        case 'title':
                        case 'description':
                        case 'director':
                        case 'releaseDate':
                          return value && String(value).trim().length > 0;
                        case 'duration':
                          return value && Number(value) > 0;
                        case 'genre':
                          return Array.isArray(value) && value.length > 0;
                        default:
                          return false;
                      }
                    })();

                    return (
                      <div key={field} className="flex items-center space-x-2">
                        {isComplete ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-white/30 rounded flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs ${isComplete ? 'text-green-400' : 'text-white/60'}`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="flex px-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'details'
                  ? 'border-netflix-red text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Movie Details</span>
            </button>
            <button
              onClick={() => setActiveTab('trailers')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'trailers'
                  ? 'border-netflix-red text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>AI Trailers</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-8">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h3 className="text-white font-semibold">Movie Status</h3>
                  <p className="text-white/60 text-sm">
                    Control whether this movie is visible to users
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <Input
                    aria-label="active"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                </label>
              </div>

              {/* TMDB Search Section */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-netflix-red rounded-lg flex items-center justify-center">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Import from TMDB</h3>
                    <p className="text-white/60 text-sm">
                      Search and import movie data from The Movie Database
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search for a movie..."
                      value={tmdbSearchQuery}
                      onChange={(e) => setTmdbSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                    />
                    {tmdbSearching && (
                      <Loader className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-netflix-red" />
                    )}
                  </div>

                  {/* Search Results */}
                  {showTmdbResults && tmdbSearchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="max-h-64 overflow-y-auto space-y-2"
                    >
                      {tmdbSearchResults.map((movie) => (
                        <motion.div
                          key={movie.tmdbId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center space-x-4 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors cursor-pointer"
                          onClick={() => populateFromTMDB(movie)}
                        >
                          {movie.posterUrl && (
                            <Image
                              src={movie.posterUrl}
                              alt={movie.title}
                              width={48}
                              height={72}
                              className="w-12 h-18 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{movie.title}</h4>
                            <p className="text-white/60 text-sm">{movie.releaseDate}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-white/60 text-xs">{movie.rating || 'N/A'}</span>
                            </div>
                          </div>
                          <Download className="w-5 h-5 text-netflix-red" />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {showTmdbResults && tmdbSearchResults.length === 0 && !tmdbSearching && (
                    <div className="text-center py-8 text-white/60">
                      No movies found. Try a different search term.
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  Movie Title <span className="text-netflix-red">*</span>
                </label>
                <div className="relative">
                  <Film className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                      errors.title ? 'border-netflix-red' : 'border-white/20'
                    } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40`}
                    placeholder="Enter movie title"
                  />
                </div>
                {errors.title && (
                  <div className="flex items-center space-x-2 text-netflix-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.title}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  Description <span className="text-netflix-red">*</span>
                </label>
                <div className="relative">
                  <Info className="absolute left-4 top-4 w-5 h-5 text-white/40" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                      errors.description ? 'border-netflix-red' : 'border-white/20'
                    } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40 resize-none`}
                    placeholder="Enter movie description"
                  />
                </div>
                {errors.description && (
                  <div className="flex items-center space-x-2 text-netflix-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.description}</span>
                  </div>
                )}
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    Duration (minutes) <span className="text-netflix-red">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleNumberChange}
                      min="1"
                      className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                        errors.duration ? 'border-netflix-red' : 'border-white/20'
                      } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.duration && (
                    <div className="flex items-center space-x-2 text-netflix-red text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.duration}</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">Rating (0-10)</label>
                  <div className="relative">
                    <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all"
                      placeholder="8.5"
                    />
                  </div>
                </div>

                {/* Director */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    Director <span className="text-netflix-red">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="director"
                      value={formData.director}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                        errors.director ? 'border-netflix-red' : 'border-white/20'
                      } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40`}
                      placeholder="Director name"
                    />
                  </div>
                  {errors.director && (
                    <div className="flex items-center space-x-2 text-netflix-red text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.director}</span>
                    </div>
                  )}
                </div>

                {/* Release Date */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    Release Date <span className="text-netflix-red">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="date"
                      name="releaseDate"
                      value={formData.releaseDate}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                        errors.releaseDate ? 'border-netflix-red' : 'border-white/20'
                      } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.releaseDate && (
                    <div className="flex items-center space-x-2 text-netflix-red text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.releaseDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Genre Tags */}
              <div className="space-y-4">
                <label className="block text-white font-semibold">
                  Genres <span className="text-netflix-red">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Add genre (e.g., Action, Comedy)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={addGenre}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-netflix-red hover:bg-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </motion.button>
                </div>

                {errors.genre && (
                  <div className="flex items-center space-x-2 text-netflix-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.genre}</span>
                  </div>
                )}

                {formData.genre && formData.genre.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.genre.map((genre, index) => (
                      <motion.span
                        key={genre}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/10 border border-white/20 text-white py-2 px-4 rounded-lg flex items-center space-x-2 group hover:border-netflix-red/50 transition-colors"
                      >
                        <span>{genre}</span>
                        <button
                          type="button"
                          onClick={() => removeGenre(genre)}
                          className="text-white/60 hover:text-netflix-red ml-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cast Members */}
              <div className="space-y-4">
                <label className="block text-white font-semibold">Cast Members</label>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={castInput}
                      onChange={(e) => setCastInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Add cast member"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCastMember())}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={addCastMember}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-4 px-6 rounded-xl font-semibold transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </motion.button>
                </div>

                {formData.cast && formData.cast.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.cast.map((castMember, index) => (
                      <motion.span
                        key={castMember}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/10 border border-white/20 text-white py-2 px-4 rounded-lg flex items-center space-x-2 group hover:border-netflix-red/50 transition-colors"
                      >
                        <span>{castMember}</span>
                        <button
                          type="button"
                          onClick={() => removeCastMember(castMember)}
                          className="text-white/60 hover:text-netflix-red ml-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {/* Media URLs */}
              <div className="grid grid-cols-1 gap-6">
                {/* Poster URL */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">Poster URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="posterUrl"
                      value={formData.posterUrl}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Enter poster image URL"
                    />
                  </div>
                  {formData.posterUrl && (
                    <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <Image
                        width={200}
                        height={300}
                        src={formData.posterUrl}
                        alt="Poster preview"
                        className="h-32 object-contain mx-auto rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Backdrop URL */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">Backdrop URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="backdropUrl"
                      value={formData.backdropUrl}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Enter backdrop image URL"
                    />
                  </div>
                  {formData.backdropUrl && (
                    <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <Image
                        width={400}
                        height={200}
                        src={formData.backdropUrl}
                        alt="Backdrop preview"
                        className="h-32 w-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Trailer URL */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">Trailer URL</label>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="trailerUrl"
                      value={formData.trailerUrl}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Enter trailer video URL"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center space-x-2 px-6 py-3 text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className="bg-netflix-red hover:bg-red-700 disabled:bg-white/20 disabled:text-white/40 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-netflix-red/25"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>{isNew ? 'Adding Movie...' : 'Updating Movie...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{isNew ? 'Add Movie' : 'Update Movie'}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          ) : (
            /* AI Trailers Tab */
            <div className="space-y-6">
              {movie && (
                <AiTrailerGenerator
                  movie={{
                    ...movie,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    slug: movie.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, ''),
                  }}
                  onTrailerGenerated={(trailer) => {
                    console.log('Trailer generated:', trailer);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
export default EditMovieModal;
