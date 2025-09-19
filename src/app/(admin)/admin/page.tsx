'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Ticket,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  PlayCircle,
} from 'lucide-react';
import { AddMovieModal, MovieFormData } from '@/components/admin/add-movie-modal';

export default function AdminDashboard() {
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);

  const stats = [
    {
      title: 'Total Movies',
      value: '24',
      change: '+3 this week',
      changeType: 'positive',
      icon: Film,
      trend: 'up',
    },
    {
      title: 'Active Showtimes',
      value: '48',
      change: '+12 today',
      changeType: 'positive',
      icon: Calendar,
      trend: 'up',
    },
    {
      title: 'Total Users',
      value: '1,247',
      change: '+89 this month',
      changeType: 'positive',
      icon: Users,
      trend: 'up',
    },
    {
      title: 'Revenue',
      value: '$12,847',
      change: '+24% this month',
      changeType: 'positive',
      icon: DollarSign,
      trend: 'up',
    },
  ];

  const recentBookings = [
    {
      id: 'BK001',
      movie: 'Quantum Nexus',
      user: 'John Doe',
      seats: 2,
      amount: '$28.00',
      time: '2 mins ago',
      status: 'confirmed',
    },
    {
      id: 'BK002',
      movie: 'Neon Dreams',
      user: 'Sarah Johnson',
      seats: 1,
      amount: '$14.00',
      time: '5 mins ago',
      status: 'confirmed',
    },
    {
      id: 'BK003',
      movie: 'Stellar Odyssey',
      user: 'Mike Chen',
      seats: 4,
      amount: '$56.00',
      time: '8 mins ago',
      status: 'pending',
    },
    {
      id: 'BK004',
      movie: 'Dark Protocol',
      user: 'Emma Wilson',
      seats: 2,
      amount: '$28.00',
      time: '12 mins ago',
      status: 'confirmed',
    },
  ];

  const performanceMetrics = [
    {
      label: "Today's Bookings",
      value: '156',
      icon: TrendingUp,
      change: '+12%',
    },
    {
      label: 'Avg. Session Time',
      value: '2:34',
      icon: Clock,
      change: '+8%',
    },
    {
      label: 'Customer Rating',
      value: '4.8',
      icon: Star,
      change: '+0.2',
    },
    {
      label: 'Active Viewers',
      value: '89',
      icon: Eye,
      change: '+15%',
    },
  ];

  const handleAddMovie = async (movieData: MovieFormData) => {
    try {
      const response = await fetch('/api/admin/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      if (!response.ok) {
        throw new Error('Failed to add movie');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding movie:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white"
        >
          Welcome back, Admin
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-lg"
        >
          Here's what's happening at CinemaX today
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className="group"
          >
            <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-netflix-red/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-black/50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-netflix-red/20 transition-colors duration-300">
                  <stat.icon className="w-6 h-6 text-white group-hover:text-netflix-red transition-colors" />
                </div>
                <div className="flex items-center space-x-1">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4 text-netflix-red" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-netflix-red" />
                  )}
                </div>
              </div>

              <div>
                <p className="text-white/60 text-sm mb-2">{stat.title}</p>
                <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-netflix-red text-sm font-medium">{stat.change}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-netflix-red" />
                </div>
                <h2 className="text-2xl font-bold text-white">Recent Bookings</h2>
              </div>
              <button className="group flex items-center space-x-2 text-netflix-red hover:text-white transition-colors">
                <span className="text-sm font-medium">View All</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              {recentBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-netflix-red/30 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-netflix-red/20 rounded-lg flex items-center justify-center group-hover:bg-netflix-red/30 transition-colors">
                      <PlayCircle className="w-5 h-5 text-netflix-red" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{booking.movie}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-white/60 text-sm">{booking.user}</span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60 text-sm">{booking.seats} seats</span>
                        <span className="text-white/40">•</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-netflix-red/20 text-netflix-red border border-netflix-red/30'
                              : 'bg-white/10 text-white/60 border border-white/20'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">{booking.amount}</p>
                    <p className="text-white/40 text-sm">{booking.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Performance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-netflix-red" />
              </div>
              <h3 className="text-xl font-bold text-white">Performance</h3>
            </div>

            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                      <metric.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/60 text-sm">{metric.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{metric.value}</div>
                    <div className="text-netflix-red text-xs font-medium">{metric.change}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-netflix-red" />
              </div>
              <h3 className="text-xl font-bold text-white">Quick Actions</h3>
            </div>

            <div className="space-y-3">
              <motion.button
                onClick={() => setIsAddMovieModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-netflix-red hover:bg-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-netflix-red/25"
              >
                <Film className="w-5 h-5" />
                <span>Add New Movie</span>
              </motion.button>

              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3">
                <Calendar className="w-5 h-5" />
                <span>Create Showtime</span>
              </button>

              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3">
                <Eye className="w-5 h-5" />
                <span>View All Bookings</span>
              </button>
            </div>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">Live Now</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Active Sessions</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
                  <span className="text-white font-bold">42</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Queue Length</span>
                <span className="text-white font-bold">7</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Server Load</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-netflix-red rounded-full" />
                  </div>
                  <span className="text-white font-bold text-sm">75%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Movie Modal */}
      <AnimatePresence>
        {isAddMovieModalOpen && (
          <AddMovieModal
            isOpen={isAddMovieModalOpen}
            onClose={() => setIsAddMovieModalOpen(false)}
            onAddMovie={handleAddMovie}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
