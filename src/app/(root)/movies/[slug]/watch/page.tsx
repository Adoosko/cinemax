import { CachedMovieVideoData } from '@/components/movies/cached-movie-data';
import { VideoPlayerWithResume } from '@/components/movies/video-player-with-resume';
import { auth } from '@/lib/auth';
import { ArrowLeft, Loader2, Share } from 'lucide-react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

// Force dynamic rendering for watch pages (authentication required)
export const dynamic = 'force-dynamic';

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
async function getMovieForStreaming(
  slug: string,
  useDirect: boolean = true
): Promise<MovieData | null> {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL
        : 'http://localhost:3000';

    // Add direct=true parameter to use direct URLs instead of presigned URLs
    const url = useDirect
      ? `${baseUrl}/api/movies/${slug}/video?direct=true`
      : `${baseUrl}/api/movies/${slug}/video`;

    console.log(`Fetching movie data from: ${url}`);

    const response = await fetch(url, {
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

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;

  // Check if user is authenticated using server-side auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session) {
    // Redirect to sign in page with callback URL to return after login
    redirect(`/signin?callbackUrl=/movies/${slug}/watch`);
  }

  // Use cached data for movie video
  const { videoData: movie } = await CachedMovieVideoData({ slug });

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
      qualities: movie.qualities?.map((q: any) => ({
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
            </div>
          </div>
        </header>

        {/* Video Player - Full width with minimal padding */}
        <section className="w-full py-4">
          <div className="max-w-6xl mx-auto px-0 sm:px-4">
            <Suspense fallback={<VideoPlayerSkeleton />}>
              {/* CRITICAL FIX: Ensured video player visibility with explicit z-index and styling */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/5 relative z-10">
                <VideoPlayerWithResume
                  movieId={movie.id}
                  streamingUrl={movie.streamingUrl}
                  title={movie.title}
                  posterUrl={movie.backdrop || movie.poster}
                  qualities={movie.qualities || []}
                  className="!block !visible" /* Force visibility */
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
