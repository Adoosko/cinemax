'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Clock, Play, Info } from 'lucide-react';
import { Button } from '../ui/button';

interface Movie {
  id: string;
  slug: string;
  title: string;
  genre: string;
  duration: string;
  rating: number;
  releaseDate: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  showtimes: string[];
  featured?: boolean;
}

interface FeaturedMoviesClientProps {
  heroMovies: Movie[];
}

export function FeaturedMoviesClient({ heroMovies }: FeaturedMoviesClientProps) {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (heroMovies.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [heroMovies.length]);

  const currentMovie = heroMovies[currentHeroIndex] || {
    id: '1',
    slug: 'loading',
    title: 'Loading...',
    genre: 'Loading',
    duration: '0h 0m',
    rating: 0,
    releaseDate: '2024',
    description: 'Loading movie information...',
    posterUrl: '',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
    showtimes: [],
  };

  return (
    <section className="relative h-[80vh] overflow-hidden">
      {/* Background Image */}
      <div
        key={currentHeroIndex}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentMovie.backdropUrl})` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-6 lg:px-12">
        <div className="max-w-2xl">
          <h1
            key={`title-${currentHeroIndex}`}
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            {currentMovie.title}
          </h1>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-white font-semibold">{currentMovie.rating}</span>
            </div>
            <span className="text-white/80">{currentMovie.releaseDate}</span>
            <div className="flex items-center space-x-1 text-white/80">
              <Clock className="w-4 h-4" />
              <span>{currentMovie.duration}</span>
            </div>
          </div>

          <p className="text-white/90 text-xs md:text-sm lg:text-base leading-relaxed mb-8 max-w-xl">
            {currentMovie.description}
          </p>

          <div className="flex space-x-4">
            <Link href={`/movies/${currentMovie.slug}/watch`}>
              <Button variant={'premium'} size={'sm'}>
                Watch now
              </Button>
            </Link>

            <Link href={`/movies/${currentMovie.slug}`}>
              <Button size={'sm'}>
                <Info className="w-5 h-5" />
                <span>More Info</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Simple Dots Indicator */}
      {heroMovies.length > 1 && (
        <div className="absolute bottom-6 right-6 flex space-x-2">
          {heroMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentHeroIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
