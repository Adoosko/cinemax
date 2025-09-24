'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NetflixCard } from '@/components/ui/glass-card';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Film,
} from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  duration: number;
  posterUrl?: string;
}

interface Theater {
  id: string;
  name: string;
  totalSeats: number;
  cinema: {
    name: string;
    city: string;
  };
}

interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  isActive: boolean;
  movie: {
    title: string;
    duration: number;
    posterUrl?: string;
  };
  theater: {
    name: string;
    totalSeats: number;
    cinema: {
      name: string;
    };
  };
  _count: {
    bookings: number;
  };
}

export default function ShowtimesAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    movieId: '',
    theaterId: '',
    startTime: '',
    basePrice: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showtimesRes, moviesRes, theatersRes] = await Promise.all([
        fetch('/api/admin/showtimes'),
        fetch('/api/admin/movies'),
        fetch('/api/admin/theaters'),
      ]);

      if (!showtimesRes.ok || !moviesRes.ok || !theatersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [showtimesData, moviesData, theatersData] = await Promise.all([
        showtimesRes.json(),
        moviesRes.json(),
        theatersRes.json(),
      ]);

      setShowtimes(showtimesData.showtimes);
      setMovies(moviesData.movies);
      setTheaters(theatersData.theaters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/showtimes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create showtime');
      }

      // Reset form and refresh data
      setFormData({ movieId: '', theaterId: '', startTime: '', basePrice: '' });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (showtimeId: string) => {
    if (!confirm('Are you sure you want to delete this showtime?')) return;

    try {
      const response = await fetch(`/api/admin/showtimes?id=${showtimeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete showtime');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const filteredShowtimes = showtimes.filter(
    (showtime) =>
      showtime.movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      showtime.theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      showtime.theater.cinema.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-netflix-white mb-2">Showtimes</h1>
          <p className="text-netflix-text-gray">Manage movie showtimes and schedules</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-netflix-red hover:bg-netflix-dark-red text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Showtime</span>
        </button>
      </div>

      {/* Add Showtime Form */}
      {showAddForm && (
        <NetflixCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-netflix-white">Add New Showtime</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-netflix-text-gray hover:text-netflix-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-netflix-white text-sm font-medium mb-2">Movie</label>
              <select
                value={formData.movieId}
                onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                className="w-full bg-netflix-medium-gray text-netflix-white border border-netflix-light-gray rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                required
              >
                <option value="">Select a movie</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-netflix-white text-sm font-medium mb-2">Theater</label>
              <select
                value={formData.theaterId}
                onChange={(e) => setFormData({ ...formData, theaterId: e.target.value })}
                className="w-full bg-netflix-medium-gray text-netflix-white border border-netflix-light-gray rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                required
              >
                <option value="">Select a theater</option>
                {theaters.map((theater) => (
                  <option key={theater.id} value={theater.id}>
                    {theater.cinema.name} - {theater.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-netflix-white text-sm font-medium mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-netflix-medium-gray text-netflix-white border border-netflix-light-gray rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-netflix-white text-sm font-medium mb-2">
                Base Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="w-full bg-netflix-medium-gray text-netflix-white border border-netflix-light-gray rounded-lg px-3 py-2 focus:border-netflix-red focus:outline-none"
                required
              />
            </div>

            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-netflix-red hover:bg-netflix-dark-red text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create Showtime
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </NetflixCard>
      )}

      {/* Filters & Search */}
      <NetflixCard className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-netflix-text-gray" />
            <input
              type="text"
              placeholder="Search showtimes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-netflix-medium-gray text-netflix-white placeholder-netflix-text-gray pl-10 pr-4 py-2 rounded-lg border border-netflix-light-gray focus:border-netflix-red focus:outline-none"
            />
          </div>
          <div className="flex space-x-3">
            <button className="bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </NetflixCard>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red mx-auto mb-4"></div>
          <p className="text-netflix-text-gray">Loading showtimes...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <NetflixCard className="p-6 text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchData}
            className="bg-netflix-red hover:bg-netflix-dark-red text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </NetflixCard>
      )}

      {/* Showtimes List */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredShowtimes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-netflix-text-gray mb-4">No showtimes found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-netflix-red hover:bg-netflix-dark-red text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Showtime</span>
              </button>
            </div>
          ) : (
            filteredShowtimes.map((showtime, index) => {
              const startDateTime = formatDateTime(showtime.startTime);
              const endDateTime = formatDateTime(showtime.endTime);

              return (
                <motion.div
                  key={showtime.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NetflixCard className="p-6 hover:bg-netflix-medium-gray/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Movie Poster */}
                        <div className="w-16 h-24 rounded-lg overflow-hidden bg-netflix-medium-gray flex-shrink-0">
                          <img
                            src={
                              showtime.movie.posterUrl ||
                              'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop'
                            }
                            alt={showtime.movie.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Showtime Details */}
                        <div className="flex-1">
                          <h3 className="text-netflix-white font-bold text-lg mb-1">
                            {showtime.movie.title}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-netflix-text-gray">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {showtime.theater.cinema.name} - {showtime.theater.name}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{startDateTime.date}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {startDateTime.time} - {endDateTime.time}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>
                                {showtime._count.bookings} / {showtime.theater.totalSeats} booked
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-netflix-white font-semibold">
                              ${showtime.basePrice}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                showtime.isActive
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-500 text-netflix-black'
                              }`}
                            >
                              {showtime.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button className="bg-netflix-medium-gray text-netflix-white p-2 rounded hover:bg-netflix-light-gray transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(showtime.id)}
                          className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </NetflixCard>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
