'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useWatchLimit } from '@/lib/hooks/use-watch-limit';
import { WatchLimitGate } from './watch-limit-gate';
import { VideoPlayer } from '@/components/video/video-player';

interface VideoPlayerWithResumeProps {
  movieId: string;
  streamingUrl: string;
  title: string;
  posterUrl?: string;
  qualities?: Array<{
    quality: string;
    url: string;
    bitrate: number;
  }>;
}

export function VideoPlayerWithResume({
  movieId,
  streamingUrl,
  title,
  posterUrl,
  qualities = [],
}: VideoPlayerWithResumeProps) {
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [watchHistoryId, setWatchHistoryId] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const { watchLimit, refetch: refetchWatchLimit } = useWatchLimit();
  
  // Fetch the user's watch history for this movie
  useEffect(() => {
    if (!isAuthenticated || !movieId) return;

    const fetchWatchHistory = async () => {
      try {
        const response = await fetch(`/api/watch/history`);
        if (!response.ok) return;
        
        const data = await response.json();
        const movieHistory = data.watchHistory?.find((h: any) => h.movieId === movieId);
        
        if (movieHistory) {
          setWatchHistoryId(movieHistory.id);
          setSavedProgress(movieHistory.progress);
          
          // Calculate the time to seek to based on the saved progress
          // The actual seeking will be handled by the VideoPlayer component
          if (movieHistory.progress > 0 && movieHistory.progress < 0.99) {
            // We'll pass this to the VideoPlayer component
            setInitialTime(movieHistory.progress);
          }
        }
      } catch (error) {
        console.error('Error fetching watch history:', error);
      }
    };

    fetchWatchHistory();
  }, [isAuthenticated, movieId]);

  // Update watch history as the user watches
  const updateWatchHistory = async (currentProgress: number, completed: boolean = false) => {
    if (!isAuthenticated || !movieId) return;

    try {
      const response = await fetch('/api/watch/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId,
          progress: currentProgress,
          completed,
          watchHistoryId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update watch history');
      }

      const data = await response.json();
      setWatchHistoryId(data.watchHistory.id);
      
      // If the movie was completed, refresh watch limit data
      if (completed) {
        refetchWatchLimit();
      }
    } catch (error) {
      console.error('Error updating watch history:', error);
    }
  };

  // Handle video progress updates
  const handleTimeUpdate = (time: number, duration: number) => {
    if (duration <= 0) return;
    
    const currentProgress = time / duration;
    
    // Update watch history every 10 seconds or when progress changes significantly
    if (Math.abs(currentProgress - savedProgress) > 0.05) {
      setSavedProgress(currentProgress);
      updateWatchHistory(currentProgress);
    }
  };

  const handleVideoEnded = () => {
    // Mark the video as completed when it ends
    updateWatchHistory(1.0, true);
  };

  // The VideoPlayer component already has built-in functionality to save and restore playback position
  // We just need to provide the movie ID through the title prop and handle the progress updates
  return (
    <WatchLimitGate>
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <VideoPlayer
          title={title}
          poster={posterUrl}
          qualities={qualities.length > 0 ? qualities : [{ quality: 'auto', url: streamingUrl, bitrate: 0 }]}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
        />
      </div>
    </WatchLimitGate>
  );
}
