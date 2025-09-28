'use client';

import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { NetflixCard } from '@/components/ui/glass-card';
import { Clock, Film, Play } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Use the Movie type from the cached data
import { type Movie } from '@/lib/data/movies-with-use-cache';

interface MovieCardProps {
  movie: Movie;
  index: number;
  showPlayButton?: boolean;
  showShowtimes?: boolean;
  showDetails?: boolean;
  showStats?: boolean;
  showDetailsOnMobile?: boolean;
  priority?: boolean;
}

export function MovieCard({
  movie,
  index,
  showPlayButton = false,
  showShowtimes = false,
  showDetails = false,
  showStats = true,
  showDetailsOnMobile = false,
  priority = false,
}: MovieCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleCardClick = () => {
    if (isMobile) {
      setIsDrawerOpen(true);
    } else {
      router.push(`/movies/${movie.slug}`);
    }
  };

  const handlePlayMovie = () => {
    setIsDrawerOpen(false);
    router.push(`/movies/${movie.slug}/watch`);
  };

  const handleViewDetails = () => {
    setIsDrawerOpen(false);
    router.push(`/movies/${movie.slug}`);
  };

  return (
    <>
      <div onClick={handleCardClick} className="cursor-pointer">
        <NetflixCard className="overflow-hidden group relative h-full">
          <div className="relative aspect-[2/3] overflow-hidden h-full">
            <Image
              src={movie.posterUrl || '/placeholder-movie.jpg'}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              priority={priority || index < 3}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" />

            {/* Play button - show on mobile, show on hover for desktop */}
            {showPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-20">
                <Button
                  variant={'ghost'}
                  className="rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/movies/${movie.slug}/watch`);
                  }}
                >
                  <Play className="w-12 h-12" fill="currentColor" />
                </Button>
              </div>
            )}

            {/* Rating badge - always visible */}
            <div className="absolute top-3 right-3">
              <CircularProgress
                value={Number(movie.rating) * 10}
                size={44}
                strokeWidth={3}
                variant="premium"
                className="border-2 border-white/30 shadow-lg"
                valueClassName="text-xs font-extrabold drop-shadow-lg"
              />
            </div>

            {/* Movie Info - show on mobile, show on hover for desktop */}
            <div
              className={`absolute bottom-0 z-10 left-0 right-0 p-4 ${showDetails ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100' : 'opacity-100'} transition-all duration-300 transform translate-y-2 group-hover:translate-y-0`}
            >
              <h3 className="text-white font-bold text-xs md:text-sm mb-2 drop-shadow-lg">
                {movie.title}
              </h3>

              {showStats && (
                <div className="flex items-center space-x-3 text-sm text-white/90 mb-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{movie.duration}</span>
                  </div>
                  {movie.releaseDate && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      {new Date(movie.releaseDate).getFullYear()}
                    </span>
                  )}
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">{movie.genre}</span>
                </div>
              )}
            </div>
          </div>
        </NetflixCard>
      </div>

      {/* Movie Info Drawer - Mobile Only */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-black/95 backdrop-blur-xl border-t border-white/10 max-h-[80vh]">
          <div className="px-6 py-6 space-y-6">
            {/* Poster and basic info */}
            <div className="flex space-x-4">
              <div className="w-24 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-white/10 shadow-2xl">
                {movie.posterUrl && (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    width={96}
                    height={144}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-white font-bold text-xl leading-tight">{movie.title}</h3>
                <div className="flex items-center space-x-3 text-sm text-white/70">
                  <span className="bg-white/10 px-2 py-1 rounded-full">{movie.releaseDate}</span>
                  {movie.rating && (
                    <div className="flex items-center justify-center">
                      <CircularProgress
                        value={Number(movie.rating) * 10}
                        size={32}
                        strokeWidth={2}
                        variant="premium"
                        className="border border-white/20"
                        valueClassName="text-[10px] font-bold"
                      />
                    </div>
                  )}
                </div>
                <p className="text-white/50 text-sm">{movie.director}</p>

                {/* Genres */}
                {movie.genre && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(movie.genre) ? (
                      (movie.genre as string[]).slice(0, 2).map((genre: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-white/10 text-netflix-white text-xs px-3 py-1 rounded-full font-medium"
                        >
                          {genre}
                        </span>
                      ))
                    ) : (
                      <span className="bg-netflix-red/20 text-netflix-red text-xs px-3 py-1 rounded-full font-medium">
                        {movie.genre as string}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-white/80 text-sm leading-relaxed">{movie.description}</p>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-2">
              <Button
                onClick={handlePlayMovie}
                className="flex-1 bg-netflix-dark-red text-white font-semibold py-3 rounded-xl shadow-lg"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Play Movie
              </Button>
              <Button
                onClick={() => {
                  setIsDrawerOpen(false);
                  // For now, just close drawer. Trailer functionality can be added later
                  console.log('Play trailer for:', movie.title);
                }}
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10 py-3 rounded-xl"
              >
                <Film className="w-5 h-5 mr-2" />
                Trailer
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
