'use client';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import { NetflixCard } from '@/components/ui/glass-card';
import { ProgressiveImage } from '@/components/ui/progressive-image';
import { type Movie } from '@/lib/data/movies-with-use-cache';
import { Clock, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  showDetails = false,
  showStats = true,

  priority = false,
}: MovieCardProps) {
  const router = useRouter();

  // Card click: Navigate to movie detail page
  const handleCardClick = () => {
    router.push(`/movies/${movie.slug}`);
  };

  return (
    <div onClick={handleCardClick} className="cursor-pointer">
      <NetflixCard className="overflow-hidden group relative h-full">
        <div className="relative aspect-[2/3] overflow-hidden h-full">
          <ProgressiveImage
            src={movie.posterUrl || '/placeholder-movie.jpg'}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            priority={priority || index < 4} // Above the fold images
            fetchPriority={priority || index < 4 ? 'high' : 'auto'}
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />

          {/* Gradient overlay for hover effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play button (mobile always, desktop on hover) */}
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

          {/* Rating badge */}
          {movie.rating && (
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
          )}

          {/* Info overlay (visible on hover desktop, always on mobile) */}
          <div
            className={`absolute bottom-0 z-10 left-0 right-0 p-4 ${showDetails ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100' : 'opacity-100'} transition-all duration-300 transform translate-y-2 group-hover:translate-y-0`}
          >
            <h3 className="text-white font-bold text-xs md:text-sm mb-2 drop-shadow-lg truncate">
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
              </div>
            )}
          </div>
        </div>
      </NetflixCard>
    </div>
  );
}
