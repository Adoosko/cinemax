'use client';

import { Button } from '@/components/ui/button';
import { NetflixCard } from '@/components/ui/glass-card';
import { Clock, Play, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  return (
    <Link href={`/movies/${movie.slug}`}>
      <div className="cursor-pointer">
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
                <Link href={`/movies/${movie.slug}/watch`}>
                  <Button variant={'ghost'} className="rounded-full">
                    <Play className="w-12 h-12" fill="currentColor" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Rating badge - always visible */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-white text-xs font-medium">{movie.rating}</span>
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
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">{movie.genre}</span>
                </div>
              )}
            </div>
          </div>
        </NetflixCard>
      </div>
    </Link>
  );
}
