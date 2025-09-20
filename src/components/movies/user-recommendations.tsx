'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, Play, Info } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { NetflixCard } from '@/components/ui/glass-card';

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
              <div className="h-full">
                <NetflixCard className="overflow-hidden group relative h-full">
                  <div className="relative aspect-[2/3] overflow-hidden h-full">
                    <Image
                      src={movie.posterUrl || '/placeholder-movie.jpg'}
                      alt={movie.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority={index < 3}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300" />

                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-white text-xs font-medium">{movie.rating}</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <Link href={`/movies/${movie.slug}`}>
                        <h3 className="text-white font-bold text-lg mb-2 drop-shadow-lg">
                          {movie.title}
                        </h3>
                      </Link>

                      <div className="flex items-center space-x-3 text-sm text-white/90 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{movie.duration}</span>
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">{movie.genre}</span>
                      </div>

                      <Link href={`/movies/${movie.slug}`} className="block w-full">
                        <button className="w-full bg-white hover:bg-gray-200 text-black py-2 rounded-sm flex items-center justify-center space-x-2 transition-colors font-semibold">
                          <Info className="w-4 h-4" />
                          <span>Details</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </NetflixCard>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-black/50 text-white border-none hover:bg-black/80" />
        <CarouselNext className="right-2 bg-black/50 text-white border-none hover:bg-black/80" />
      </Carousel>
    </div>
  );
}
