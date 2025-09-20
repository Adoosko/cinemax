'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SimilarMovies } from './similar-movies';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Calendar, Clock, Play, Heart, Share, Users, ArrowLeft } from 'lucide-react';

// Import the Movie type from the cached data
import { type Movie as CachedMovie } from '@/lib/data/movies-with-use-cache';

// Use the imported type with additional properties
export type Movie = CachedMovie & {
  // Add any additional properties needed by this component
  showtimes?: Record<
    string,
    Array<{
      id: string;
      time: string;
      startTime: string;
      endTime: string;
      theater: string;
      cinema: string;
      price: number;
      available: number;
    }>
  >;
};

interface MovieDetailClientProps {
  movie: Movie;
  allMovies?: Movie[];
}

export function MovieDetailClient({ movie, allMovies = [] }: MovieDetailClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Set default selected date when component mounts
  useEffect(() => {
    if (movie && movie.showtimes && !selectedDate) {
      const availableDates = Object.keys(movie.showtimes);
      if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      }
    }
  }, [movie, selectedDate]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: movie.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would typically make an API call to save the favorite status
  };

  const availableDates = Object.keys(movie.showtimes || {});
  const selectedShowtimes = selectedDate ? movie.showtimes[selectedDate] || [] : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[60vh] lg:h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.backdropUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/60 to-netflix-black/20" />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-20 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 z-20 flex space-x-3">
          <button
            onClick={toggleFavorite}
            className={`bg-black/50 backdrop-blur-sm p-3 rounded-full hover:bg-black/70 transition-colors ${
              isFavorite ? 'text-netflix-red' : 'text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-colors"
          >
            <Share className="w-5 h-5" />
          </button>
        </div>

        {/* Movie Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">{movie.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-white font-semibold">{movie.rating}</span>
              </div>
              <span className="text-netflix-text-gray">{movie.releaseDate}</span>
              <div className="flex items-center space-x-1 text-netflix-text-gray">
                <Clock className="w-4 h-4" />
                <span>{movie.duration}</span>
              </div>
              <span className="px-3 py-1 bg-netflix-medium-gray text-white text-sm rounded">
                {movie.genre}
              </span>
            </div>

            <div className="text-white/80 text-lg lg:text-xl max-w-3xl mb-8">
              {movie.description}
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              {/* Primary Action - Watch Full Movie or Book Tickets */}
              {movie.streamingUrl ? (
                <Link href={`/movies/${movie.slug}/watch`}>
                  <button className="bg-white hover:bg-gray-200 text-black px-8 py-3 font-bold transition-colors w-full sm:w-auto flex items-center justify-center rounded-lg">
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Watch Now
                  </button>
                </Link>
              ) : (
                <Link href={`/movies/${movie.slug}/book`}>
                  <button className="bg-white hover:bg-gray-200 text-black px-8 py-3 font-bold transition-colors w-full sm:w-auto flex items-center justify-center rounded-lg">
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Book Tickets
                  </button>
                </Link>
              )}

              {/* Trailer Button - Always show */}
              <button
                onClick={() => {
                  if (movie.trailerUrl) {
                    window.open(movie.trailerUrl, '_blank');
                  } else {
                    // Fallback: search for trailer on YouTube
                    const searchQuery = encodeURIComponent(
                      `${movie.title} ${movie.releaseDate} trailer`
                    );
                    window.open(
                      `https://www.youtube.com/results?search_query=${searchQuery}`,
                      '_blank'
                    );
                  }
                }}
                className="bg-netflix-red/80 hover:bg-netflix-red text-white px-6 py-3 font-semibold transition-colors flex items-center justify-center rounded-lg border border-netflix-red/50"
                title={movie.trailerUrl ? 'Watch Official Trailer' : 'Search for Trailer'}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Trailer
              </button>

              {/* Book Cinema (if streaming is available) */}
              {movie.streamingUrl && (
                <Link href={`/movies/${movie.slug}/book`}>
                  <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 font-semibold transition-colors flex items-center justify-center rounded-lg">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Cinema
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes Section */}
      {availableDates.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Showtimes</h2>

          {/* Date Selector */}
          <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
            {availableDates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 px-6 py-3 rounded-lg transition-colors ${
                  selectedDate === date
                    ? 'bg-netflix-red text-white'
                    : 'bg-netflix-medium-gray text-netflix-text-gray hover:bg-netflix-light-gray'
                }`}
              >
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {new Date(date).toLocaleDateString('en-US', { day: 'numeric' })}
                  </div>
                  <div className="text-xs">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Showtimes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {selectedShowtimes.map((showtime) => (
              <Link
                key={showtime.id}
                href={`/movies/${movie.slug}/book?showtime=${showtime.id}&date=${selectedDate}`}
              >
                <div className="bg-netflix-medium-gray hover:bg-netflix-light-gray transition-colors p-4 rounded-lg text-center">
                  <div className="text-white font-semibold text-lg mb-1">{showtime.startTime}</div>
                  <div className="text-netflix-text-gray text-sm mb-2">{showtime.theater}</div>
                  <div className="text-netflix-text-gray text-xs mb-2">
                    <Users className="w-3 h-3 inline mr-1" />
                    {showtime.available} seats
                  </div>
                  <div className="text-white font-semibold">${showtime.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Movie Details */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Cast & Crew */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-4">Cast & Crew</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-netflix-text-gray w-20">Director:</span>
                <span className="text-white">{movie.director}</span>
              </div>
              <div className="flex">
                <span className="text-netflix-text-gray w-20">Cast:</span>
                <span className="text-white">{movie.cast.join(', ')}</span>
              </div>
              <div className="flex">
                <span className="text-netflix-text-gray w-20">Genres:</span>
                <span className="text-white">{movie.genreArray.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Reviews */}
          {movie.reviews && movie.reviews.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Reviews ({movie.reviews.length})
              </h3>
              <div className="space-y-4">
                {movie.reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="bg-netflix-medium-gray p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{review.user.name}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-white">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && <p className="text-netflix-text-gray">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-netflix-medium-gray p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">Movie Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-netflix-text-gray">Release Date:</span>
                <span className="text-white ml-2">{movie.releaseDate}</span>
              </div>
              <div>
                <span className="text-netflix-text-gray">Duration:</span>
                <span className="text-white ml-2">{movie.duration}</span>
              </div>
              <div>
                <span className="text-netflix-text-gray">Rating:</span>
                <span className="text-white ml-2">{movie.rating}/10</span>
              </div>
              {movie.averageReview && (
                <div>
                  <span className="text-netflix-text-gray">User Rating:</span>
                  <span className="text-white ml-2">{movie.averageReview}/5</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Movies Section */}
      <div className="bg-netflix-black">
        <div className="container mx-auto px-4">
          <SimilarMovies currentMovie={movie} allMovies={allMovies} />
        </div>
      </div>
    </div>
  );

}
