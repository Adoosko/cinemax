'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { User, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/lib/auth-client';

interface CachedUserProfileProps {
  className?: string;
  onMenuToggle?: (isOpen: boolean) => void;
}

export function CachedUserProfile({ className, onMenuToggle }: CachedUserProfileProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Cache user data in localStorage for faster initial render
  useEffect(() => {
    if (user && !isLoading) {
      // Store minimal user data (no sensitive info)
      localStorage.setItem(
        'cachedUserProfile',
        JSON.stringify({
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          lastUpdated: new Date().toISOString(),
        })
      );
    }
  }, [user, isLoading]);

  // Toggle user menu and notify parent if callback provided
  const toggleUserMenu = () => {
    const newState = !isUserMenuOpen;
    setIsUserMenuOpen(newState);
    if (onMenuToggle) {
      onMenuToggle(newState);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    // Clear cached user data
    localStorage.removeItem('cachedUserProfile');
    await signOut();
  };

  if (isLoading) {
    return <div className="w-20 sm:w-32 h-8 bg-white/10 animate-pulse rounded-lg"></div>;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/signin"
        className={`bg-netflix-red hover:bg-netflix-red-dark text-white px-4 py-2 rounded-md transition-colors ${className || ''}`}
      >
        Sign In
      </Link>
    );
  }

  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const userRole = user?.role === 'admin' ? 'Admin' : 'Member';

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={toggleUserMenu}
        className="flex items-center space-x-3 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 group"
      >
        <div className="text-right hidden sm:block">
          <p className="text-white text-sm font-medium">{userName}</p>
          <p className="text-white/60 text-xs">{userRole}</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center shadow-lg">
            {user?.image ? (
              <img
                src={user.image}
                alt={userName}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div
            className={`transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : 'rotate-0'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* User Menu Dropdown */}
      {isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-netflix-medium-gray rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <p className="text-white font-medium">{user?.name || user?.email}</p>
            <p className="text-white/60 text-xs">{user?.email}</p>
          </div>

          <div className="p-2">
            <Link
              href="/profile"
              className="flex items-center space-x-3 p-3 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center space-x-3 p-3 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center space-x-3 p-3 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Admin Panel</span>
              </Link>
            )}
          </div>

          <div className="border-t border-white/10 p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-3 p-3 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
