'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Star,
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Trash2,
} from 'lucide-react';

interface Booking {
  id: string;
  movieTitle: string;
  moviePoster: string;
  theater: string;
  date: string;
  time: string;
  seats: string[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  rating?: number;
}

// Mock bookings data
const mockBookings: Booking[] = [
  {
    id: 'BK001',
    movieTitle: 'Quantum Nexus',
    moviePoster:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
    theater: 'IMAX Theater 1',
    date: '2024-03-20',
    time: '7:30 PM',
    seats: ['H7', 'H8'],
    totalAmount: 44.0,
    status: 'confirmed',
    bookingDate: '2024-03-15',
  },
  {
    id: 'BK002',
    movieTitle: 'Stellar Journey',
    moviePoster:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop',
    theater: 'Premium Theater 2',
    date: '2024-03-18',
    time: '5:00 PM',
    seats: ['F5', 'F6', 'F7'],
    totalAmount: 54.0,
    status: 'completed',
    bookingDate: '2024-03-10',
    rating: 4.5,
  },
  {
    id: 'BK003',
    movieTitle: 'Future Wars',
    moviePoster:
      'https://images.unsplash.com/photo-1489599162406-d8e805b9b621?w=400&h=600&fit=crop',
    theater: 'Standard Theater 3',
    date: '2024-03-25',
    time: '9:15 PM',
    seats: ['D12', 'D13'],
    totalAmount: 32.0,
    status: 'confirmed',
    bookingDate: '2024-03-16',
  },
  {
    id: 'BK004',
    movieTitle: 'Digital Uprising',
    moviePoster:
      'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=600&fit=crop',
    theater: 'IMAX Theater 1',
    date: '2024-03-12',
    time: '8:00 PM',
    seats: ['J10'],
    totalAmount: 22.0,
    status: 'cancelled',
    bookingDate: '2024-03-08',
  },
];

export default function BookingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(mockBookings);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    let filtered = bookings;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.movieTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.theater.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort bookings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'booking-desc':
          return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
        case 'amount-desc':
          return b.totalAmount - a.totalAmount;
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-netflix-dark-gray border-b border-gray-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
              <p className="text-gray-400">Manage your movie tickets and reservations</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-netflix-red hover:bg-netflix-dark-red text-white px-6 py-2 rounded-lg font-medium transition-colors">
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-netflix-medium-gray text-white placeholder-gray-400 pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-netflix-red focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-netflix-medium-gray text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-netflix-red focus:outline-none appearance-none pr-10"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-netflix-medium-gray text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-netflix-red focus:outline-none appearance-none pr-10"
            >
              <option value="date-desc">Show Date (Newest)</option>
              <option value="date-asc">Show Date (Oldest)</option>
              <option value="booking-desc">Booking Date (Newest)</option>
              <option value="amount-desc">Amount (Highest)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-netflix-dark-gray p-4 rounded-lg">
            <div className="text-2xl font-bold text-white">{bookings.length}</div>
            <div className="text-gray-400 text-sm">Total Bookings</div>
          </div>
          <div className="bg-netflix-dark-gray p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </div>
            <div className="text-gray-400 text-sm">Confirmed</div>
          </div>
          <div className="bg-netflix-dark-gray p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {bookings.filter((b) => b.status === 'completed').length}
            </div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="bg-netflix-dark-gray p-4 rounded-lg">
            <div className="text-2xl font-bold text-white">
              ${bookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
            </div>
            <div className="text-gray-400 text-sm">Total Spent</div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : "You haven't made any bookings yet"}
              </p>
              <Link href="/movies">
                <button className="bg-netflix-red hover:bg-netflix-dark-red text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Browse Movies
                </button>
              </Link>
            </div>
          ) : (
            filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-netflix-dark-gray rounded-lg overflow-hidden hover:bg-netflix-medium-gray/50 transition-colors"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Movie Poster */}
                    <div className="flex-shrink-0">
                      <img
                        src={booking.moviePoster}
                        alt={booking.movieTitle}
                        className="w-20 h-28 object-cover rounded-lg"
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {booking.movieTitle}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>Booking ID: {booking.id}</span>
                            <span>•</span>
                            <span>Booked on {formatDate(booking.bookingDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>{booking.time}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.theater}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-gray-300">
                            <span className="text-gray-400">Seats:</span> {booking.seats.join(', ')}
                          </div>
                          <div className="text-white font-semibold">
                            ${booking.totalAmount.toFixed(2)}
                          </div>
                          {booking.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-gray-300">{booking.rating}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {booking.status === 'confirmed' && (
                            <>
                              <button className="text-gray-400 hover:text-white p-2 rounded transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-gray-400 hover:text-white p-2 rounded transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status === 'completed' && (
                            <button className="text-gray-400 hover:text-white p-2 rounded transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {booking.status === 'cancelled' && (
                            <button className="text-red-400 hover:text-red-300 p-2 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
