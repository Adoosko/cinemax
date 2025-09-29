import { ContinueWatchingTray } from '@/components/movies/continue-watching-tray';
import { PerformanceTracker } from '@/components/performance/performance-tracker';
import { CachedPublicSeriesData } from '@/components/series/cached-series-data';
import { SeriesProvider } from '@/components/series/series-context';
import { SeriesFilters } from '@/components/series/series-filters';
import { SeriesGrid } from '@/components/series/series-grid';
import { SeriesRecommendations } from '@/components/series/series-recommendations';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MovieGridSkeleton, RecommendationsSkeleton } from '@/components/ui/skeletons';
import { Suspense } from 'react';

// PPR configuration - static parts pre-rendered at build time, dynamic parts on-demand
export const experimental_ppr = true;

export default function SeriesPage() {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      {/* Static header - pre-rendered */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dynamic content with Suspense */}
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
      <PerformanceTracker pageName="series-listing" />
      <SeriesProvider initialSeries={cachedData.series}>
        {/* Continue Watching Tray */}
        <Suspense fallback={null}>
          <ContinueWatchingTray />
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
