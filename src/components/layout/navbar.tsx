'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { SearchBar } from '@/components/ui/searchbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CachedUserProfile } from '@/components/auth/cached-user-profile';
import { useAuth } from '@/lib/hooks/use-auth';
import { signOut } from '@/lib/auth-client';
import {
  Film,
  Calendar,
  Search,
  X,
  Ticket,
  Shield,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import { useSubscription } from '@/lib/hooks/use-subscription';
import { Badge } from '../ui/badge';
import { UpgradeModal } from '../modals/upgrade-modal';

// Import movie types and context
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
  slug?: string;
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { subscription, error } = useSubscription();
  console.log(subscription);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Fetch movies for search
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('/api/movies');
        if (response.ok) {
          const data = await response.json();
          console.log('[Navbar] Raw API response:', data);
          console.log('[Navbar] Response type:', Array.isArray(data) ? 'array' : typeof data);

          // API returns movies array directly, not wrapped in {movies: []}
          const movies = Array.isArray(data) ? data : (data.movies || []);
          console.log('[Navbar] Fetched movies for search:', movies.length, 'movies');
          console.log('[Navbar] Sample movie:', movies[0]);
          setAllMovies(movies);
        } else {
          console.error('[Navbar] Failed to fetch movies:', response.status);
        }
      } catch (error) {
        console.error('[Navbar] Failed to fetch movies for search:', error);
      }
    };

    fetchMovies();
  }, []);

  // Handle search with live updates and debouncing (like movie filter bar)
  const handleSearch = useMemo(() => {
    let debounceTimer: NodeJS.Timeout;

    return (query: string) => {
      setSearchQuery(query);

      // Clear previous debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      if (!query.trim()) {
        setSearchResults([]);
        setIsSearchingMovies(false);
        return;
      }

      // Set searching state immediately for better UX
      setIsSearchingMovies(true);

      // Debounce the actual search (like professional search implementations)
      debounceTimer = setTimeout(() => {
        console.log('[Navbar] Searching for:', query);
        console.log('[Navbar] Available movies:', allMovies.length);

        // Simple search implementation - only include movies with slugs
        const filtered = allMovies
          .filter((movie) => {
            const hasSlug = movie.slug;
            const queryLower = query.toLowerCase();

            const matchesSearch =
              (movie.title?.toLowerCase() || '').includes(queryLower) ||
              (movie.description?.toLowerCase() || '').includes(queryLower) ||
              (movie.director?.toLowerCase() || '').includes(queryLower) ||
              (movie.cast && Array.isArray(movie.cast) && movie.cast.some(actor =>
                actor && typeof actor === 'string' && actor.toLowerCase().includes(queryLower)
              )) ||
              (movie.genre && Array.isArray(movie.genre) && movie.genre.some(g =>
                g && typeof g === 'string' && g.toLowerCase().includes(queryLower)
              ));

            console.log('[Navbar] Movie:', movie.title, 'hasSlug:', hasSlug, 'matches:', matchesSearch);
            return hasSlug && matchesSearch;
          })
          .slice(0, 8); // Limit to 8 results

        console.log('[Navbar] Filtered results:', filtered.length, 'movies');
        setSearchResults(filtered);
        setIsSearchingMovies(false);
      }, 150); // 150ms debounce delay for smooth experience
    };
  }, [allMovies]);

  // Handle search result click
  const handleMovieClick = (movie: Movie) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/movies/${movie.slug}`); // Now safe since we only show movies with slugs
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search on route change
  const pathname = usePathname();
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  const navLinks = [{ name: 'Movies', href: '/movies', icon: Film }];

  return (
    <>
      {/* Main Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl shadow-2xl`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="flex items-center">
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
                  className="flex items-center space-x-2 text-white/80 hover:text-white font-medium group relative py-2"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {!subscription && isAuthenticated ? (
                <div>
                  <Button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    variant={'premium'}
                    size={'sm'}
                  >
                    Upgrade
                  </Button>
                  <UpgradeModal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />
                </div>
              ) : (
                isAuthenticated && (
                  <Badge variant={'premium'}>
                    {subscription?.recurringInterval === 'year' ? 'Cinemx+' : 'Cinemx+'}
                  </Badge>
                )
              )}
              <Button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                variant={'glass'}
                size={'icon'}
              >
                <Search className="w-5 h-5" />
              </Button>

              <CachedUserProfile />

              {/* Mobile Menu Button - REMOVED */}
            </div>
          </div>
        </div>

        {/* Search Bar Overlay */}
        {isSearchOpen && (
          <div className="border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative max-w-2xl mx-auto">
                <div className="flex items-center">
                  <SearchBar
                    placeholder="Search movies..."
                    autoFocus
                    className="flex-1"
                    value={searchQuery}
                    onChange={handleSearch}
                    onClear={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  />
                  <Button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    variant={'glass'}
                    size={'icon'}
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="mt-4 max-h-96 overflow-y-auto">
                    {isSearchingMovies ? (
                      <div className="text-center py-8 text-white/60">
                        <div className="w-6 h-6 border-2 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((movie) => (
                          <div
                            key={movie.id}
                            onClick={() => handleMovieClick(movie)}
                            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                          >
                            <div className="w-12 h-16 bg-white/10 rounded flex-shrink-0 overflow-hidden">
                              {movie.posterUrl && (
                                <Image
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  width={48}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm truncate">{movie.title}</h4>
                              <p className="text-white/60 text-xs truncate">{movie.director} • {movie.releaseDate}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {movie.rating && (
                                  <span className="text-yellow-400 text-xs">★ {movie.rating}</span>
                                )}
                                <span className="text-white/40 text-xs">
                                  {Array.isArray(movie.genre)
                                    ? movie.genre.slice(0, 2).join(', ')
                                    : typeof movie.genre === 'string' && movie.genre
                                      ? (movie.genre as string).split(', ').slice(0, 2).join(', ')
                                      : 'Unknown'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length > 2 ? (
                      <div className="text-center py-8 text-white/60">
                        No movies found for "{searchQuery}"
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu using Sheet Component - REMOVED */}

      {/* Spacer */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
