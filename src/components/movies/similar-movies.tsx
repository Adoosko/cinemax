'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { NetflixCard } from '@/components/ui/glass-card';

// Use the Movie type from the cached data
import { type Movie } from '@/lib/data/movies-with-use-cache';

interface SimilarMoviesProps {
  currentMovie: Movie;
  allMovies?: Movie[];
  title?: string;
}

export function SimilarMovies({
  currentMovie,
  allMovies = [],
  title = 'You Might Also Like',
}: SimilarMoviesProps) {
  // Create recommendations by finding movies with similar genre
  const similarMovies = useMemo(() => {
    if (!allMovies || allMovies.length === 0) {
      // Fallback to mock data if no movies are provided
      return getMockSimilarMovies(currentMovie);
    }

    // Filter out the current movie
    const otherMovies = allMovies.filter((movie) => movie.id !== currentMovie.id);

    // Find movies with similar genre
    let genreToMatch: string | string[] = currentMovie.genre;
    if (typeof genreToMatch === 'string') {
      genreToMatch = genreToMatch.toLowerCase();
    }

    // Find movies with similar genre
    const matchingMovies = otherMovies.filter((movie) => {
      if (typeof movie.genre === 'string' && typeof genreToMatch === 'string') {
        return movie.genre.toLowerCase().includes(genreToMatch);
      } else if (Array.isArray(movie.genre) && typeof genreToMatch === 'string') {
        return movie.genre.some((g) => g.toLowerCase().includes(genreToMatch));
      } else if (typeof movie.genre === 'string' && Array.isArray(genreToMatch)) {
        return genreToMatch.some((g) => movie.genre.toLowerCase().includes(g.toLowerCase()));
      } else if (Array.isArray(movie.genre) && Array.isArray(genreToMatch)) {
        return movie.genre.some((g) =>
          genreToMatch.some((matchG) => g.toLowerCase().includes(matchG.toLowerCase()))
        );
      }
      return false;
    });

    // If we don't have enough matching movies, add some random ones
    if (matchingMovies.length < 5) {
      const randomMovies = otherMovies
        .filter((m) => !matchingMovies.some((mm) => mm.id === m.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 5 - matchingMovies.length);

      return [...matchingMovies, ...randomMovies].slice(0, 5);
    }

    return matchingMovies.slice(0, 5);
  }, [currentMovie, allMovies]);

  if (similarMovies.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {similarMovies.map((movie: Movie, index: number) => (
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
                      <h3 className="text-white font-bold mb-1">{movie.title}</h3>

                      <div className="flex items-center space-x-3 text-xs text-white/90 mb-3">
                        <span>{movie.releaseDate}</span>
                        <span>{movie.duration}</span>
                      </div>

                      <Link href={`/movies/${movie.slug}`} className="block w-full">
                        <button className="w-full bg-white hover:bg-gray-200 text-black py-2 rounded-sm flex items-center justify-center space-x-2 transition-colors font-semibold">
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

// Function to generate mock similar movies if no real data is available
function getMockSimilarMovies(currentMovie: Movie) {
  return [
    {
      id: 'rec1',
      title: 'Similar Movie 1',
      slug: 'similar-movie-1',
      posterUrl:
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
      genre: currentMovie.genre,
      rating: 8.2,
      releaseDate: '2023',
      duration: '2h 15m',
    },
    {
      id: 'rec2',
      title: 'Similar Movie 2',
      slug: 'similar-movie-2',
      posterUrl:
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
      genre: currentMovie.genre,
      rating: 7.8,
      releaseDate: '2022',
      duration: '1h 55m',
    },
    {
      id: 'rec3',
      title: 'Similar Movie 3',
      slug: 'similar-movie-3',
      posterUrl:
        'https://images.unsplash.com/photo-1512070679279-8988d32161be?w=400&h=600&fit=crop',
      genre: currentMovie.genre,
      rating: 8.5,
      releaseDate: '2024',
      duration: '2h 5m',
    },
    {
      id: 'rec4',
      title: 'Similar Movie 4',
      slug: 'similar-movie-4',
      posterUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&h=600&fit=crop',
      genre: currentMovie.genre,
      rating: 7.6,
      releaseDate: '2021',
      duration: '1h 45m',
    },
    {
      id: 'rec5',
      title: 'Similar Movie 5',
      slug: 'similar-movie-5',
      posterUrl:
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop',
      genre: currentMovie.genre,
      rating: 8.0,
      releaseDate: '2023',
      duration: '2h 10m',
    },
  ] as Movie[];
}
