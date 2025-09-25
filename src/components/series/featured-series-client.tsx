'use client';

import { Info, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

interface Series {
  id: string;
  slug: string;
  title: string;
  genre: string;
  releaseYear: string;
  description: string;
  coverUrl: string;
  backdropUrl: string;
  seasonsCount: number;
  totalEpisodes: number;
  rating: string;
  cast: string[];
  director: string;
  featured: boolean;
}

interface FeaturedSeriesClientProps {
  heroSeries: Series[];
}

export function FeaturedSeriesClient({ heroSeries }: FeaturedSeriesClientProps) {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (heroSeries.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroSeries.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [heroSeries.length]);

  const currentSeries = heroSeries[currentHeroIndex] || {
    id: '1',
    slug: 'loading',
    title: 'Loading...',
    genre: 'Loading',
    releaseYear: '2024',
    description: 'Loading series information...',
    coverUrl: '',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
    seasonsCount: 0,
    totalEpisodes: 0,
    rating: 'TV-14',
    cast: [],
    director: '',
    featured: false,
  };

  return (
    <section className="relative h-[80vh] overflow-hidden">
      {/* Background Image */}
      <div
        key={currentHeroIndex}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentSeries.backdropUrl})` }}
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
            {currentSeries.title}
          </h1>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-white font-semibold">{currentSeries.rating}</span>
            </div>
            <span className="text-white/80">{currentSeries.releaseYear}</span>
            <span className="text-white/80">
              {currentSeries.seasonsCount} Season{currentSeries.seasonsCount !== 1 ? 's' : ''}
            </span>
            <span className="text-white/80">{currentSeries.totalEpisodes} Episodes</span>
          </div>

          <p className="text-white/90 text-xs md:text-sm lg:text-base leading-relaxed mb-8 max-w-xl">
            {currentSeries.description}
          </p>

          <div className="flex space-x-4">
            <Link href={`/series/${currentSeries.slug}`}>
              <Button variant={'premium'} size={'sm'}>
                Watch now
              </Button>
            </Link>

            <Link href={`/series/${currentSeries.slug}`}>
              <Button size={'sm'}>
                <Info className="w-5 h-5" />
                <span>More Info</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Simple Dots Indicator */}
      {heroSeries.length > 1 && (
        <div className="absolute bottom-6 right-6 flex space-x-2">
          {heroSeries.map((_, index) => (
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
