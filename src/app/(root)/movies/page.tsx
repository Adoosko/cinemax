import { CachedPublicMoviesData } from '@/components/movies/cached-movie-data';
import { ContinueWatchingTray } from '@/components/movies/continue-watching-tray';
import { FeaturedMovies } from '@/components/movies/featured-movies';
import { MovieFilters } from '@/components/movies/movie-filters';
import { MovieGrid } from '@/components/movies/movie-grid';
import { MoviesProvider } from '@/components/movies/movies-context';
import { UserRecommendations } from '@/components/movies/user-recommendations';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MovieGridSkeleton, RecommendationsSkeleton } from '@/components/ui/skeletons';
import { Suspense } from 'react';

// Force dynamic rendering to avoid build-time fetch errors
export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const cachedData = await CachedPublicMoviesData();

  return (
    <MoviesProvider initialMovies={cachedData.movies}>
      <NetflixBg variant="solid" className="min-h-screen">
        <FeaturedMovies />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Continue Watching Tray */}
          <Suspense fallback={null}>
            <ContinueWatchingTray />
          </Suspense>

          <h1 className="text-4xl font-bold text-white mb-6">Discover Movies</h1>
          <Suspense fallback={<RecommendationsSkeleton />}>
            <UserRecommendations />
          </Suspense>
          <div className="my-8">
            <MovieFilters />
          </div>

          <Suspense fallback={<MovieGridSkeleton />}>
            <MovieGrid />
          </Suspense>
        </div>
      </NetflixBg>
    </MoviesProvider>
  );
}
