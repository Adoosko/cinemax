import { Suspense } from 'react';
import { MovieGridSkeleton, RecommendationsSkeleton } from '../ui/skeletons';
import { CachedPublicMoviesData } from './cached-movie-data';
import { ContinueWatchingSkeletonTray, ContinueWatchingTray } from './continue-watching-tray';

import MovieFilters from './movie-filters';
import MovieGrid from './movie-grid';
import { MoviesProvider } from './movies-context';
import UserRecommendations from './user-recommendations';

export default async function MoviesPageContent() {
  const cachedData = await CachedPublicMoviesData();

  return (
    <>
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
