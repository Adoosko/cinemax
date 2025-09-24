'use client';

import { useMemo } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { MovieCard } from './movie-card';

// Use the Movie type from the cached data
import { type Movie } from '@/lib/data/movies-with-use-cache';

interface SimilarMoviesProps {
  currentMovie: Movie;
  allMovies?: Movie[];
  title?: string;
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
    let genreToMatch: string[] = [];
    if (Array.isArray(currentMovie.genre)) {
      genreToMatch = currentMovie.genre;
    } else if (typeof currentMovie.genre === 'string' && currentMovie.genre) {
      genreToMatch = currentMovie.genre.split(', ').filter((g) => g && g.trim());
    }

    // Convert to lowercase for matching
    genreToMatch = genreToMatch.map((g) => g.toLowerCase().trim());

    // Find movies with similar genre
    const matchingMovies = otherMovies.filter((movie) => {
      if (!movie.genre) return false;

      let movieGenres: string[] = [];
      if (Array.isArray(movie.genre)) {
        movieGenres = movie.genre;
      } else if (typeof movie.genre === 'string' && movie.genre) {
        movieGenres = movie.genre.split(', ').filter((g) => g && g.trim());
      }

      // Convert to lowercase for matching
      movieGenres = movieGenres.map((g) => g.toLowerCase().trim());

      // Check if any genre matches
      return genreToMatch.some((matchGenre) =>
        movieGenres.some(
          (movieGenre) => movieGenre.includes(matchGenre) || matchGenre.includes(movieGenre)
        )
      );
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
              <MovieCard
                movie={movie}
                index={index}
                showPlayButton={true}
                showDetails={true}
                showStats={true}
                showDetailsOnMobile={true}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-black/50 text-white border-none hover:bg-black/80" />
        <CarouselNext className="right-2 bg-black/50 text-white border-none hover:bg-black/80" />
      </Carousel>
    </div>
  );
}
