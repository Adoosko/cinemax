'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSeriesContinueWatching } from '@/lib/hooks/use-series-continue-watching';
import { useWatchHistory } from '@/lib/hooks/use-watch-history';
import { ChevronUp, Film, Play, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

// Filter type prop—can be 'movie', 'series', or both
interface ContinueWatchingTrayProps {
  filterType?: 'movie' | 'series';
}

export function ContinueWatchingTray({ filterType }: ContinueWatchingTrayProps = {}) {
  const { isAuthenticated } = useAuth();
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
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState<boolean>(false);

  // Loading and error handling
  const isLoading = isAuthenticated && (moviesLoading || seriesLoading);
  const error = moviesError || seriesError;

  // Combine watch history and series, filtered by prop
  const combinedContinueWatching = [
    ...watchHistory.map((item) => ({ ...item, type: 'movie' as const })),
    ...seriesContinueWatching.map((item) => ({ ...item, type: 'series' as const })),
  ]
    .filter((item) => !filterType || item.type === filterType)
    .sort((a, b) => {
      const aDate = a.type === 'movie' ? a.updatedAt : a.lastActive;
      const bDate = b.type === 'movie' ? b.updatedAt : b.lastActive;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  // IntersectionObserver for sticky bar visibility
  useEffect(() => {
    if (!sectionRef.current || combinedContinueWatching.length === 0) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => setIsStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [combinedContinueWatching.length]);

  // Early return if not authenticated, loading, or errored
  if (!isAuthenticated) return null;
  if (isLoading) return <ContinueWatchingSkeletonTray />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (combinedContinueWatching.length === 0) return null;

  // Remove item handler
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
    <>
      {/* Sticky bar with reserved height for CLS avoidance */}
      <div
        aria-hidden
        className="sticky-placeholder"
        style={{ height: isStickyVisible ? 72 : 0 }}
      />

      {isStickyVisible && combinedContinueWatching.length > 0 && (
        <nav className="fixed top-16 left-0 right-0 z-20 bg-black/90 backdrop-blur-lg border-b border-white/20 animate-in slide-in-from-top duration-300 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-2 md:py-4 flex items-center justify-between">
            <button
              onClick={() => sectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center space-x-2 md:space-x-3 text-white hover:text-netflix-red transition-colors"
            >
              <div className="p-1.5 md:p-2 rounded-full bg-white/10">
                <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="text-left">
                <span className="text-sm md:text-base font-semibold block">
                  {filterType === 'movie'
                    ? 'Movie Night Revival'
                    : filterType === 'series'
                      ? 'Binge Watch Checkpoint'
                      : 'Continue Watching'}
                </span>
                <span className="text-xs text-gray-300">
                  {combinedContinueWatching.length} items
                </span>
              </div>
            </button>
            <div className="flex items-center space-x-1 md:space-x-2">
              {combinedContinueWatching.slice(0, 2).map((item) => {
                const imageUrl = item.type === 'movie' ? item.movie.posterUrl : item.seriesCover;
                const title = item.type === 'movie' ? item.movie.title : item.seriesTitle;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() =>
                      document
                        .getElementById(`continue-${item.type}-${item.id}`)
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="relative"
                    aria-label={`Jump to ${title}`}
                  >
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 border-white/30 hover:border-netflix-red transition-colors">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={title}
                          width={48}
                          height={72}
                          className="object-cover w-full h-full"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <Film className="w-3 h-3 md:w-4 md:h-4 bg-white/50 rounded-sm" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
      {/* Watch history tray */}
      <div ref={sectionRef} className="py-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          {filterType === 'movie'
            ? 'Movie Night Revival'
            : filterType === 'series'
              ? 'Binge Watch Checkpoint'
              : 'Continue Watching'}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
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
                id={`continue-${item.type}-${item.id}`}
                key={`${item.type}-${item.id}`}
                className="group relative overflow-hidden rounded-lg transition-all duration-300 flex-shrink-0 w-48"
                aria-label={`Continue watching ${title}`}
              >
                <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-800">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill // Responsive image fill for best grid performance
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 12vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                      <Film className="w-12 h-12" />
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1">
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = href;
                      }}
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
                    aria-label={`Remove ${title} from continue watching`}
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
    </>
  );
}

// Accessible skeleton tray—matches card sizes!
export function ContinueWatchingSkeletonTray() {
  return (
    <div className="py-8">
      <div className="h-8 w-64 bg-white/10 rounded mb-4 animate-pulse"></div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-lg animate-pulse flex-shrink-0 w-48"
          >
            <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-white/10" />
            <div className="h-4 w-full bg-white/10 rounded mt-2" />
            <div className="h-3 w-1/2 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
