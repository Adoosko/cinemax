'use client';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { SearchBar } from '@/components/ui/searchbar';
import { cn } from '@/lib/utils';
import { Play, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

interface DockItem {
  name: string;
  href: string;
  icon: string | React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isSearch?: boolean;
}

export function FloatingDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMovieDrawerOpen, setIsMovieDrawerOpen] = useState(false);

  // Fetch movies for search
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('/api/movies');
        if (response.ok) {
          const data = await response.json();
          const movies = Array.isArray(data) ? data : data.movies || [];
          setAllMovies(movies);
        }
      } catch (error) {
        console.error('[FloatingDock] Failed to fetch movies for search:', error);
      }
    };

    fetchMovies();
  }, []);

  // Handle search with debouncing
  const handleSearch = useMemo(() => {
    let debounceTimer: NodeJS.Timeout;

    return (query: string) => {
      setSearchQuery(query);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      if (!query.trim()) {
        setSearchResults([]);
        setIsSearchingMovies(false);
        return;
      }

      setIsSearchingMovies(true);

      debounceTimer = setTimeout(() => {
        const filtered = allMovies
          .filter((movie) => {
            const hasSlug = movie.slug;
            const queryLower = query.toLowerCase();

            const matchesSearch =
              (movie.title?.toLowerCase() || '').includes(queryLower) ||
              (movie.description?.toLowerCase() || '').includes(queryLower) ||
              (movie.director?.toLowerCase() || '').includes(queryLower) ||
              (movie.cast &&
                Array.isArray(movie.cast) &&
                movie.cast.some(
                  (actor) =>
                    actor && typeof actor === 'string' && actor.toLowerCase().includes(queryLower)
                )) ||
              (movie.genre &&
                Array.isArray(movie.genre) &&
                movie.genre.some(
                  (g) => g && typeof g === 'string' && g.toLowerCase().includes(queryLower)
                ));

            return hasSlug && matchesSearch;
          })
          .slice(0, 8);

        setSearchResults(filtered);
        setIsSearchingMovies(false);
      }, 150);
    };
  }, [allMovies]);

  // Handle search result click
  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsMovieDrawerOpen(true);
    // Close search modal when opening movie drawer
    setIsSearchOpen(false);
  };

  // Handle play movie
  const handlePlayMovie = (movie: Movie) => {
    setIsMovieDrawerOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/movies/${movie.slug}/watch`);
  };

  // Handle view movie details
  const handleViewDetails = (movie: Movie) => {
    setIsMovieDrawerOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/movies/${movie.slug}`);
  };

  // Close search on route change
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSearchOpen]);

  const dockItems: Omit<DockItem, 'isActive'>[] = [
    { name: 'Movies', href: '/movies', icon: '/movies.png' },
    { name: 'Series', href: '/series', icon: '/series.png' },
    { name: 'Search', href: '#', icon: '/search.png', isSearch: true },
  ];

  const itemsWithActive = dockItems.map((item) => ({
    ...item,
    isActive:
      !item.isSearch &&
      (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))),
  }));

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Safe area padding for devices with home indicators */}
        <div className="pb-safe-area-inset-bottom">
          <div className="mx-4 mb-4">
            <div className="flex items-center justify-around bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
              {itemsWithActive.map((item) =>
                item.isSearch ? (
                  <Button
                    key={item.name}
                    onClick={handleSearchClick}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'w-14 h-14 rounded-xl transition-all duration-200',
                      isSearchOpen
                        ? 'bg-netflix-dark-red/80 backdrop-blur-md border border-netflix-dark-red/30 text-white shadow-lg scale-110'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    )}
                    aria-label={item.name}
                  >
                    {typeof item.icon === 'string' ? (
                      <Image
                        src={item.icon}
                        alt={item.name}
                        width={28}
                        height={28}
                        className="w-7 h-7"
                      />
                    ) : (
                      <item.icon className="w-7 h-7" />
                    )}
                  </Button>
                ) : (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'w-14 h-14 rounded-xl transition-all duration-200',
                        item.isActive
                          ? 'bg-netflix-dark-red backdrop-blur-md border border-netflix-dark-red/30 text-white shadow-lg '
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )}
                      aria-label={item.name}
                    >
                      {typeof item.icon === 'string' ? (
                        <Image
                          src={item.icon}
                          alt={item.name}
                          width={28}
                          height={28}
                          className="w-10 h-10"
                        />
                      ) : (
                        <item.icon className="w-10 h-10" />
                      )}
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] md:hidden bg-black/50 backdrop-blur-sm">
          <div className="fixed bottom-24 left-4 right-4 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl max-h-[70vh] overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Search Movies</h2>
                <Button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="relative">
                <SearchBar
                  placeholder="Search movies..."
                  autoFocus
                  value={searchQuery}
                  onChange={handleSearch}
                  onClear={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                />

                {/* Search Results */}
                {searchQuery && (
                  <div className="mt-4 max-h-80 overflow-y-auto">
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
                              <h4 className="text-white font-medium text-sm truncate">
                                {movie.title}
                              </h4>
                              <p className="text-white/60 text-xs truncate">
                                {movie.director} • {movie.releaseDate}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {movie.rating && (
                                  <span className="text-white text-xs">
                                    ★ {Number(movie.rating).toFixed(1)} (
                                    {movie.releaseDate
                                      ? new Date(movie.releaseDate).getFullYear()
                                      : 'N/A'}
                                    )
                                  </span>
                                )}
                                <span className="text-white/40 text-xs">
                                  {Array.isArray(movie.genre)
                                    ? movie.genre.slice(0, 2).join(', ')
                                    : typeof movie.genre === 'string' && movie.genre
                                      ? (movie.genre as string).split(', ').slice(0, 2).join(', ')
                                      : 'Unknown'}
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
        </div>
      )}

      {/* Movie Info Drawer */}
      <Drawer open={isMovieDrawerOpen} onOpenChange={setIsMovieDrawerOpen}>
        <DrawerContent className="bg-black/95 backdrop-blur-xl border-t border-white/10">
          <DrawerHeader>
            <DrawerTitle className="text-white text-lg">Movie Details</DrawerTitle>
          </DrawerHeader>

          {selectedMovie && (
            <div className="px-4 pb-4 space-y-4">
              {/* Poster and basic info */}
              <div className="flex space-x-4">
                <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
                  {selectedMovie.posterUrl && (
                    <Image
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      width={80}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg leading-tight mb-1">
                    {selectedMovie.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-white/60 mb-2">
                    <span>{selectedMovie.releaseDate}</span>
                    {selectedMovie.rating && (
                      <>
                        <span>•</span>
                        <span className="text-white">
                          ★ {Number(selectedMovie.rating).toFixed(1)} (
                          {selectedMovie.releaseDate
                            ? new Date(selectedMovie.releaseDate).getFullYear()
                            : 'N/A'}
                          )
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-white/40 text-xs line-clamp-2">{selectedMovie.director}</p>
                </div>
              </div>

              {/* Genres */}
              {selectedMovie.genre && selectedMovie.genre.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedMovie.genre.slice(0, 3).map((genre, idx) => (
                    <span
                      key={idx}
                      className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                {selectedMovie.description}
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={() => handlePlayMovie(selectedMovie)}
                  className="flex-1 bg-netflix-red hover:bg-red-700 text-white font-semibold"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Play
                </Button>
                <Button
                  onClick={() => handleViewDetails(selectedMovie)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Details
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
