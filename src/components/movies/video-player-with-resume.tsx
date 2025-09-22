'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useWatchLimit } from '@/lib/hooks/use-watch-limit';
import { WatchLimitGate } from './watch-limit-gate';
import { VideoPlayer } from '@/components/video/video-player';
import { WatchPartyOverlay } from '@/components/watch-party/watch-party-overlay';
import { useWatchParty } from '@/lib/hooks/use-watch-party';
import { useSearchParams } from 'next/navigation';

interface VideoPlayerWithResumeProps {
  movieId: string;
  streamingUrl: string;
  title: string;
  posterUrl?: string;
  className?: string; // Added className prop
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
  className = '',
  qualities = [],
}: VideoPlayerWithResumeProps) {
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [watchHistoryId, setWatchHistoryId] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { watchLimit, refetch: refetchWatchLimit } = useWatchLimit();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Watch party parameters
  const partyId = searchParams.get('party');
  const manualNickname = searchParams.get('nickname');

  // Generate nickname for authenticated users
  const generateNickname = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.name) {
      return user.name;
    } else if (user?.email) {
      return user.email.split('@')[0]; // Use part before @ in email
    }
    return 'Anonymous';
  };

  // Use manual nickname if provided, otherwise generate from user account
  const nickname = manualNickname || (isAuthenticated && user ? generateNickname(user) : null);
  const isInWatchParty = !!(partyId && nickname);

  // Enhanced video sync callback for immediate response to host controls
  const onVideoSync = useCallback(
    (data: { currentTime: number; isPlaying: boolean; playbackSpeed?: number }) => {
      if (!videoRef.current) return;

      console.log('🔄 Applying sync from host:', data);

      // CRITICAL FIX: Force sync time regardless of difference to ensure perfect sync
      console.log(`🎯 Seeking to host position: ${data.currentTime.toFixed(2)}s`);
      videoRef.current.currentTime = data.currentTime;

      // CRITICAL FIX: Always sync play state immediately with multiple attempts
      const syncPlayState = () => {
        if (data.isPlaying && videoRef.current?.paused) {
          console.log('▶️ Host is playing - starting playback');
          const playPromise = videoRef.current.play();

          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error('Failed to play on sync:', error);
              // Try again with user interaction simulation
              setTimeout(() => {
                if (videoRef.current) {
                  // Force user interaction to bypass autoplay restrictions
                  videoRef.current.muted = true;
                  videoRef.current
                    .play()
                    .then(() => {
                      videoRef.current!.muted = false;
                      console.log('Successfully started playback after retry');
                    })
                    .catch(console.error);
                }
              }, 100);
            });
          }
        } else if (!data.isPlaying && videoRef.current && !videoRef.current.paused) {
          console.log('⏸️ Host paused - pausing playback');
          videoRef.current.pause();
        }
      };

      // Execute sync immediately
      syncPlayState();

      // And also after a short delay to ensure it takes effect
      setTimeout(syncPlayState, 100);

      // Sync playback speed if provided
      if (data.playbackSpeed && videoRef.current.playbackRate !== data.playbackSpeed) {
        console.log(`🏃 Setting playback speed to ${data.playbackSpeed}x`);
        videoRef.current.playbackRate = data.playbackSpeed;
      }
    },
    []
  );

  // Watch party hook
  const {
    isConnected: isPartyConnected,
    participants,
    currentTime: partyCurrentTime,
    isPlaying: partyIsPlaying,
    syncVideo,
    sendMessage,
    sendReaction,
  } = useWatchParty({
    partyId: partyId || undefined,
    nickname: nickname || undefined,
    userId: user?.id, // Pass user ID to identify host
    onVideoSync,
  });

  // Determine if current user is the host
  const [isCurrentUserHost, setIsCurrentUserHost] = useState<boolean>(false);

  // Fetch watch party details to determine if current user is the host
  useEffect(() => {
    if (!partyId || !user?.id) return;

    const checkIfHost = async () => {
      try {
        const response = await fetch(`/api/watch-party/${partyId}`);
        if (!response.ok) return;

        const data = await response.json();
        const isHost = data.watchParty.host.id === user.id;

        console.log('🎮 Host check:', {
          userId: user.id,
          hostId: data.watchParty.host.id,
          isHost,
        });

        setIsCurrentUserHost(isHost);

        // CRITICAL FIX: If not host, request immediate sync from host
        if (!isHost && isPartyConnected) {
          console.log('🔄 Member joining - requesting immediate sync from host');
          // Send a special sync request that the host will respond to
          syncVideo({
            currentTime: 0, // Will be overridden by host's current time
            isPlaying: false, // Will be overridden by host's play state
            playbackSpeed: 1,
            requestSync: true, // Special flag to indicate this is a sync request
          });
        }
      } catch (error) {
        console.error('Error checking host status:', error);
      }
    };

    checkIfHost();
  }, [partyId, user?.id, isPartyConnected, syncVideo]);

  // Debug host detection
  console.log('🎮 Host detection:', {
    nickname,
    userId: user?.id,
    participants: participants.map((p) => ({ nickname: p.nickname, isHost: p.isHost })),
    isCurrentUserHost,
  });

  // Handle external play/pause for non-host users
  const handleExternalPlayPause = () => {
    // This should not be called for hosts, but just in case
    if (isCurrentUserHost) return;

    // Non-host users send a request to the host to control playback
    console.log('Non-host requested play/pause');
    if (videoRef.current) {
      const isCurrentlyPlaying = !videoRef.current.paused;
      // Send request to toggle playback state
      syncVideo({
        currentTime: videoRef.current.currentTime,
        isPlaying: !isCurrentlyPlaying, // Request opposite of current state
        playbackSpeed: videoRef.current.playbackRate,
      });
    }
  };

  // Handle external seek for non-host users
  const handleExternalSeek = (time: number) => {
    // This should not be called for hosts, but just in case
    if (isCurrentUserHost) return;

    // Non-host users send a seek request to the host
    console.log('Non-host requested seek to:', time);
    if (videoRef.current) {
      // Send request to seek to specific time
      syncVideo({
        currentTime: time,
        isPlaying: !videoRef.current.paused,
        playbackSpeed: videoRef.current.playbackRate,
      });
    }
  };

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

    // WATCH PARTY SYNC: Only hosts send sync updates during playback
    if (isInWatchParty && isPartyConnected && isCurrentUserHost && videoRef.current) {
      syncVideo({
        currentTime: videoRef.current.currentTime,
        isPlaying: !videoRef.current.paused,
        playbackSpeed: videoRef.current.playbackRate,
      });
    }

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
      <div className={`flex flex-col w-full relative ${className}`}>
        {/* Video Container - Ensured visibility with explicit z-index */}
        <div
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden z-10"
          id="video-container"
        >
          <VideoPlayer
            ref={videoRef}
            title={title}
            poster={posterUrl}
            qualities={
              qualities.length > 0
                ? qualities
                : [{ quality: 'auto', url: streamingUrl, bitrate: 0 }]
            }
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            isWatchParty={isInWatchParty}
            isHost={isCurrentUserHost}
            externalPlaying={partyIsPlaying}
            onPlayPause={handleExternalPlayPause}
            onSeek={handleExternalSeek}
          />
        </div>

        {/* Watch Party Overlay - Now positioned BELOW the video */}
        {isInWatchParty && (
          <WatchPartyOverlay
            partyId={partyId!}
            nickname={nickname!}
            movieTitle={title}
            isHost={isCurrentUserHost}
            userId={user?.id || ''}
            onLeaveParty={() => {
              // Navigate back to movie page without party params
              window.location.href = `/movies/${movieId}`;
            }}
          />
        )}
      </div>
    </WatchLimitGate>
  );
}
