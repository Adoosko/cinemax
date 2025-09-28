'use client';

import { NetflixCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

// Shimmer animation component for Netflix-style loading
const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'animate-pulse bg-gradient-to-r from-netflix-dark-gray/50 via-netflix-medium-gray/70 to-netflix-dark-gray/50 bg-[length:200%_100%] animate-shimmer',
      className
    )}
    style={{
      backgroundImage:
        'linear-gradient(90deg, transparent 0%, rgba(47,47,47,0.8) 50%, transparent 100%)',
      animation: 'shimmer 2s infinite linear',
    }}
  />
);

// Enhanced movie card skeleton with rich placeholders
export function MovieCardSkeleton({ priority = false }: { priority?: boolean }) {
  return (
    <NetflixCard className="overflow-hidden group relative h-full animate-pulse">
      <div className="relative aspect-[2/3] overflow-hidden h-full bg-gradient-to-b from-slate-800 to-slate-900">
        {/* Shimmer overlay */}
        <Shimmer className="absolute inset-0 z-10" />

        {/* Fake poster placeholder with Netflix branding feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-netflix-dark-red/30 via-netflix-dark-gray to-black">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full bg-netflix-medium-gray flex items-center justify-center">
              <div className="w-8 h-8 bg-netflix-light-gray rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Rating badge skeleton */}
        <div className="absolute top-3 right-3">
          <div className="w-11 h-11 rounded-full bg-netflix-medium-gray border-2 border-netflix-light-gray">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500/30 to-netflix-red/40 animate-pulse" />
          </div>
        </div>

        {/* Content overlay skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
          {/* Title skeleton */}
          <div className="h-4 bg-netflix-medium-gray rounded mb-2 w-3/4 animate-pulse" />

          {/* Metadata skeleton */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="h-3 w-12 bg-netflix-medium-gray rounded animate-pulse" />
            <div className="h-3 w-8 bg-netflix-medium-gray rounded animate-pulse" />
            <div className="h-3 w-16 bg-netflix-medium-gray rounded animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="h-8 bg-gradient-to-r from-netflix-dark-red/50 to-netflix-red/60 rounded w-full animate-pulse" />
        </div>
      </div>
    </NetflixCard>
  );
}

// Enhanced grid skeleton with staggered loading effect
export function EnhancedMovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="mt-8">
      {/* Section title skeleton */}
      <div className="flex items-center mb-6">
        <div className="h-8 w-48 bg-gradient-to-r from-netflix-medium-gray to-netflix-light-gray rounded animate-pulse" />
        <div className="ml-4 h-6 w-16 bg-netflix-red/40 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse"
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: '1.5s',
            }}
          >
            <MovieCardSkeleton priority={index < 3} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Hero section skeleton for movie details - Fixed positioning to prevent sliding
export function MovieHeroSkeleton() {
  return (
    <div className="relative h-[70vh] overflow-hidden">
      {/* Background gradient - Fixed position */}
      <div className="absolute inset-0 bg-gradient-to-br from-netflix-dark-gray via-netflix-medium-gray to-black">
        <Shimmer className="absolute inset-0" />
      </div>

      {/* Content overlay - Fixed position */}
      <div className="absolute bottom-8 left-8 max-w-2xl space-y-6">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-12 w-96 bg-netflix-medium-gray rounded animate-pulse" />
          <div className="h-12 w-64 bg-netflix-light-gray rounded animate-pulse" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2 max-w-xl">
          <div className="h-4 w-full bg-netflix-medium-gray rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-netflix-medium-gray rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-netflix-medium-gray rounded animate-pulse" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex space-x-4">
          <div className="h-12 w-36 bg-netflix-dark-red/40 rounded animate-pulse" />
          <div className="h-12 w-32 bg-netflix-medium-gray rounded animate-pulse" />
          <div className="h-12 w-12 bg-netflix-medium-gray rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Carousel skeleton for featured content
export function FeaturedCarouselSkeleton() {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
        <div className="flex space-x-2">
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>

      <div className="flex space-x-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex-none w-80 animate-pulse"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
              <Shimmer className="absolute inset-0" />

              {/* Featured badge */}
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1 bg-red-600/40 rounded-full">
                  <div className="h-4 w-16 bg-white/30 rounded" />
                </div>
              </div>

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 animate-pulse" />
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent">
                <div className="h-5 w-3/4 bg-white/20 rounded mb-2 animate-pulse" />
                <div className="h-3 w-1/2 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Video player skeleton
export function VideoPlayerSkeleton() {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black">
        <Shimmer className="absolute inset-0" />
      </div>

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center animate-pulse">
          <div
            className="w-8 h-8 bg-white/30"
            style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
          />
        </div>
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded bg-white/20 animate-pulse" />
          <div className="flex-1 h-1 bg-white/20 rounded-full">
            <div className="h-full w-1/3 bg-red-600/50 rounded-full animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Search results skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex space-x-4 p-4 rounded-lg bg-white/5 animate-pulse">
          <div className="w-16 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded flex-shrink-0">
            <Shimmer className="absolute inset-0 rounded" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-white/15 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-white/15 rounded animate-pulse" />
            <div className="flex space-x-2">
              <div className="h-6 w-12 bg-green-500/30 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
