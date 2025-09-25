import { Suspense } from 'react';

import { NetflixBg } from '@/components/ui/netflix-bg';
import { MovieGridSkeleton, RecommendationsSkeleton } from '@/components/ui/skeletons';

// Force dynamic rendering to avoid build-time fetch errors
export const dynamic = 'force-dynamic';

import { ContinueWatchingTray } from '@/components/movies/continue-watching-tray';
import { CachedPublicSeriesData } from '@/components/series/cached-series-data';
import { FeaturedSeries } from '@/components/series/featured-series';
import { SeriesProvider } from '@/components/series/series-context';
import { SeriesFilters } from '@/components/series/series-filters';
import { SeriesGrid } from '@/components/series/series-grid';
import { SeriesRecommendations } from '@/components/series/series-recommendations';

export default async function SeriesPage() {
  const cachedData = await CachedPublicSeriesData();

  return (
    <SeriesProvider initialSeries={cachedData.series}>
      <NetflixBg variant="solid" className="min-h-screen">
        <FeaturedSeries />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Continue Watching Tray */}
          <Suspense fallback={null}>
            <ContinueWatchingTray />
          </Suspense>

          <h1 className="text-4xl font-bold text-white mb-6">Discover Series</h1>
          <Suspense fallback={<RecommendationsSkeleton />}>
            <SeriesRecommendations />
          </Suspense>
          <div className="my-8">
            <SeriesFilters />
          </div>

          <Suspense fallback={<MovieGridSkeleton />}>
            <SeriesGrid />
          </Suspense>
        </div>
      </NetflixBg>
    </SeriesProvider>
  );
}
