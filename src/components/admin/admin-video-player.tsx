'use client';

import { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/video/video-player';
import { AlertCircle, Loader2 } from 'lucide-react';

interface VideoQuality {
  quality: string;
  url: string;
  bitrate: number;
}

interface AdminVideoPlayerProps {
  movieSlug: string;
  movieTitle?: string;
  initialQuality?: string;
  className?: string;
}

export function AdminVideoPlayer({
  movieSlug,
  movieTitle,
  initialQuality = '1080p',
  className = '',
}: AdminVideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideoData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch video data using the API
        const response = await fetch(
          `/api/admin/videos/upload?videoId=${movieSlug}&quality=${initialQuality}&allQualities=true&presigned=true`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch video data');
        }

        const data = await response.json();

        // Set video URL and poster URL
        setVideoUrl(data.videoUrl);
        setPosterUrl(data.posterUrl || null);

        // If we have multiple qualities from the API, use them
        if (data.availableQualities && data.availableQualities.length > 0) {
          setQualities(data.availableQualities);
        } else {
          // Create a single quality option with the fetched URL
          setQualities([
            {
              quality: initialQuality.toUpperCase(),
              url: data.videoUrl,
              bitrate: getEstimatedBitrate(initialQuality),
            },
          ]);
        }

        // Check if the video actually exists by making a HEAD request
        try {
          const headResponse = await fetch(data.videoUrl, {
            method: 'HEAD',
            // Avoid CORS issues with credentials
            credentials: 'omit',
            // Add cache control to avoid cached responses
            cache: 'no-cache',
          });

          if (!headResponse.ok) {
            throw new Error(`Video file not found (${initialQuality})`);
          }

          // Check if the content type is a video format
          const contentType = headResponse.headers.get('content-type');
          if (contentType && !contentType.startsWith('video/')) {
            throw new Error(`Invalid content type: ${contentType}`);
          }
        } catch (headError) {
          console.warn('Video file may not exist:', headError);
          // We'll still try to play it, but log the warning
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    }

    fetchVideoData();
  }, [movieSlug, initialQuality]);

  // Helper function to estimate bitrate based on quality
  function getEstimatedBitrate(quality: string): number {
    switch (quality.toLowerCase()) {
      case '4k':
        return 15000;
      case '1080p':
        return 8000;
      case '720p':
        return 5000;
      case '480p':
        return 2500;
      default:
        return 5000;
    }
  }

  if (loading) {
    return (
      <div
        className={`bg-neutral-900 rounded-lg flex items-center justify-center aspect-video ${className}`}
      >
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-netflix-red animate-spin mb-4" />
          <p className="text-white">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div
        className={`bg-neutral-900 rounded-lg flex items-center justify-center aspect-video ${className}`}
      >
        <div className="flex flex-col items-center text-center p-6">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <p className="text-white mb-2">Failed to load video</p>
          <p className="text-gray-400 text-sm max-w-md">
            {error ||
              'The video could not be loaded. It may not exist or you may not have permission to view it.'}
          </p>
          <div className="mt-4 p-3 bg-neutral-800 rounded-lg text-left">
            <p className="text-yellow-400 text-xs mb-1">Expected video path:</p>
            <code className="text-xs text-green-400 block">
              videos/{movieSlug}/{initialQuality}.mp4
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={videoUrl}
      poster={posterUrl || undefined}
      title={movieTitle || `${movieSlug} (${initialQuality})`}
      qualities={qualities}
      className={`aspect-video ${className}`}
    />
  );
}
