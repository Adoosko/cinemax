'use client';

import { Button } from '@/components/ui/button';
import { useSeriesContinueWatching } from '@/lib/hooks/use-series-continue-watching';
import { useWatchHistory } from '@/lib/hooks/use-watch-history';
import { Play, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function ContinueWatchingTray() {
  const {
    watchHistory,
    isLoading: moviesLoading,
    error: moviesError,
    removeFromWatchHistory,
  } = useWatchHistory();
  const {
    continueWatching: seriesContinueWatching,
    isLoading: seriesLoading,
    error: seriesError,
    removeFromContinueWatching,
  } = useSeriesContinueWatching();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [hasWatchHistory, setHasWatchHistory] = useState<boolean>(false);

  const isLoading = moviesLoading || seriesLoading;
  const error = moviesError || seriesError;

  // Combine movies and series continue watching
  const combinedContinueWatching = [
    ...watchHistory.map((item) => ({ ...item, type: 'movie' as const })),
    ...seriesContinueWatching.map((item) => ({ ...item, type: 'series' as const })),
  ].sort((a, b) => {
    const aDate = a.type === 'movie' ? a.updatedAt : a.lastActive;
    const bDate = b.type === 'movie' ? b.updatedAt : b.lastActive;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  // Track if we've ever had watch history to determine if we should show skeleton
  useEffect(() => {
    if (!isLoading && combinedContinueWatching && combinedContinueWatching.length > 0) {
      setHasWatchHistory(true);
    }
  }, [isLoading, combinedContinueWatching]);

  // Show skeleton only if we're loading and we previously had watch history
  if (isLoading && hasWatchHistory) {
    return <ContinueWatchingSkeletonTray />;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!combinedContinueWatching || combinedContinueWatching.length === 0) {
    return null; // Don't show the tray if there's nothing to continue watching
  }

  // Update hasWatchHistory when we get data
  if (!hasWatchHistory && combinedContinueWatching.length > 0) {
    setHasWatchHistory(true);
  }

  const handleRemove = async (id: string, type: 'movie' | 'series', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setRemovingId(id);
    if (type === 'movie') {
      await removeFromWatchHistory(id);
    } else {
      await removeFromContinueWatching(id);
    }
    setRemovingId(null);
  };

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-white mb-4">Continue Watching</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {combinedContinueWatching.map((item) => {
          const href =
            item.type === 'movie'
              ? `/movies/${item.movie.slug}/watch`
              : `/series/${item.seriesSlug}/season/${item.seasonNumber}/episode/${item.episodeNumber}`;
          const title = item.type === 'movie' ? item.movie.title : item.seriesTitle;
          const imageUrl = item.type === 'movie' ? item.movie.posterUrl : item.seriesCover;
          const progressText =
            item.type === 'movie'
              ? `${Math.round(item.progress * 100)}% watched`
              : item.progress >= 0.99
                ? `S${item.seasonNumber}E${item.episodeNumber} • Completed`
                : `S${item.seasonNumber}E${item.episodeNumber} • ${Math.round(item.progress * 100)}%`;

          return (
            <Link
              href={href}
              key={`${item.type}-${item.id}`}
              className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
            >
              <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-800">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 12vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                    <Film className="w-12 h-12" />
                  </div>
                )}

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div
                    className="h-full bg-netflix-red"
                    style={{ width: `${item.progress * 100}%` }}
                  />
                </div>

                {/* Overlay with play button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    className="rounded-full bg-white text-black hover:bg-white/90 p-3"
                    aria-label="Play"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </Button>
                </div>

                {/* Remove button */}
                <Button
                  onClick={(e) =>
                    handleRemove(item.type === 'movie' ? item.id : item.seriesId, item.type, e)
                  }
                  disabled={removingId === (item.type === 'movie' ? item.id : item.seriesId)}
                  className="absolute top-2 right-2 rounded-full p-1.5 bg-black/70 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                  aria-label="Remove from continue watching"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium text-white truncate">{title}</h3>
                <p className="text-xs text-gray-400">{progressText}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ContinueWatchingSkeletonTray() {
  return (
    <div className="py-8">
      <div className="h-8 w-64 bg-white/10 rounded mb-4 animate-pulse"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="aspect-[2/3] rounded-lg bg-white/10"></div>
            <div className="h-4 w-full bg-white/10 rounded"></div>
            <div className="h-3 w-1/2 bg-white/10 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Film } from 'lucide-react';
