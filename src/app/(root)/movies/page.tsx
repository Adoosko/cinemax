import { Suspense } from 'react';
import { MovieGrid } from '@/components/movies/movie-grid';
import { MovieFilters } from '@/components/movies/movie-filters';
import { FeaturedMovies } from '@/components/movies/featured-movies';
import { UserRecommendations } from '@/components/movies/user-recommendations';
import { MovieGridSkeleton, RecommendationsSkeleton } from '@/components/ui/skeletons';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MoviesProvider } from '@/components/movies/movies-context';
import { CachedPublicMoviesData } from '@/components/movies/cached-movie-data';
import { ContinueWatchingTray } from '@/components/movies/continue-watching-tray';

// PPR Nextjs 15+ experimental feature
export const experimental_ppr = true;

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
