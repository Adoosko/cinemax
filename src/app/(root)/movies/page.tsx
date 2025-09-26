import { CachedPublicMoviesData } from '@/components/movies/cached-movie-data';
import { ContinueWatchingTray } from '@/components/movies/continue-watching-tray';
import { MovieFilters } from '@/components/movies/movie-filters';
import { MovieGrid } from '@/components/movies/movie-grid';
import { MoviesProvider } from '@/components/movies/movies-context';
import { UserRecommendations } from '@/components/movies/user-recommendations';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MovieGridSkeleton, RecommendationsSkeleton } from '@/components/ui/skeletons';
import { Suspense } from 'react';

// PPR configuration - static parts pre-rendered at build time, dynamic parts on-demand
export const experimental_ppr = true;

export default function MoviesPage() {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      {/* Static header - pre-rendered */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-6">Discover Movies</h1>

        {/* Dynamic content with Suspense */}
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
    <MoviesProvider initialMovies={cachedData.movies}>
      {/* Continue Watching Tray */}
      <Suspense fallback={null}>
        <ContinueWatchingTray />
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
