import { Suspense } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { MovieGrid } from '@/components/movies/movie-grid';
import { MovieFilters } from '@/components/movies/movie-filters';
import { FeaturedMovies } from '@/components/movies/featured-movies';
import { UserRecommendations } from '@/components/movies/user-recommendations';
import { MovieGridSkeleton, RecommendationsSkeleton } from '@/components/ui/skeletons';
import { NetflixBg } from '@/components/ui/netflix-bg';
import { MoviesProvider } from '@/components/movies/movies-context';

// ✅ This page will use PPR
export const experimental_ppr = true;

export default function MoviesPage() {
  return (
    <MoviesProvider>
      <NetflixBg variant="solid" className="min-h-screen">
        {/* ✅ STATIC: Hero section prerendered */}
        <FeaturedMovies />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-6">Discover Movies</h1>

          {/* ✅ DYNAMIC: User-specific recommendations stream in */}
          <Suspense fallback={<RecommendationsSkeleton />}>
            <UserRecommendations />
          </Suspense>

          {/* ✅ STATIC: Filter UI prerendered */}
          <div className="my-8">
            <MovieFilters />
          </div>

          {/* ✅ DYNAMIC: Movie grid with real-time data streams in */}
          <Suspense fallback={<MovieGridSkeleton />}>
            <MovieGrid />
          </Suspense>
        </div>
      </NetflixBg>
    </MoviesProvider>
  );
}
