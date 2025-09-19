'use client';

import { NetflixCard } from '@/components/ui/glass-card';

export function MovieGridSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse"></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <NetflixCard className="overflow-hidden relative">
              <div className="aspect-[2/3] bg-white/10 rounded"></div>
            </NetflixCard>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecommendationsSkeleton() {
  return (
    <div className="mb-12">
      <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse"></div>

      <div className="flex space-x-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex-none w-1/4 animate-pulse">
            <NetflixCard className="overflow-hidden relative">
              <div className="aspect-[2/3] bg-white/10 rounded">
                {/* Rating badge skeleton */}
                <div className="absolute top-3 right-3 w-10 h-5 bg-white/20 rounded-full"></div>

                {/* Bottom content skeleton */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Title skeleton */}
                  <div className="h-5 bg-white/20 rounded mb-2 w-3/4"></div>

                  {/* Info skeleton */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-4 w-12 bg-white/20 rounded"></div>
                    <div className="h-4 w-10 bg-white/20 rounded"></div>
                  </div>

                  {/* Button skeleton */}
                  <div className="h-8 bg-white/20 rounded w-full"></div>
                </div>
              </div>
            </NetflixCard>
          </div>
        ))}
      </div>
    </div>
  );
}
