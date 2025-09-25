'use client';

import { VideoPlayer } from '@/components/video/video-player';
import { useSubscriptionContext } from '@/lib/contexts/subscription-context';
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
  episodes?: Array<{
    id: string;
    number: number;
    title: string;
  }>;
  currentEpisodeId?: string;
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
  episodes = [],
  currentEpisodeId,
}: EpisodeVideoPlayerProps) {
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [watchHistoryId, setWatchHistoryId] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState<number | null>(null);
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { watchLimit, refetch: refetchWatchLimit } = useWatchLimit();
  const { subscription } = useSubscriptionContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if user has active subscription (skip watch limits)
  const hasActiveSubscription = subscription?.status === 'ACTIVE';

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

    // Show next episode prompt only when episode is fully ending
    // This will be handled in handleVideoEnded instead

    // Update watch history every 10 seconds or when progress changes significantly
    if (Math.abs(currentProgress - savedProgress) > 0.05) {
      setSavedProgress(currentProgress);
      updateWatchHistory(currentProgress);
    }
  };

  // Countdown effect
  useEffect(() => {
    if (showNextEpisodePrompt && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showNextEpisodePrompt && countdown === 0 && nextEpisode) {
      // Auto-advance when countdown reaches 0
      window.location.href = `/series/${seriesSlug}/season/${seasonNumber}/episode/${nextEpisode.number}`;
    }
  }, [showNextEpisodePrompt, countdown, nextEpisode, seriesSlug, seasonNumber]);

  const handleVideoEnded = () => {
    // Mark the episode as completed when it ends
    updateWatchHistory(1.0, true);

    // Show next episode prompt only when episode is fully watched
    if (nextEpisode && !showNextEpisodePrompt) {
      setShowNextEpisodePrompt(true);
      setCountdown(10); // Start countdown from 10 seconds
    } else if (onEpisodeEnd) {
      onEpisodeEnd();
    }
  };

  // Conditionally render WatchLimitGate based on subscription status
  const videoContent = (
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

        {/* Episode List Toggle Button */}
        {episodes.length > 1 && (
          <button
            onClick={() => setShowEpisodeList(!showEpisodeList)}
            className="absolute top-4 left-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium transition-all duration-200 z-20"
            aria-label="Toggle episode list"
          >
            Episodes
          </button>
        )}

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

      {/* Next Episode Overlay */}
      {showNextEpisodePrompt && nextEpisode && (
        <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-sm z-40 shadow-2xl">
          <div className="flex gap-3">
            {/* Episode Preview */}
            <div className="flex-shrink-0">
              <div className="w-16 h-12 bg-gray-800 rounded overflow-hidden">
                <img
                  src={
                    posterUrl ||
                    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop'
                  }
                  alt={nextEpisode.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Episode Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-netflix-red text-sm font-medium">Up Next</span>
                <div className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{countdown}</span>
                </div>
              </div>
              <h4 className="text-white text-sm font-semibold truncate mb-1">
                Episode {nextEpisode.number}: {nextEpisode.title}
              </h4>
              <p className="text-white/60 text-xs">
                Auto-playing in {countdown} second{countdown !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowNextEpisodePrompt(false)}
              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
            >
              Cancel
            </button>
            <a
              href={`/series/${seriesSlug}/season/${seasonNumber}/episode/${nextEpisode.number}`}
              className="flex-1 px-3 py-2 bg-netflix-red hover:bg-red-700 text-white text-sm rounded text-center transition-colors"
            >
              Play Now
            </a>
          </div>
        </div>
      )}

      {/* Episode List Overlay */}
      {showEpisodeList && episodes.length > 1 && (
        <div className="absolute top-16 left-4 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg max-h-80 overflow-y-auto z-30 min-w-80">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Season {seasonNumber}</h3>
              <button
                onClick={() => setShowEpisodeList(false)}
                className="text-white/60 hover:text-white text-sm"
                aria-label="Close episode list"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {episodes.map((episode) => (
                <a
                  key={episode.id}
                  href={`/series/${seriesSlug}/season/${seasonNumber}/episode/${episode.number}`}
                  className={`block p-3 rounded-lg transition-colors ${
                    episode.id === currentEpisodeId
                      ? 'bg-netflix-red/20 border border-netflix-red/50'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        episode.id === currentEpisodeId
                          ? 'bg-netflix-red text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {episode.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium truncate ${
                          episode.id === currentEpisodeId ? 'text-netflix-red' : 'text-white'
                        }`}
                      >
                        {episode.title}
                      </div>
                      <div className="text-white/60 text-xs">
                        Episode {episode.number}
                        {episode.id === currentEpisodeId && ' • Now Playing'}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Premium users skip watch limit gate entirely
  if (hasActiveSubscription) {
    return videoContent;
  }

  // Regular users go through watch limit gate
  return <WatchLimitGate>{videoContent}</WatchLimitGate>;
}
