import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Share,
  Clock,
  Calendar,
  Star,
  Users,
  Eye,
  Loader2,
} from 'lucide-react';
import { MoviePlayerClient } from '@/components/movies/movie-player-client';

interface WatchPageProps {
  params: { slug: string };
}

interface MovieData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  streamingUrl: string;
  poster?: string;
  backdrop?: string;
  duration?: number;
  year?: number;
  genre?: string[];
  rating?: number;
  director?: string;
  cast?: string[];
  qualities?: Array<{
    quality: string;
    url: string;
    bitrate: number;
  }>;
}

// Get movie data from database with S3 video URLs
async function getMovieForStreaming(slug: string): Promise<MovieData | null> {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL
        : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/movies/${slug}/video`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(`Failed to fetch movie: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.movie) {
      console.error('Invalid response format:', data);
      return null;
    }

    return data.movie;
  } catch (error) {
    console.error('Error fetching movie for streaming:', error);
    return null;
  }
}

// Loading component
function VideoPlayerSkeleton() {
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-netflix-red/10 absolute inset-0 animate-ping"></div>
          <Loader2 className="w-16 h-16 text-netflix-red animate-spin mx-auto relative" />
        </div>
        <p className="text-white/90 text-lg mt-4 font-medium">Loading video player...</p>
        <p className="text-white/60 text-sm mt-1">This may take a moment</p>
      </div>
    </div>
  );
}

// Stats component
function MovieStats({ movie }: { movie: MovieData }) {
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Helper function to ensure genre is treated correctly
  const getGenreDisplay = () => {
    if (!movie.genre) return 'N/A';
    return Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre;
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      {/* Year */}
      {movie.year && (
        <div className="flex items-center px-2 py-1 bg-white/5 rounded-md">
          <Calendar className="w-3.5 h-3.5 text-netflix-red mr-1.5" />
          <span className="text-white/90 text-xs font-medium">{movie.year}</span>
        </div>
      )}

      {/* Duration */}
      {movie.duration && (
        <div className="flex items-center px-2 py-1 bg-white/5 rounded-md">
          <Clock className="w-3.5 h-3.5 text-netflix-red mr-1.5" />
          <span className="text-white/90 text-xs font-medium">
            {formatDuration(movie.duration)}
          </span>
        </div>
      )}

      {/* Rating */}
      {movie.rating && (
        <div className="flex items-center px-2 py-1 bg-white/5 rounded-md">
          <Star className="w-3.5 h-3.5 text-yellow-500 mr-1.5 fill-current" />
          <span className="text-white/90 text-xs font-medium">{movie.rating}/10</span>
        </div>
      )}

      {/* Quality */}
      <div className="flex items-center px-2 py-1 bg-white/5 rounded-md">
        <Eye className="w-3.5 h-3.5 text-netflix-red mr-1.5" />
        <span className="text-white/90 text-xs font-medium">HD</span>
      </div>
    </div>
  );
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  const movie = await getMovieForStreaming(slug);

  if (!movie || !movie.streamingUrl) {
    notFound();
  }

  // Enhanced logging for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('🎬 Movie streaming data:', {
      id: movie.id,
      title: movie.title,
      streamingUrl:
        movie.streamingUrl.length > 100
          ? `${movie.streamingUrl.substring(0, 100)}...`
          : movie.streamingUrl,
      fullStreamingUrl: movie.streamingUrl, // Log the full URL for debugging
      hasQualities: Boolean(movie.qualities?.length),
      qualityCount: movie.qualities?.length || 0,
      hasPoster: Boolean(movie.poster),
      hasBackdrop: Boolean(movie.backdrop),
      qualities: movie.qualities?.map((q) => ({
        quality: q.quality,
        url: q.url.substring(0, 50) + '...',
      })),
    });
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background image with gradient overlay */}
      {movie.backdrop && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${movie.backdrop})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70" />
        </div>
      )}

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Header with back button and controls */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-black/40 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              href={`/movies/${movie.slug || movie.id}`}
              className="flex items-center space-x-2 text-white hover:text-netflix-red transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </Link>

            <div className="flex items-center space-x-3">
              <button
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                title="Share movie"
              >
                <Share className="w-5 h-5" />
              </button>
              <button
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                title="Download for offline viewing"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Video Player - Full width with minimal padding */}
        <section className="w-full py-4">
          <div className="max-w-6xl mx-auto px-0 sm:px-4">
            <Suspense fallback={<VideoPlayerSkeleton />}>
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/5">
                <MoviePlayerClient
                  src={movie.streamingUrl}
                  poster={movie.backdrop || movie.poster}
                  title={movie.title}
                  qualities={movie.qualities || []}
                />
              </div>
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}

// Enhanced metadata generation
export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieForStreaming(slug);

  if (!movie) {
    return {
      title: 'Movie Not Available | CinemaX',
      description: 'This movie is not available for streaming.',
      robots: 'noindex, nofollow',
    };
  }

  const title = `Watch ${movie.title} | CinemaX`;
  const description = movie.description
    ? `Stream ${movie.title} in HD quality. ${movie.description.substring(0, 150)}${movie.description.length > 150 ? '...' : ''}`
    : `Stream ${movie.title} in high quality on CinemaX.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: movie.backdrop
        ? [
            {
              url: movie.backdrop,
              width: 1920,
              height: 1080,
              alt: `${movie.title} backdrop`,
            },
          ]
        : undefined,
      type: 'video.movie',
      siteName: 'CinemaX',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: movie.backdrop ? [movie.backdrop] : undefined,
    },
    keywords: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre,
    authors: movie.director ? [{ name: movie.director }] : undefined,
  };
}

// Generate static params for better performance (optional)
export async function generateStaticParams() {
  // This would fetch your movie slugs from the database
  // For now, return empty array to generate pages on-demand
  return [];
}
