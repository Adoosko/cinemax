'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { AlertCircle, ArrowLeft, Loader2, Share } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { VideoPlayerWithResume } from './video-player-with-resume';
import { MovieData } from './watch-page-server';

interface WatchPageClientProps {
  slug: string;
  initialMovieData?: MovieData;
}

// Loading skeleton for the entire watch page
function WatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header skeleton */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-6 w-24 bg-white/10" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
        </div>
      </header>

      {/* Video player skeleton */}
      <section className="w-full py-4">
        <div className="max-w-6xl mx-auto px-0 sm:px-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-netflix-red/10 absolute inset-0 animate-ping"></div>
                <Loader2 className="w-16 h-16 text-netflix-red animate-spin mx-auto relative" />
              </div>
              <p className="text-white/90 text-lg mt-4 font-medium">Loading video player...</p>
              <p className="text-white/60 text-sm mt-1">Preparing your movie</p>
            </div>
          </div>
        </div>
      </section>

      {/* Movie info skeleton */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 bg-white/10" />
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-3/4 bg-white/10" />
        </div>
      </section>
    </div>
  );
}

// Video player component with suspense boundary
function VideoPlayerSection({ movie }: { movie: MovieData }) {
  return (
    <section className="w-full py-4">
      <div className="max-w-6xl mx-auto px-0 sm:px-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/5 relative z-10">
          <VideoPlayerWithResume
            movieId={movie.id}
            streamingUrl={movie.streamingUrl}
            title={movie.title}
            posterUrl={movie.backdrop || movie.poster}
            qualities={movie.qualities || []}
            className="!block !visible"
          />
        </div>
      </div>
    </section>
  );
}

export function WatchPageClient({ slug, initialMovieData }: WatchPageClientProps) {
  const router = useRouter();
  const { user, isLoading: sessionLoading, isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<MovieData | null>(initialMovieData || null);
  const [loading, setLoading] = useState(!initialMovieData);
  const [error, setError] = useState<string | null>(null);

  // Fetch movie data only if not prerendered
  useEffect(() => {
    if (initialMovieData) {
      setMovie(initialMovieData);
      setLoading(false);
      return;
    }

    async function fetchMovie() {
      try {
        const baseUrl =
          process.env.NODE_ENV === 'production'
            ? process.env.NEXT_PUBLIC_APP_URL
            : 'https://cinemx.adrianfinik.sk';

        const url = `${baseUrl}/api/movies/${slug}/video?direct=true`;

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch movie: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.movie) {
          throw new Error('Movie not found');
        }

        setMovie(data.movie);
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError(err instanceof Error ? err.message : 'Failed to load movie');
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [slug, initialMovieData]);

  // Handle authentication
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      // Redirect to login with callback
      router.push(`/signin?callbackUrl=/movies/${slug}/watch`);
    }
  }, [isAuthenticated, sessionLoading, router, slug]);

  // Show loading state while checking auth or fetching data
  if (sessionLoading || loading) {
    return <WatchPageSkeleton />;
  }

  // Show error state
  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-netflix-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Movie Not Available</h1>
          <p className="text-white/60 mb-6">
            {error || 'This movie is not available for streaming.'}
          </p>
          <Button
            onClick={() => router.push(`/movies/${slug}`)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Movie Details
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Watch ${movie.title} on CINEMX`,
          url: window.location.href,
        });
      } catch {
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background image with gradient overlay */}
      {movie.backdrop && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${movie.backdrop})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70" />
        </div>
      )}

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Header with back button and controls */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-black/40 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push(`/movies/${movie.slug || movie.id}`)}
              className="flex items-center space-x-2 text-white hover:text-netflix-red transition-colors group p-0"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </Button>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={handleShare}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                title="Share movie"
              >
                <Share className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Video Player with Suspense */}
        <Suspense
          fallback={
            <section className="w-full py-4">
              <div className="max-w-6xl mx-auto px-0 sm:px-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 text-netflix-red animate-spin mx-auto" />
                    <p className="text-white/90 text-lg mt-4 font-medium">
                      Starting video player...
                    </p>
                  </div>
                </div>
              </div>
            </section>
          }
        >
          <VideoPlayerSection movie={movie} />
        </Suspense>

        {/* Movie Info Section */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{movie.title}</h1>
            {movie.description && (
              <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-3xl">
                {movie.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              {movie.year && <span>{movie.year}</span>}
              {movie.duration && <span>{movie.duration} min</span>}
              {movie.rating && (
                <span>
                  ★ {Number(movie.rating).toFixed(1)} ({movie.year || 'N/A'})/10
                </span>
              )}
              {movie.genre && Array.isArray(movie.genre) && <span>{movie.genre.join(', ')}</span>}
            </div>
            {movie.director && (
              <div className="text-sm text-white/60">
                <span className="font-medium text-white/80">Director:</span> {movie.director}
              </div>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <div className="text-sm text-white/60">
                <span className="font-medium text-white/80">Cast:</span> {movie.cast.join(', ')}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
