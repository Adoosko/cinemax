'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useMemo } from 'react';
import { MovieCard } from './movie-card';

// Use the Movie type from the cached data
import { type Movie } from '@/lib/data/movies-with-use-cache';

import { useSeriesContinueWatching } from '@/lib/hooks/use-series-continue-watching';
import { useWatchHistory } from '@/lib/hooks/use-watch-history';
import { useMoviesContext } from './movies-context';

export function UserRecommendations() {
  const { movies, isLoading } = useMoviesContext();
  const { watchHistory } = useWatchHistory();
  const { continueWatching: seriesContinueWatching } = useSeriesContinueWatching();

  // Create recommendations by taking a random subset of unwatched movies
  const recommendedMovies = useMemo(() => {
    if (!movies || movies.length === 0) return [];

    // Get IDs of watched movies and movies currently being watched
    const watchedMovieIds = new Set(watchHistory.map((item) => item.movieId));
    const watchingMovieIds = new Set(
      watchHistory
        .filter((item) => item.progress > 0 && item.progress < 1)
        .map((item) => item.movieId)
    );

    // Filter out watched and currently watching movies
    const unwatchedMovies = movies.filter(
      (movie) => !watchedMovieIds.has(movie.id) && !watchingMovieIds.has(movie.id)
    );

    // Create a copy of the unwatched movies array and shuffle it
    return [...unwatchedMovies].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [movies, watchHistory]);

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-white text-xl">Loading recommendations...</div>
      </div>
    );
  }

  if (recommendedMovies.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 pb-24">
      <h2 className="text-2xl font-bold text-white mb-6">What to Watch Next (Trust Me)</h2>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {recommendedMovies.map((movie: Movie, index: number) => (
            <CarouselItem
              key={movie.id}
              className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
            >
              <MovieCard movie={movie} index={index} showDetails />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-black/50 text-white border-none hover:bg-black/80" />
        <CarouselNext className="right-2 bg-black/50 text-white border-none hover:bg-black/80" />
      </Carousel>
    </div>
  );
}
