'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { LazyComponent } from '@/components/ui/lazy-component';
import { ProgressiveImage } from '@/components/ui/progressive-image';
import { type Movie as CachedMovie } from '@/lib/data/movies-with-use-cache';
import { useWatchHistory } from '@/lib/hooks/use-watch-history';
import { ArrowLeft, Heart, Play, Share } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Lazy load heavy components
const DynamicCreateWatchPartyButton = dynamic(
  () =>
    import('@/components/watch-party/create-watch-party-button').then((mod) => ({
      default: mod.CreateWatchPartyButton,
    })),
  { ssr: false }
);

const DynamicAiTrailerPlayer = dynamic(
  () => import('./ai-trailer-player').then((mod) => ({ default: mod.AiTrailerPlayer })),
  { ssr: false }
);

const DynamicMovieComments = dynamic(
  () => import('./movie-comments').then((mod) => ({ default: mod.MovieComments })),
  { ssr: false }
);

const DynamicSimilarMovies = dynamic(
  () => import('./similar-movies').then((mod) => ({ default: mod.SimilarMovies })),
  { ssr: false }
);

export type Movie = CachedMovie;

interface MovieDetailClientProps {
  movie: Movie;
  allMovies?: Movie[];
}

export function MovieDetailClient({ movie, allMovies = [] }: MovieDetailClientProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const { watchHistory } = useWatchHistory();

  // Find if user has progress in this movie
  const movieProgress = watchHistory.find((item) => item.movieId === movie.id);

  // Function to convert progress percentage to readable time format
  const formatProgressTime = (progress: number, totalDurationMinutes: number = 120) => {
    const watchedMinutes = Math.floor(progress * totalDurationMinutes);
    const minutes = watchedMinutes % 60;
    const hours = Math.floor(watchedMinutes / 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}:00`;
  };

  // Parse duration to get total minutes (handles both string and number types)
  const getTotalDurationMinutes = (duration: string | number): number => {
    if (!duration) return 120; // Default fallback

    // If duration is already a number, return it directly (assuming it's in minutes)
    if (typeof duration === 'number') {
      return duration;
    }

    // Handle string formats like "2h 30min" or "120 min"
    const hourMatch = duration.match(/(\d+)h/);
    const minuteMatch = duration.match(/(\d+)\s*min/);

    let totalMinutes = 0;
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }

    return totalMinutes || 120; // Default to 120 minutes if parsing fails
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: movie.description,
          url: window.location.href,
        });
      } catch {
        // fallback: copy url
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleFavorite = () => setIsFavorite((prev) => !prev);

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Hero */}
      <div className="relative h-[60vh] lg:h-[70vh] overflow-hidden">
        {movie.backdropUrl && (
          <ProgressiveImage
            src={movie.backdropUrl}
            alt={`${movie.title} backdrop`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={85}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black/80 via-netflix-black/60 to-transparent" />
        {/* Actions */}
        <div className="absolute top-6 left-6 z-20 flex gap-2">
          <Button variant="glass" size="icon" aria-label="Back" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <Button
            variant={isFavorite ? 'outline' : 'ghost'}
            size="icon"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={toggleFavorite}
            className={isFavorite ? 'text-netflix-red border-netflix-red' : 'text-white'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share"
            onClick={handleShare}
            className="text-white"
          >
            <Share className="w-5 h-5" />
          </Button>
        </div>
        {/* Overlay content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-8">
          <div className="max-w-3xl">
            {movie.streamingUrl && (
              <LazyComponent>
                <DynamicCreateWatchPartyButton
                  movieId={movie.id}
                  movieTitle={movie.title}
                  className="mb-4"
                />
              </LazyComponent>
            )}
            <h1 className="text-2xl mt-5 md:text-4xl lg:text-5xl font-bold text-white mb-3">
              {movie.title}
            </h1>
            <div className="flex flex-wrap gap-4 items-center mb-5">
              <div className="flex items-center space-x-2">
                <CircularProgress
                  value={Number(movie.rating) * 10}
                  size={32}
                  strokeWidth={2}
                  valueClassName="text-xs"
                />
                <span className="text-white/80 text-sm">
                  ({movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'})
                </span>
              </div>
              <Badge variant="outline">{movie.releaseDate}</Badge>
              <Badge variant="outline" className="bg-netflix-dark-red">
                {movie.duration}
              </Badge>
              <Badge variant="outline">{movie.genre}</Badge>
            </div>
            <p className="text-white/80 text-xs md:text-sm lg:text-base leading-relaxed mb-8">
              {movie.description}
            </p>

            <div className="flex gap-3 flex-wrap">
              {/* Watch Movie */}
              {movie.streamingUrl && (
                <Button
                  size={'sm'}
                  variant={'premium'}
                  onClick={() => router.push(`/movies/${movie.slug}/watch`)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {movieProgress &&
                  movieProgress.progress > 0.05 &&
                  movieProgress.progress < 0.95 ? (
                    <>
                      Resume watching at{' '}
                      {formatProgressTime(
                        movieProgress.progress,
                        getTotalDurationMinutes(movie.duration)
                      )}
                    </>
                  ) : (
                    'Watch Now'
                  )}
                </Button>
              )}
              {/* Trailer */}
              <Button
                size={'sm'}
                variant={'glass'}
                className="border-white/20"
                onClick={() =>
                  window.open(
                    movie.trailerUrl
                      ? movie.trailerUrl
                      : `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + movie.releaseDate + ' trailer')}`,
                    '_blank'
                  )
                }
              >
                <Play className="w-4 h-4 mr-2" /> Watch Trailer
              </Button>
              {/* AI Trailer */}
              <LazyComponent>
                <DynamicAiTrailerPlayer movieSlug={movie.slug || ''} className="min-w-[120px]" />
              </LazyComponent>
              {/* Watch Party */}
            </div>
          </div>
        </div>
      </div>
      {/* Details */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-transparent border-0 mb-6 p-5">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Cast & Crew</h3>
              <div className="flex gap-6 mb-3">
                <span className="text-netflix-text-gray w-20 text-xs md:text-sm lg:text-base">
                  Director:
                </span>
                <span className="text-white text-xs md:text-sm lg:text-base">{movie.director}</span>
              </div>
              <div className="flex gap-6">
                <span className="text-netflix-text-gray w-20 text-xs md:text-sm lg:text-base">
                  Cast:
                </span>
                <span className="text-white text-xs md:text-sm lg:text-base">
                  {movie.cast.join(', ')}
                </span>
              </div>
            </div>
          </Card>
        </div>
        {/* Sidebar Info */}
        <div>
          <Card className="bg-transparent border-0 gray p-6">
            <h3 className="text-lg font-bold text-white mb-4">Movie Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                  Release Date:
                </span>
                <span className="text-white ml-2 text-xs md:text-sm lg:text-base">
                  {movie.releaseDate}
                </span>
              </div>
              <div>
                <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                  Duration:
                </span>
                <span className="text-white ml-2 text-xs md:text-sm lg:text-base">
                  {movie.duration}
                </span>
              </div>
              <div>
                <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                  Rating:
                </span>
                <span className="text-white ml-2 text-xs md:text-sm lg:text-base">
                  {Number(movie.rating).toFixed(1)} (
                  {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'})/10
                </span>
              </div>
              {movie.averageReview && (
                <div>
                  <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                    User Rating:
                  </span>
                  <span className="text-white ml-2">{movie.averageReview}/5</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      {/* Comments Section */}
      <LazyComponent
        fallback={
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="h-8 w-32 bg-white/10 rounded mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto px-6 py-12">
          <DynamicMovieComments movieSlug={movie.slug || ''} />
        </div>
      </LazyComponent>

      {/* Recommended Movies */}
      <LazyComponent
        fallback={
          <div className="bg-netflix-black pt-4 px-2">
            <div className="h-8 w-40 bg-white/10 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-white/10 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        }
      >
        <div className="bg-netflix-black pt-4 px-2">
          <DynamicSimilarMovies currentMovie={movie} allMovies={allMovies} />
        </div>
      </LazyComponent>
    </div>
  );
}
