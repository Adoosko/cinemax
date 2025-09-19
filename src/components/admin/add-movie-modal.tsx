'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Calendar,
  Clock,
  Star,
  Tag,
  User,
  Video,
  Info,
  Search,
  Loader,

  X,
  Plus,
  Check,
  AlertCircle,

  Sparkles,
  ImageIcon,
} from 'lucide-react';
import Image from 'next/image';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMovie: (movieData: MovieFormData) => void;
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
}

export function AddMovieModal({ isOpen, onClose, onAddMovie }: AddMovieModalProps) {
  const initialFormData: MovieFormData = {
    title: '',
    description: '',
    duration: 120,
    genre: [],
    rating: '8.0',
    director: '',
    cast: [],
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    releaseDate: new Date().toISOString().split('T')[0],
  };

  const [formData, setFormData] = useState<MovieFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MovieFormData, string>>>({});
  const [genreInput, setGenreInput] = useState('');
  const [castInput, setCastInput] = useState('');
  const [currentStep, setCurrentStep] = useState<'search' | 'form'>('search');

  // Movie search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof MovieFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));

    if (errors[name as keyof MovieFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const addGenre = () => {
    if (genreInput.trim() && !formData.genre.includes(genreInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        genre: [...prev.genre, genreInput.trim()],
      }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genre: prev.genre.filter((g) => g !== genre),
    }));
  };

  const addCastMember = () => {
    if (castInput.trim() && !formData.cast.includes(castInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        cast: [...prev.cast, castInput.trim()],
      }));
      setCastInput('');
    }
  };

  const removeCastMember = (castMember: string) => {
    setFormData((prev) => ({
      ...prev,
      cast: prev.cast.filter((c) => c !== castMember),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MovieFormData, string>> = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (formData.genre.length === 0) newErrors.genre = 'At least one genre is required';
    if (!formData.director) newErrors.director = 'Director is required';
    if (!formData.releaseDate) newErrors.releaseDate = 'Release date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onAddMovie(formData);
      setFormData(initialFormData);
      setCurrentStep('search');
      onClose();
    } catch (error) {
      console.error('Failed to add movie:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchMovies = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/admin/movies/search?query=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search for movies');
      }

      const data = await response.json();
      setSearchResults(data.movies || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getMovieDetails = async (tmdbId: number) => {
    setIsLoadingDetails(true);
    setSelectedMovie(null);

    try {
      const response = await fetch('/api/admin/movies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tmdbId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get movie details');
      }

      const data = await response.json();
      setSelectedMovie(data.movie);

      setFormData({
        title: data.movie.title || '',
        description: data.movie.description || '',
        duration: data.movie.duration || 120,
        genre: data.movie.genre || [],
        rating: data.movie.rating || 'PG-13',
        director: data.movie.director || '',
        cast: data.movie.cast || [],
        posterUrl: data.movie.posterUrl || '',
        backdropUrl: data.movie.backdropUrl || '',
        trailerUrl: data.movie.trailerUrl || '',
        releaseDate: data.movie.releaseDate || new Date().toISOString().split('T')[0],
      });

      setCurrentStep('form');
    } catch (error) {
      console.error('Error getting movie details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        searchMovies();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        <div className="flex items-center justify-between p-8 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-netflix-red rounded-xl flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Add New Movie</h1>
              <p className="text-white/60 text-sm">
                {currentStep === 'search' ? 'Search or create manually' : 'Complete movie details'}
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === 'search'
                    ? 'bg-netflix-red text-white'
                    : 'bg-white/20 text-white/60'
                }`}
              >
                1
              </div>
              <div
                className={`w-12 h-1 ${currentStep === 'form' ? 'bg-netflix-red' : 'bg-white/20'}`}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === 'form' ? 'bg-netflix-red text-white' : 'bg-white/20 text-white/60'
                }`}
              >
                2
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <AnimatePresence mode="wait">
            {currentStep === 'search' ? (
              /* Search Step */
              <motion.div
                key="search"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-8"
              >
                {/* Search Section */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-netflix-red" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Search Movie Database</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                        placeholder="Search for a movie (e.g., The Dark Knight, Inception)"
                      />
                    </div>

                    {isSearching && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-8"
                      >
                        <Loader className="w-6 h-6 text-netflix-red animate-spin" />
                        <span className="ml-3 text-white/60">Searching movie database...</span>
                      </motion.div>
                    )}

                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 max-h-60 overflow-y-auto"
                      >
                        {searchResults.map((movie, index) => (
                          <motion.div
                            key={movie.tmdbId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-netflix-red/50 rounded-lg cursor-pointer transition-all duration-200"
                            onClick={() => getMovieDetails(movie.tmdbId)}
                          >
                            {movie.posterUrl ? (
                              <Image
                                src={movie.posterUrl}
                                alt={movie.title}
                                width={48}
                                height={72}
                                className="w-12 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                                <Film className="w-6 h-6 text-white/40" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-white font-semibold group-hover:text-netflix-red transition-colors">
                                {movie.title}
                              </div>
                              <div className="text-white/60 text-sm">
                                {movie.releaseDate
                                  ? new Date(movie.releaseDate).getFullYear()
                                  : 'Unknown'}{' '}
                                • {movie.director || 'Unknown Director'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-netflix-red text-sm font-medium">Select</span>
                              <div className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center">
                                <Plus className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {isLoadingDetails && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-8"
                      >
                        <Loader className="w-6 h-6 text-netflix-red animate-spin" />
                        <span className="ml-3 text-white/60">Loading movie details...</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Manual Entry Option */}
                <div className="text-center">
                  <div className="text-white/40 text-sm mb-4">Can't find your movie?</div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep('form')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Manually</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              /* Form Step */
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Back Button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('search')}
                      className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Back to Search</span>
                    </button>

                    {selectedMovie && (
                      <div className="flex items-center space-x-2 bg-netflix-red/20 border border-netflix-red/30 text-netflix-red py-2 px-4 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Auto-filled from database</span>
                      </div>
                    )}
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

                    {formData.genre.length > 0 && (
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
                          onKeyPress={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), addCastMember())
                          }
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

                    {formData.cast.length > 0 && (
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
                            src={formData.posterUrl}
                            alt="Poster preview"
                            width={100}
                            height={100}
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
                          <img
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
                      onClick={() => setCurrentStep('search')}
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
                          <span>Adding Movie...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Add Movie</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
