'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/auth-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  Menu,
  X,
  Film,
  Calendar,
  User,
  Search,
  Bell,
  Ticket,
  Home,
  Settings,
  ChevronDown,
  Shield,
  Play,
  Star,
} from 'lucide-react';
import Image from 'next/image';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsSearchOpen(false);
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navLinks = [
    { name: 'Movies', href: '/movies', icon: Film },
    { name: 'Showtimes', href: '/showtimes', icon: Calendar },
    { name: 'My Bookings', href: '/bookings', icon: Ticket },
  ];

  const notifications = [
    { id: 1, message: 'Your booking for Quantum Nexus is confirmed', time: '2 min ago' },
    { id: 2, message: 'New movie added: Digital Uprising', time: '1 hour ago' },
    { id: 3, message: 'Special offer: 20% off weekend bookings', time: '2 hours ago' },
  ];

  return (
    <>
      {/* Main Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-black/95 backdrop-blur-xl shadow-2xl'
            : 'bg-gradient-to-b from-black/90 to-transparent'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center z-50 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center ">
                <Image src="/logo.png" alt="Logo" width={50} height={50} />

                <Image className="pt-1" src="/text-logo.png" alt="Logo" width={100} height={80} />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-all duration-200 font-medium group relative py-2"
                >
                  <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>{link.name}</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-netflix-red group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Toggle */}
              <motion.button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {isLoading ? (
                <div className="w-20 sm:w-32 h-8 bg-white/10 animate-pulse rounded-lg"></div>
              ) : isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="hidden sm:block relative group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-netflix-red rounded-full flex items-center justify-center"
                        >
                          <span className="text-white text-xs font-bold">
                            {notifications.length}
                          </span>
                        </motion.div>
                      )}
                    </motion.button>

                    {/* Notifications Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-semibold">Notifications</h3>
                          <div className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {notifications.length}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {notifications.map((notification, index) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                            >
                              <div className="w-2 h-2 bg-netflix-red rounded-full mt-2 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-white text-sm">{notification.message}</p>
                                <p className="text-white/60 text-xs mt-1">{notification.time}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop User Menu */}
                  <div className="hidden lg:block relative">
                    <motion.button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 group"
                    >
                      <div className="text-right hidden sm:block">
                        <p className="text-white text-sm font-medium">
                          {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-white/60 text-xs">
                          {user?.role === 'admin' ? 'Admin' : 'Member'}
                        </p>
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

                    {/* Desktop User Dropdown */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
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
                                    {user?.name || user?.email?.split('@')[0] || 'User'}
                                  </p>
                                  <p className="text-white/60 text-sm">{user?.email}</p>
                                  <div className="flex items-center space-x-1 mt-1">
                                    <div className="w-2 h-2 bg-netflix-red rounded-full" />
                                    <span className="text-netflix-red text-xs font-medium">
                                      {user?.role === 'admin' ? 'Admin Account' : 'Member'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Menu Items */}
                            <div className="space-y-1">
                              <Link
                                href="/profile"
                                className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Settings className="w-4 h-4 mr-3 group-hover:text-netflix-red transition-colors" />
                                <span>Profile & Settings</span>
                              </Link>

                              <Link
                                href="/bookings"
                                className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Ticket className="w-4 h-4 mr-3 group-hover:text-netflix-red transition-colors" />
                                <span>My Bookings</span>
                              </Link>

                              {user?.role === 'admin' && (
                                <Link
                                  href="/admin"
                                  className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  <Shield className="w-4 h-4 mr-3 group-hover:text-netflix-red transition-colors" />
                                  <span>Admin Dashboard</span>
                                </Link>
                              )}

                              <div className="border-t border-white/10 my-2" />

                              <button
                                onClick={handleSignOut}
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
                      <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                    )}
                  </div>

                  {/* Mobile User Icon */}
                  <div className="lg:hidden">
                    <div className="w-10 h-10 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </>
              ) : (
                <Link href="/signin">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-netflix-red hover:bg-red-700 text-white px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-200 rounded-xl shadow-lg hover:shadow-netflix-red/25"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="lg:hidden p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all z-50 relative"
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Search Bar Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 bg-black/95 backdrop-blur-xl"
            >
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search movies, showtimes, theaters..."
                    className="w-full bg-white/10 text-white placeholder-white/40 pl-12 pr-12 py-4 rounded-xl border border-white/20 focus:border-netflix-red focus:outline-none focus:bg-white/20 transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 lg:hidden overflow-y-auto"
            >
              <div className="pt-20 pb-6">
                {/* User Section - Mobile */}
                {isAuthenticated && (
                  <div className="px-6 pb-6 border-b border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {user?.name || user?.email?.split('@')[0] || 'User'}
                        </div>
                        <div className="text-sm text-white/60">{user?.email}</div>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-2 h-2 bg-netflix-red rounded-full" />
                          <span className="text-xs text-netflix-red font-medium">
                            {user?.role === 'admin' ? 'Admin Account' : 'Member'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="px-6 py-6 space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-4 text-white hover:text-netflix-red hover:bg-white/10 transition-all duration-200 py-4 px-4 -mx-4 rounded-xl group"
                      >
                        <link.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-lg font-medium">{link.name}</span>
                      </Link>
                    </motion.div>
                  ))}

                  {/* Search - Mobile */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navLinks.length * 0.1 }}
                  >
                    <button
                      onClick={() => {
                        setIsSearchOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-4 text-white hover:text-netflix-red hover:bg-white/10 transition-all duration-200 py-4 px-4 -mx-4 w-full rounded-xl group"
                    >
                      <Search className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-lg font-medium">Search</span>
                    </button>
                  </motion.div>
                </div>

                {/* User Actions - Mobile */}
                {isAuthenticated && (
                  <div className="px-6 pt-6 border-t border-white/10 space-y-2">
                    {/* Notifications */}
                    <button className="flex items-center space-x-4 text-white hover:text-netflix-red hover:bg-white/10 transition-all duration-200 py-4 px-4 -mx-4 w-full rounded-xl group">
                      <div className="relative">
                        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                        {notifications.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-netflix-red rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {notifications.length}
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-medium">Notifications</span>
                    </button>

                    {/* Profile */}
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-4 text-white hover:text-netflix-red hover:bg-white/10 transition-all duration-200 py-4 px-4 -mx-4 rounded-xl group"
                    >
                      <Settings className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-lg font-medium">Profile & Settings</span>
                    </Link>

                    {/* Admin Link - Mobile */}
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-4 text-white hover:text-netflix-red hover:bg-white/10 transition-all duration-200 py-4 px-4 -mx-4 rounded-xl group"
                      >
                        <Shield className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-lg font-medium">Admin Dashboard</span>
                      </Link>
                    )}

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-4 text-netflix-red hover:text-red-400 hover:bg-netflix-red/10 transition-all duration-200 py-4 px-4 -mx-4 w-full rounded-xl group"
                    >
                      <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-lg font-medium">Sign Out</span>
                    </button>
                  </div>
                )}

                {/* Sign In - Mobile (if not authenticated) */}
                {!isAuthenticated && (
                  <div className="px-6 pt-6 border-t border-white/10">
                    <Link href="/signin" onClick={() => setIsMenuOpen(false)}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-netflix-red hover:bg-red-700 text-white py-4 text-lg font-semibold transition-all duration-200 rounded-xl shadow-lg"
                      >
                        Sign In to CinemaX
                      </motion.button>
                    </Link>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 pt-8 pb-6">
                  <div className="text-center text-white/40 text-sm">
                    <p>© 2024 CinemaX</p>
                    <p className="mt-1">Premium Movie Experience</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
