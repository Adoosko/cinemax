'use client';

import { useState, useEffect, useMemo } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MovieCard } from './movie-card';

// Use the Movie type from the cached data
import { type Movie } from '@/lib/data/movies-with-use-cache';

import { useMoviesContext } from './movies-context';

export function UserRecommendations() {
  const { movies, isLoading } = useMoviesContext();

  // Create recommendations by taking a random subset of movies
  const recommendedMovies = useMemo(() => {
    if (!movies || movies.length === 0) return [];

    // Create a copy of the movies array and shuffle it
    return [...movies].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [movies]);

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
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">Recommended For You</h2>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {recommendedMovies.map((movie: Movie, index: number) => (
            <CarouselItem key={movie.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <MovieCard movie={movie} index={index} showPlayButton={true} showDetails={true} showStats={true} showDetailsOnMobile={true} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-black/50 text-white border-none hover:bg-black/80" />
        <CarouselNext className="right-2 bg-black/50 text-white border-none hover:bg-black/80" />
      </Carousel>
    </div>
  );
}
