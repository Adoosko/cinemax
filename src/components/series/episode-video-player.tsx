'use client';

import { VideoPlayer } from '@/components/video/video-player';
import { useAuth } from '@/lib/hooks/use-auth';
import { useWatchLimit } from '@/lib/hooks/use-watch-limit';
import { useEffect, useRef, useState } from 'react';
import { WatchLimitGate } from '../movies/watch-limit-gate';

interface EpisodeVideoPlayerProps {
  episodeId: string;
  seriesSlug: string;
  seasonNumber: number;
  episodeNumber: number;
  streamingUrl: string;
  title: string;
  posterUrl?: string;
  className?: string;
  qualities: Array<{
    quality: string;
    url: string;
    bitrate: number;
  }>;
  nextEpisode?: {
    id: string;
    number: number;
    title: string;
  };
  autoPlayNext?: boolean;
  onEpisodeEnd?: () => void;
}

export function EpisodeVideoPlayer({
  episodeId,
  seriesSlug,
  seasonNumber,
  episodeNumber,
  streamingUrl,
  title,
  posterUrl,
  className = '',
  qualities = [],
  nextEpisode,
  autoPlayNext = false,
  onEpisodeEnd,
}: EpisodeVideoPlayerProps) {
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [watchHistoryId, setWatchHistoryId] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState<number | null>(null);
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { watchLimit, refetch: refetchWatchLimit } = useWatchLimit();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch the user's episode watch history
  useEffect(() => {
    if (!isAuthenticated || !episodeId) return;

    const fetchWatchHistory = async () => {
      try {
        const response = await fetch(`/api/watch/episode-history`);
        if (!response.ok) return;

        const data = await response.json();
        const episodeHistory = data.watchHistory?.find((h: any) => h.episodeId === episodeId);

        if (episodeHistory) {
          setWatchHistoryId(episodeHistory.id);
          setSavedProgress(episodeHistory.progress);

          // Calculate the time to seek to based on the saved progress
          if (episodeHistory.progress > 0 && episodeHistory.progress < 0.99) {
            setInitialTime(episodeHistory.progress);
          }
        }
      } catch (error) {
        console.error('Error fetching episode watch history:', error);
      }
    };

    fetchWatchHistory();
  }, [isAuthenticated, episodeId]);

  // Update episode watch history as the user watches
  const updateWatchHistory = async (currentProgress: number, completed: boolean = false) => {
    if (!isAuthenticated || !episodeId) return;

    try {
      const response = await fetch('/api/watch/episode-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeId,
          progress: currentProgress,
          completed,
          watchHistoryId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update episode watch history');
      }

      const data = await response.json();
      setWatchHistoryId(data.watchHistory.id);

      // If the episode was completed, refresh watch limit data
      if (completed) {
        refetchWatchLimit();
      }
    } catch (error) {
      console.error('Error updating episode watch history:', error);
    }
  };

  // Handle video progress updates
  const handleTimeUpdate = (time: number, duration: number) => {
    if (duration <= 0) return;

    const currentProgress = time / duration;

    // Show next episode prompt when 90% through
    if (nextEpisode && currentProgress >= 0.9 && !showNextEpisodePrompt) {
      setShowNextEpisodePrompt(true);
    }

    // Update watch history every 10 seconds or when progress changes significantly
    if (Math.abs(currentProgress - savedProgress) > 0.05) {
      setSavedProgress(currentProgress);
      updateWatchHistory(currentProgress);
    }
  };

  const handleVideoEnded = () => {
    // Mark the episode as completed when it ends
    updateWatchHistory(1.0, true);

    if (autoPlayNext && nextEpisode) {
      // Auto-play next episode after a short delay
      setTimeout(() => {
        window.location.href = `/series/${seriesSlug}/season/${seasonNumber}/episode/${nextEpisode.number}`;
      }, 5000);
    } else if (onEpisodeEnd) {
      onEpisodeEnd();
    }
  };

  return (
    <WatchLimitGate>
      <div className={`flex flex-col w-full relative ${className}`}>
        {/* Video Container */}
        <div
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/5 z-10"
          id="episode-video-container"
        >
          <VideoPlayer
            ref={videoRef}
            title={title}
            poster={posterUrl}
            qualities={qualities}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
          />

          {/* Seek to initial time when video loads */}
          {initialTime && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  document.addEventListener('DOMContentLoaded', function() {
                    const video = document.querySelector('video');
                    if (video) {
                      video.addEventListener('loadedmetadata', function() {
                        video.currentTime = ${initialTime};
                      });
                    }
                  });
                `,
              }}
            />
          )}
        </div>

        {/* Next Episode Prompt */}
        {showNextEpisodePrompt && nextEpisode && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-white text-xl font-bold mb-2">Up Next</h3>
              <p className="text-gray-300 mb-4">
                Episode {nextEpisode.number}: {nextEpisode.title}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowNextEpisodePrompt(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Keep Watching
                </button>
                <a
                  href={`/series/${seriesSlug}/season/${seasonNumber}/episode/${nextEpisode.number}`}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Play Next Episode
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </WatchLimitGate>
  );
}
