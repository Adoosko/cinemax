import {
  ContinueWatchingSkeletonTray,
  ContinueWatchingTray,
} from '@/components/movies/continue-watching-tray';
import { CachedPublicSeriesData } from '@/components/series/cached-series-data';
import { SeriesProvider } from '@/components/series/series-context';
import SeriesFilters from '@/components/series/series-filters';
import SeriesGrid from '@/components/series/series-grid';
import SeriesRecommendations from '@/components/series/series-recommendations';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MovieGridSkeleton, RecommendationsSkeleton } from '@/components/ui/skeletons';
import { Permanent_Marker } from 'next/font/google';
import { Suspense } from 'react';

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

// PPR configuration - static parts pre-rendered at build time, dynamic parts on-demand
export const experimental_ppr = true;

export default function SeriesPage() {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      {/* Page Header - Mobile Optimized */}
      <div className="relative pt-20 md:pt-12 py-12 md:py-24 bg-black overflow-hidden">
        {/* Simplified gradient - no animation on mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 md:animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className={`text-4xl md:text-7xl lg:text-8xl font-black text-white mb-4 md:mb-6 tracking-tight drop-shadow-2xl ${permanentMarker.className}`}
          >
            SERIES
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
            Explore classic series from the archive
          </p>
          <div className="mt-6 md:mt-8 flex justify-center">
            <div className="w-16 md:w-24 h-1 bg-netflix-red rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Dynamic content with Suspense */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Suspense fallback={<SeriesPageSkeleton />}>
          <SeriesPageContent />
        </Suspense>
      </div>
    </NetflixBg>
  );
}

// Separate component for dynamic content - allows better PPR splitting
async function SeriesPageContent() {
  const cachedData = await CachedPublicSeriesData();

  return (
    <>
      <SeriesProvider initialSeries={cachedData.series}>
        {/* Continue Watching Tray */}
        <Suspense fallback={<ContinueWatchingSkeletonTray />}>
          <ContinueWatchingTray filterType="series" />
        </Suspense>

        <Suspense fallback={<RecommendationsSkeleton />}>
          <SeriesRecommendations />
        </Suspense>

        <div className="my-8">
          <SeriesFilters />
        </div>

        <Suspense fallback={<MovieGridSkeleton />}>
          <SeriesGrid />
        </Suspense>
      </SeriesProvider>
    </>
  );
}

// Skeleton for the entire dynamic content
function SeriesPageSkeleton() {
  return (
    <>
      <div className="h-8 w-64 bg-white/10 rounded mb-4 animate-pulse"></div>
      <div className="my-8">
        <div className="h-12 w-full bg-white/10 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="aspect-[2/3] rounded-lg bg-white/10"></div>
            <div className="h-4 w-full bg-white/10 rounded"></div>
            <div className="h-3 w-1/2 bg-white/10 rounded"></div>
          </div>
        ))}
      </div>
    </>
  );
}
