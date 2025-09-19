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
  Image,
  Info,
  X,
  Plus,
  Check,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface EditMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMovie: (movieData: MovieFormData) => Promise<void>;
  movie: {
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

export function EditMovieModal({ isOpen, onClose, onUpdateMovie, movie }: EditMovieModalProps) {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MovieFormData, string>>>({});
  const [genreInput, setGenreInput] = useState('');
  const [castInput, setCastInput] = useState('');

  // Initialize form data when movie changes
  useEffect(() => {
    if (movie) {
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
    }
  }, [movie]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      setFormData((prev) => ({ ...prev, genre: [...prev.genre, genreInput.trim()] }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData((prev) => ({ ...prev, genre: prev.genre.filter((g) => g !== genre) }));
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

  const validateForm = () => {
    const newErrors: Partial<Record<keyof MovieFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.duration || formData.duration <= 0)
      newErrors.duration = 'Duration must be greater than 0';
    if (formData.genre.length === 0) newErrors.genre = 'At least one genre is required';
    if (!formData.director.trim()) newErrors.director = 'Director is required';
    if (!formData.releaseDate) newErrors.releaseDate = 'Release date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        <div className="flex items-center justify-between p-8 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-netflix-red rounded-xl flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Movie</h1>
              <p className="text-white/60 text-sm">Update movie details</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
          >
            <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-8">
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
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
              </label>
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
                  <Image className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
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
                    <img
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
                  <Image className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
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
                    <span>Updating Movie...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Update Movie</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
