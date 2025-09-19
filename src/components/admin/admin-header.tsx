'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  LogOut,
  Home,
  User,
  Settings,
  Activity,
  ChevronDown,
  X,
  Film,
} from 'lucide-react';

interface AdminHeaderProps {
  user: {
    name?: string;
    email: string;
    role: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const notifications = [
    { id: 1, type: 'booking', message: 'New booking for Quantum Nexus', time: '2 min ago' },
    { id: 2, type: 'movie', message: 'Movie upload completed', time: '5 min ago' },
    { id: 3, type: 'user', message: '3 new user registrations', time: '10 min ago' },
  ];

  const quickSearchResults = [
    { type: 'movie', title: 'Quantum Nexus', subtitle: 'Movie' },
    { type: 'user', title: 'John Doe', subtitle: 'User' },
    { type: 'booking', title: 'Booking #12345', subtitle: 'Recent Booking' },
  ];

  return (
    <motion.header
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 z-50"
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Title */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-netflix-red rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-netflix-red text-xl font-bold tracking-tight">CINEMX</span>
          </Link>

          <div className="h-6 w-px bg-white/20" />

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
              <Settings className="w-3 h-3 text-white/60" />
            </div>
            <h1 className="text-white font-semibold">Admin Dashboard</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8 relative">
          <div
            className={`relative transition-all duration-300 ${
              isSearchFocused ? 'scale-105' : 'scale-100'
            }`}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search movies, users, bookings..."
              className="w-full bg-white/5 backdrop-blur-sm text-white placeholder-white/40 pl-12 pr-4 py-3 border border-white/10 rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all duration-200"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {isSearchFocused && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-3">
                  <div className="text-white/60 text-xs font-medium mb-3 flex items-center space-x-2">
                    <Search className="w-3 h-3" />
                    <span>Quick Results</span>
                  </div>

                  {quickSearchResults.map((result, index) => (
                    <motion.div
                      key={result.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center group-hover:bg-netflix-red/30 transition-colors">
                        {result.type === 'movie' && <Film className="w-4 h-4 text-netflix-red" />}
                        {result.type === 'user' && <User className="w-4 h-4 text-netflix-red" />}
                        {result.type === 'booking' && (
                          <Activity className="w-4 h-4 text-netflix-red" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium group-hover:text-netflix-red transition-colors">
                          {result.title}
                        </div>
                        <div className="text-white/60 text-xs">{result.subtitle}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-3 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <Bell className="w-5 h-5" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-netflix-red rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs font-bold">{notifications.length}</span>
              </motion.div>
            </motion.button>

            {/* Notifications Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Notifications</h3>
                  <div className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{notifications.length}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="w-2 h-2 bg-netflix-red rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white text-sm group-hover:text-netflix-red transition-colors">
                          {notification.message}
                        </p>
                        <p className="text-white/60 text-xs mt-1">{notification.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <button className="w-full text-netflix-red hover:text-white text-sm font-medium transition-colors">
                    View All Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-semibold">
                  {user.name || user.email.split('@')[0]}
                </p>
                <p className="text-white/60 text-xs">{user.role} Admin</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                </motion.div>
              </div>
            </motion.button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  <div className="p-2">
                    {/* User Info */}
                    <div className="p-4 border-b border-white/10 mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {user.name || user.email.split('@')[0]}
                          </p>
                          <p className="text-white/60 text-sm">{user.email}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 bg-netflix-red rounded-full" />
                            <span className="text-netflix-red text-xs font-medium">
                              {user.role} Admin
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <Link
                        href="/admin/profile"
                        className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3 group-hover:text-netflix-red transition-colors" />
                        <span>Profile Settings</span>
                      </Link>

                      <Link
                        href="/admin/settings"
                        className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3 group-hover:text-netflix-red transition-colors" />
                        <span>Admin Settings</span>
                      </Link>

                      <Link
                        href="/"
                        className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Home className="w-4 h-4 mr-3 group-hover:text-netflix-red transition-colors" />
                        <span>Back to Site</span>
                      </Link>

                      <div className="border-t border-white/10 my-2" />

                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-white/60 hover:text-netflix-red hover:bg-netflix-red/10 rounded-lg transition-all duration-200 group"
                      >
                        <LogOut className="w-4 h-4 mr-3 group-hover:text-netflix-red transition-colors" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Click outside to close */}
            {isUserMenuOpen && (
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsUserMenuOpen(false)} />
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
