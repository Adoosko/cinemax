import { CachedPublicMoviesData } from '@/components/movies/cached-movie-data';
import {
  ContinueWatchingSkeletonTray,
  ContinueWatchingTray,
} from '@/components/movies/continue-watching-tray';
import { MovieFilters } from '@/components/movies/movie-filters';
import { MovieGrid } from '@/components/movies/movie-grid';
import { MoviesProvider } from '@/components/movies/movies-context';
import { UserRecommendations } from '@/components/movies/user-recommendations';
import { PerformanceTracker } from '@/components/performance/performance-tracker';
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

export default function MoviesPage() {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      {/* Page Header */}
      <div className="relative pt-20 md:pt-12 py-16 md:py-24 bg-black overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-800/80 animate-pulse"
          style={{ animationDuration: '8s' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className={`text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight drop-shadow-2xl ${permanentMarker.className}`}
          >
            MOVIES{' '}
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
            Explore classic movies from archive
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-24 h-1 bg-netflix-red rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Dynamic content with Suspense */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Suspense fallback={<MoviePageSkeleton />}>
          <MoviesPageContent />
        </Suspense>
      </div>
    </NetflixBg>
  );
}

// Separate component for dynamic content - allows better PPR splitting
async function MoviesPageContent() {
  const cachedData = await CachedPublicMoviesData();

  return (
    <>
      <PerformanceTracker pageName="movies-listing" />
      <MoviesProvider initialMovies={cachedData.movies}>
        {/* Continue Watching Tray */}
        <Suspense fallback={<ContinueWatchingSkeletonTray />}>
          <ContinueWatchingTray filterType="movie" />
        </Suspense>

        <Suspense fallback={<RecommendationsSkeleton />}>
          <UserRecommendations />
        </Suspense>

        <div className="my-8">
          <MovieFilters />
        </div>

        <Suspense fallback={<MovieGridSkeleton />}>
          <MovieGrid />
        </Suspense>
      </MoviesProvider>
    </>
  );
}

// Skeleton for the entire dynamic content
function MoviePageSkeleton() {
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
