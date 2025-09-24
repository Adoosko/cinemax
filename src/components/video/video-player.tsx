'use client';

import { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  Minimize,
  RotateCcw,
  AlertTriangle,
  FastForward,
  Rewind,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface VideoQuality {
  quality: string;
  url: string;
  bitrate: number;
}

interface VideoPlayerProps {
  title?: string;
  poster?: string;
  qualities?: VideoQuality[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
  // Watch party props
  isWatchParty?: boolean;
  isHost?: boolean;
  externalPlaying?: boolean;
  onPlayPause?: () => void;
  onSeek?: (time: number) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      title,
      poster,
      qualities = [],
      onTimeUpdate,
      onEnded,
      className = '',
      isWatchParty,
      isHost,
      externalPlaying,
      onPlayPause,
      onSeek,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const volumeRef = useRef<HTMLDivElement>(null);
    const mouseActivityRef = useRef<NodeJS.Timeout | null>(null);
    const saveTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // State management
    const [isReady, setIsReady] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string>('');
    const [currentQuality, setCurrentQuality] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [showKeyboardHint, setShowKeyboardHint] = useState(false);
    const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isMouseInactive, setIsMouseInactive] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Available playback speeds
    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    // Filter only available qualities
    const availableQualities = qualities.filter((q) => q.url && q.url.trim() !== '');

    // Mobile detection
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get unique video ID for saving progress
    const getVideoId = useCallback(() => {
      if (!title) return null;
      // Create unique ID from title and quality
      return `video_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${currentQuality}`;
    }, [title, currentQuality]);

    // Load saved position - FIXED
    const loadSavedPosition = useCallback(() => {
      const videoId = getVideoId();
      if (!videoId) return 0;

      try {
        const saved = localStorage.getItem(`video-position-${videoId}`);
        const position = saved ? parseFloat(saved) : 0;
        console.log('Loading saved position:', position);
        return position;
      } catch (error) {
        console.error('Error loading saved position:', error);
        return 0;
      }
    }, [getVideoId]);

    // Save current position - FIXED
    const saveCurrentPosition = useCallback(() => {
      const videoId = getVideoId();
      const video = videoRef.current;

      if (!videoId || !video) return;

      try {
        const currentTime = video.currentTime;
        const duration = video.duration;

        // Only save if video has meaningful progress (more than 10 seconds and not near the end)
        if (currentTime > 10 && duration > 0 && currentTime < duration - 30) {
          localStorage.setItem(`video-position-${videoId}`, currentTime.toString());
          console.log('Position saved:', currentTime);
        }
      } catch (error) {
        console.error('Error saving position:', error);
      }
    }, [getVideoId]);

    // Initialize video source with saved position
    useEffect(() => {
      if (availableQualities.length === 0) {
        console.warn('No available qualities provided to VideoPlayer');
        setVideoError('No video qualities available');
        return;
      }

      const getBestQuality = () => {
        const qualityOrder = ['4K', '1080P', '720P', '480P'];
        const videoId = getVideoId();

        if (videoId) {
          const saved = localStorage.getItem(`video-quality-${videoId}`);
          if (saved) {
            const found = availableQualities.find(
              (q) => q.quality.toUpperCase() === saved.toUpperCase()
            );
            if (found) return found;
          }
        }

        for (const preferred of qualityOrder) {
          const found = availableQualities.find((q) => q.quality.toUpperCase() === preferred);
          if (found) return found;
        }

        return availableQualities[0];
      };

      const selectedQuality = getBestQuality();
      console.log(`Selected quality: ${selectedQuality.quality}`);

      setCurrentQuality(selectedQuality.quality);
      setCurrentSrc(selectedQuality.url);
      setIsReady(true);

      // Load saved playback speed
      const videoId = getVideoId();
      if (videoId) {
        const savedSpeed = localStorage.getItem(`video-speed-${videoId}`);
        if (savedSpeed) {
          const speed = parseFloat(savedSpeed);
          if (speedOptions.includes(speed)) {
            setPlaybackSpeed(speed);
          }
        }
      }
    }, [availableQualities, getVideoId]);

    // FIXED: Auto-save position periodically when playing
    useEffect(() => {
      if (!isPlaying) return;

      // Save position every 15 seconds while playing
      const interval = setInterval(() => {
        saveCurrentPosition();
      }, 15000);

      return () => {
        clearInterval(interval);
      };
    }, [isPlaying, saveCurrentPosition]);

    // Refresh URLs when they're about to expire
    const refreshVideoUrl = useCallback(
      async (quality: string) => {
        if (!title) return null;

        try {
          const slug = title.toLowerCase().replace(/\s+/g, '-');
          const response = await fetch(`/api/movies/${slug}/presigned?quality=${quality}`);

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          if (data.success && data.url) {
            console.log(`Refreshed URL for ${quality}`);
            return data.url;
          }

          throw new Error('Invalid response');
        } catch (error) {
          console.error(`Failed to refresh URL for ${quality}:`, error);
          return null;
        }
      },
      [title]
    );

    //  auto-hide controls - FIXED
    const resetControlsTimeout = useCallback(() => {
      // Clear existing timeouts
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      if (mouseActivityRef.current) {
        clearTimeout(mouseActivityRef.current);
        mouseActivityRef.current = null;
      }

      // Always show controls initially
      setShowControls(true);
      setIsMouseInactive(false);

      // Only hide controls if video is playing and no menus are open
      if (isPlaying && !showQualityMenu && !showSpeedMenu && !videoError && !isLoading) {
        console.log('⏰ Setting auto-hide timeout for controls (', isMobile ? 4000 : 3000, 'ms )');

        controlsTimeoutRef.current = setTimeout(
          () => {
            console.log('👁️ Auto-hiding controls');
            setShowControls(false);
          },
          isMobile ? 4000 : 3000
        );

        mouseActivityRef.current = setTimeout(
          () => {
            console.log('🐭 Setting mouse inactive');
            setIsMouseInactive(true);
          },
          isMobile ? 3000 : 2000
        );
      } else {
        console.log('❌ Not setting auto-hide timeout - conditions not met');
      }
    }, [
      isPlaying,
      showQualityMenu,
      showSpeedMenu,
      isKeyboardFocused,
      videoError,
      isLoading,
      isMobile,
    ]);

    // Enhanced mouse controls - FIXED
    useEffect(() => {
      const container = containerRef.current;
      const video = videoRef.current;
      if (!container || !video) return;

      let lastX = 0;
      let lastY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const movementThreshold = isMobile ? 10 : 5;

        if (
          Math.abs(e.clientX - lastX) > movementThreshold ||
          Math.abs(e.clientY - lastY) > movementThreshold
        ) {
          lastX = e.clientX;
          lastY = e.clientY;

          // Only reset controls if no menus are open
          if (!showQualityMenu && !showSpeedMenu) {
            console.log('Mouse moved, resetting controls timeout');
            resetControlsTimeout();
          }
        }
      };

      const handleMouseEnter = () => {
        resetControlsTimeout();
      };

      const handleMouseLeave = () => {
        if (!showQualityMenu && !showSpeedMenu && isPlaying && !isKeyboardFocused) {
          setShowControls(false);
          setIsMouseInactive(true);
        }
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, [
      resetControlsTimeout,
      showQualityMenu,
      showSpeedMenu,
      isPlaying,
      isKeyboardFocused,
      isMobile,
    ]);

    // Fullscreen change handler
    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Video event handlers with position restoration
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !isReady) return;

      let positionRestored = false;

      const handleTimeUpdate = () => {
        if (!isSeeking && !isMouseDown) {
          const time = video.currentTime;
          setCurrentTime(time);
          onTimeUpdate?.(time, video.duration || 0);
        }
      };

      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
        setDuration(video.duration || 0);
        setVideoError(null);
        setIsLoading(false);
        video.playbackRate = playbackSpeed;

        // Restore saved position - FIXED
        // WATCH PARTY: Skip resume prompts for watch party members (live sync takes priority)
        if (!positionRestored) {
          if (isWatchParty) {
            // In watch party, always start from beginning and let sync handle positioning
            console.log('🎬 Watch party mode: skipping resume prompt, waiting for sync');
            video.currentTime = 0;
            setCurrentTime(0);
          } else {
            const savedPosition = loadSavedPosition();
            if (savedPosition > 0 && savedPosition < video.duration - 30) {
              console.log('Found saved position, showing prompt:', savedPosition);
              setShowResumePrompt(true);
            } else {
              // If no significant saved position, ensure playback starts from the beginning
              video.currentTime = 0;
              setCurrentTime(0);
            }
          }
          positionRestored = true;
        }
      };

      const handleLoadedData = () => {
        setIsLoading(false);
        setIsBuffering(false);
        video.playbackRate = playbackSpeed;
      };

      const handleCanPlay = () => {
        setIsLoading(false);
        setIsBuffering(false);
        video.playbackRate = playbackSpeed;
      };

      const handlePlay = () => {
        setIsPlaying(true);
        console.log('Video started playing, resetting controls timeout');
        resetControlsTimeout();
        video.playbackRate = playbackSpeed;
      };

      const handlePause = () => {
        setIsPlaying(false);
        setShowControls(true);
        setIsMouseInactive(false);
        saveCurrentPosition(); // Save position when paused

        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = null;
        }
        if (mouseActivityRef.current) {
          clearTimeout(mouseActivityRef.current);
          mouseActivityRef.current = null;
        }
      };

      const handleWaiting = () => setIsBuffering(true);
      const handlePlaying = () => {
        setIsBuffering(false);
        setIsLoading(false);
        video.playbackRate = playbackSpeed;
      };

      const handleLoadStart = () => setIsLoading(true);
      const handleSeeking = () => setIsBuffering(true);
      const handleSeeked = () => {
        setIsBuffering(false);
        setIsSeeking(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(duration);
        setShowControls(true);
        setIsMouseInactive(false);
        saveCurrentPosition();
        onEnded?.();
      };

      const handleError = (e: Event) => {
        const videoElement = e.target as HTMLVideoElement;
        const error = videoElement.error;

        console.error('Video error:', {
          code: error?.code,
          message: error?.message,
        });

        setIsLoading(false);
        setIsBuffering(false);

        let message = 'Unable to play video';
        switch (error?.code) {
          case 1:
            message = 'Video loading was stopped';
            break;
          case 2:
            message = 'Network error - please check your connection';
            break;
          case 3:
            message = 'Video format not supported';
            break;
          case 4:
            message = 'Video source not available - URL may have expired';
            break;
          default:
            message = error?.message || 'Unknown playback error';
        }

        setVideoError(message);
      };

      const events = [
        ['timeupdate', handleTimeUpdate],
        ['loadedmetadata', handleLoadedMetadata],
        ['loadeddata', handleLoadedData],
        ['canplay', handleCanPlay],
        ['play', handlePlay],
        ['pause', handlePause],
        ['waiting', handleWaiting],
        ['playing', handlePlaying],
        ['loadstart', handleLoadStart],
        ['seeking', handleSeeking],
        ['seeked', handleSeeked],
        ['ended', handleEnded],
        ['error', handleError],
      ] as const;

      events.forEach(([event, handler]) => {
        video.addEventListener(event, handler as EventListener);
      });

      return () => {
        events.forEach(([event, handler]) => {
          video.removeEventListener(event, handler as EventListener);
        });
      };
    }, [
      isReady,
      isSeeking,
      isMouseDown,
      onTimeUpdate,
      onEnded,
      resetControlsTimeout,
      duration,
      playbackSpeed,
      loadSavedPosition,
      saveCurrentPosition,
    ]);

    // Sync with external playing state for watch party
    useEffect(() => {
      if (!isWatchParty || externalPlaying === undefined) return;

      const video = videoRef.current;
      if (!video) return;

      // Only sync if there's a significant difference (>1 second)
      const shouldBePlaying = externalPlaying;
      const isCurrentlyPlaying = !video.paused;

      if (shouldBePlaying !== isCurrentlyPlaying) {
        if (shouldBePlaying) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }
    }, [externalPlaying, isWatchParty]);

    // Save position on page unload
    useEffect(() => {
      const handleBeforeUnload = () => {
        saveCurrentPosition();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        saveCurrentPosition(); // Save when component unmounts
      };
    }, [saveCurrentPosition]);

    // Control functions
    const togglePlay = async () => {
      console.log('Toggle play called, isWatchParty:', isWatchParty, 'isHost:', isHost);

      // WATCH PARTY CONTROL LOCK: Only hosts can control video playback
      // Non-host members are completely locked out of video controls
      if (isWatchParty && !isHost) {
        console.log('🔒 Non-host member blocked from video control - host-only mode');
        return; // Block all video control for non-host members
      }

      const video = videoRef.current;
      if (!video) {
        console.error('Video element not found');
        return;
      }

      try {
        if (isPlaying) {
          console.log('Pausing video');
          await video.pause();
        } else {
          console.log('Playing video, current src:', video.src);
          setIsLoading(true);

          // First, make sure video has a valid source
          if (!video.src) {
            console.error('Video has no source');
            setVideoError('Video source not available');
            setIsLoading(false);
            return;
          }

          // Force play with user interaction
          try {
            // First attempt - normal play
            await video.play();
            console.log('Video playback started successfully');
          } catch (err) {
            console.error('First playback attempt failed:', err);

            try {
              // Second attempt - try with user interaction simulation
              const userEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
              });
              video.dispatchEvent(userEvent);
              await video.play();
              console.log('Video playback started after user event simulation');
            } catch (err2) {
              console.error('Second playback attempt failed:', err2);

              // Third attempt - try with muted (autoplay policy workaround)
              video.muted = true;
              try {
                await video.play();
                console.log('Video playing muted as fallback');
                // Unmute after playback starts if possible
                setTimeout(() => {
                  video.muted = false;
                  console.log('Unmuted video after successful playback');
                }, 1000);
              } catch (err3) {
                console.error('Even muted playback failed:', err3);
                setVideoError('Browser prevented video playback. Try clicking the video directly.');
              }
            }
          }
        }
      } catch (error) {
        console.error('Play/pause error:', error);
        setVideoError('Failed to play video. The URL may have expired.');
        setIsLoading(false);
      }
    };

    const changePlaybackSpeed = useCallback(
      (speed: number) => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = speed;
        setPlaybackSpeed(speed);

        const videoId = getVideoId();
        if (videoId) {
          localStorage.setItem(`video-speed-${videoId}`, speed.toString());
        }

        setShowSpeedMenu(false);
        resetControlsTimeout();

        setShowKeyboardHint(true);
        setTimeout(() => setShowKeyboardHint(false), 2000);
      },
      [getVideoId, resetControlsTimeout]
    );

    const changeQuality = useCallback(
      async (quality: string) => {
        const selectedQuality = availableQualities.find((q) => q.quality === quality);
        if (!selectedQuality) return;

        const video = videoRef.current;
        if (!video) return;

        const wasPlaying = !video.paused;
        const currentTimeStamp = video.currentTime;
        const currentSpeed = video.playbackRate;
        setIsLoading(true);

        try {
          const newUrl = await refreshVideoUrl(quality);
          const urlToUse = newUrl || selectedQuality.url;

          console.log(`Switching to ${quality}`);

          setCurrentQuality(quality);
          setCurrentSrc(urlToUse);
          video.src = urlToUse;

          const videoId = getVideoId();
          if (videoId) {
            localStorage.setItem(`video-quality-${videoId}`, quality);
          }

          const handleLoadedData = () => {
            video.currentTime = currentTimeStamp;
            video.playbackRate = currentSpeed;
            if (wasPlaying) video.play().catch(console.error);
            video.removeEventListener('loadeddata', handleLoadedData);
            setIsLoading(false);
          };

          video.addEventListener('loadeddata', handleLoadedData);
          video.load();
        } catch (error) {
          console.error('Quality change failed:', error);
          setIsLoading(false);
        }

        setShowQualityMenu(false);
        resetControlsTimeout();
      },
      [availableQualities, refreshVideoUrl, resetControlsTimeout, getVideoId]
    );

    // FIXED: Progress bar handlers - Timeline click functionality
    const seekToPosition = useCallback(
      (clientX: number) => {
        const video = videoRef.current;
        const progressBar = progressRef.current;
        if (!video || !progressBar || !duration) return;

        // WATCH PARTY CONTROL LOCK: Only hosts can seek in watch parties
        if (isWatchParty && !isHost) {
          console.log('🔒 Non-host member blocked from seeking - host-only mode');
          return; // Block all seeking for non-host members
        }

        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newTime = percent * duration;

        console.log('Seeking to:', newTime);

        setIsSeeking(true);
        setCurrentTime(newTime);
        video.currentTime = newTime;

        // Clear seeking flag after a brief delay
        setTimeout(() => {
          setIsSeeking(false);
        }, 200);
      },
      [duration, isWatchParty, isHost, onSeek]
    );

    // FIXED: Mouse events for timeline
    const handleProgressMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Progress bar mouse down');
        setIsMouseDown(true);
        seekToPosition(e.clientX);
      },
      [seekToPosition]
    );

    const handleProgressClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Progress bar clicked');
        seekToPosition(e.clientX);
      },
      [seekToPosition]
    );

    // FIXED: Touch events for mobile timeline
    const handleProgressTouch = useCallback(
      (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        if (touch) {
          console.log('Progress bar touched');
          seekToPosition(touch.clientX);
        }
      },
      [seekToPosition]
    );

    // FIXED: Mouse tracking for progress bar dragging
    useEffect(() => {
      if (!isMouseDown) return;

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        seekToPosition(e.clientX);
      };

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        console.log('Mouse up - ending drag');
        setIsMouseDown(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isMouseDown, seekToPosition]);

    const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const volumeBar = volumeRef.current;
      if (!video || !volumeBar) return;

      const rect = volumeBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

      video.volume = percent;
      setVolume(percent);
      setIsMuted(percent === 0);
    }, []);

    const toggleMute = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;

      if (video.muted || video.volume === 0) {
        video.muted = false;
        const newVolume = volume > 0 ? volume : 0.5;
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(false);
      } else {
        video.muted = true;
        setIsMuted(true);
      }

      setShowKeyboardHint(true);
      setTimeout(() => setShowKeyboardHint(false), 1000);
    }, [volume]);

    const toggleFullscreen = async () => {
      const container = containerRef.current;
      if (!container) return;

      try {
        if (!document.fullscreenElement) {
          await container.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.error('Fullscreen error:', error);
      }
    };

    const skip = (seconds: number) => {
      const video = videoRef.current;
      if (!video || !duration) return;

      // WATCH PARTY CONTROL LOCK: Only hosts can skip in watch parties
      if (isWatchParty && !isHost) {
        console.log('🔒 Non-host member blocked from skipping - host-only mode');
        return; // Block all skipping for non-host members
      }

      const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
      video.currentTime = newTime;
      setCurrentTime(newTime);
      resetControlsTimeout();
    };

    // Enhanced keyboard controls
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            (activeElement as HTMLElement).contentEditable === 'true');

        if (isInputFocused && !isKeyboardFocused) return;

        const video = videoRef.current;
        if (!video || videoError) return;

        const showHint = () => {
          setShowKeyboardHint(true);
          setTimeout(() => setShowKeyboardHint(false), 2000);
        };

        switch (e.code) {
          case 'Space':
            e.preventDefault();
            togglePlay();
            break;

          case 'ArrowLeft':
            e.preventDefault();
            skip(e.shiftKey ? -30 : -10);
            showHint();
            break;

          case 'ArrowRight':
            e.preventDefault();
            skip(e.shiftKey ? 30 : 10);
            showHint();
            break;

          case 'KeyM':
            e.preventDefault();
            toggleMute();
            break;

          case 'KeyF':
            e.preventDefault();
            toggleFullscreen();
            break;

          case 'KeyK':
            e.preventDefault();
            togglePlay();
            break;

          case 'KeyJ':
            e.preventDefault();
            skip(-10);
            showHint();
            break;

          case 'KeyL':
            e.preventDefault();
            skip(10);
            showHint();
            break;
        }
      };

      const handleFocus = () => {
        setIsKeyboardFocused(true);
        setShowControls(true);
      };

      const handleBlur = () => {
        setIsKeyboardFocused(false);
        resetControlsTimeout();
      };

      const handleClick = () => {
        container.focus();
        setIsKeyboardFocused(true);
      };

      container.tabIndex = 0;
      container.style.outline = 'none';

      container.addEventListener('keydown', handleKeyDown);
      container.addEventListener('focus', handleFocus);
      container.addEventListener('blur', handleBlur);
      container.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
        container.removeEventListener('focus', handleFocus);
        container.removeEventListener('blur', handleBlur);
        container.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [
      togglePlay,
      skip,
      toggleMute,
      toggleFullscreen,
      videoError,
      isKeyboardFocused,
      resetControlsTimeout,
    ]);

    const handleResume = () => {
      const video = videoRef.current;
      const videoId = getVideoId();
      let savedPosition = 0;

      if (videoId) {
        try {
          const saved = localStorage.getItem(`video-position-${videoId}`);
          savedPosition = saved ? parseFloat(saved) : 0;
        } catch (error) {
          console.error('Error loading saved position:', error);
        }
      }

      if (video && savedPosition > 0) {
        video.currentTime = savedPosition;
        setCurrentTime(savedPosition);
        togglePlay();
      }
      setShowResumePrompt(false);
    };

    const handleStartOver = () => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        setCurrentTime(0);
        togglePlay();
      }
      setShowResumePrompt(false);
    };

    useEffect(() => {
      const container = containerRef.current;
      const video = videoRef.current;
      if (!container || !video) return;

      // Prevent right-click context menu
      const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      // Prevent dev tools shortcuts
      const preventKeyDownInspect = (e: KeyboardEvent) => {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
          return false;
        }
      };

      // Hide video element from selection
      const preventSelection = (e: Event) => {
        e.preventDefault();
        return false;
      };

      // Add protection event listeners
      container.addEventListener('contextmenu', preventContextMenu);
      container.addEventListener('selectstart', preventSelection);
      video.addEventListener('contextmenu', preventContextMenu);
      video.addEventListener('selectstart', preventSelection);
      document.addEventListener('keydown', preventKeyDownInspect);

      return () => {
        container.removeEventListener('contextmenu', preventContextMenu);
        container.removeEventListener('selectstart', preventSelection);
        video.removeEventListener('contextmenu', preventContextMenu);
        video.removeEventListener('selectstart', preventSelection);
        document.removeEventListener('keydown', preventKeyDownInspect);
      };
    }, []);

    const formatTime = (time: number) => {
      if (!isFinite(time)) return '0:00';

      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = Math.floor(time % 60);

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Don't render until we have a valid source
    if (!isReady || !currentSrc) {
      return (
        <div
          className={`relative bg-black rounded-xl overflow-hidden ${className}`}
          style={{ minHeight: isMobile ? '180px' : '200px' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 border-3 md:border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4" />
              <p className="text-white font-medium text-sm md:text-base">Preparing video...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`relative bg-black rounded-xl overflow-hidden group ${className} ${
          isMouseInactive && isPlaying ? 'cursor-none' : 'cursor-default'
        } select-none`}
        style={{
          minHeight: isMobile ? '180px' : '200px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        tabIndex={0}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Video Element - Enhanced Protection */}
        {!videoError && (
          <video
            ref={(element) => {
              videoRef.current = element;
              if (typeof ref === 'function') {
                ref(element);
              } else if (ref) {
                ref.current = element;
              }
            }}
            src={currentSrc}
            poster={poster}
            preload="auto"
            playsInline
            controls={false}
            crossOrigin="anonymous"
            autoPlay={false}
            muted={false}
            width="1920"
            height="1080"
            className="w-full h-full object-contain select-none !block !visible"
            style={{
              pointerEvents: isWatchParty ? 'auto' : 'none', // Allow direct interaction in watch party mode
              userSelect: 'none',
              WebkitUserSelect: 'none',
              transform: 'translateZ(0)' /* Hardware acceleration */,
              WebkitTransform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              display: 'block' /* Force visibility */,
              visibility: 'visible' /* Force visibility */,
              zIndex: 20 /* Ensure video is above other elements */,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isWatchParty) {
                console.log('Direct video element click');
                togglePlay();
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}

        {/* Error State */}
        {videoError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black p-4 md:p-8"
          >
            <div className="text-center max-w-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 md:mb-6"
              >
                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
              </motion.div>

              <h3 className="text-red-400 font-bold text-lg md:text-xl mb-2 md:mb-3">
                Video Error
              </h3>
              <p className="text-white/70 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                {videoError}
              </p>

              <motion.button
                onClick={async () => {
                  setVideoError(null);
                  setIsLoading(true);

                  const newUrl = await refreshVideoUrl(currentQuality);
                  if (newUrl) {
                    setCurrentSrc(newUrl);
                    videoRef.current?.load();
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 md:px-8 md:py-3 rounded-xl font-semibold transition-all shadow-lg text-sm md:text-base"
              >
                <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-2 inline" />
                Retry
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {(isLoading || isBuffering) && !videoError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20"
            >
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 border-3 md:border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4" />
                <p className="text-white font-medium text-sm md:text-base">
                  {isLoading ? 'Loading...' : 'Buffering...'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && !videoError && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-10"
            >
              {/* Title */}
              {title && !isMobile && (
                <div className="absolute top-4 md:top-6 left-4 md:left-6">
                  <h3 className="text-white text-lg md:text-xl font-bold drop-shadow-lg">
                    {title}
                  </h3>
                </div>
              )}

              {/* Keyboard Hint */}
              <AnimatePresence>
                {showKeyboardHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-16 md:top-20 right-4 md:right-6 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 md:px-4 md:py-2 z-50"
                  >
                    <div className="text-white text-xs md:text-sm font-medium">
                      Quality: {currentQuality} | Speed: {playbackSpeed}x
                      {isMuted ? ' | Muted' : ` | Vol: ${Math.round(volume * 100)}%`}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Center Play Button */}
              <AnimatePresence>
                {!isPlaying && !isBuffering && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.button
                      onClick={togglePlay}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all shadow-2xl border border-white/20"
                    >
                      <Play className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white ml-1" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Controls */}
              <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6">
                {/* FIXED: Premium Progress Bar with Click Support */}
                <div className="mb-2 md:mb-4">
                  <div
                    ref={progressRef}
                    className={`relative w-full h-3 md:h-2 bg-white/20 rounded-full group touch-manipulation transition-all duration-200 ${
                      isWatchParty && !isHost
                        ? 'cursor-not-allowed opacity-60' // Locked for non-host members
                        : 'cursor-pointer hover:h-4 md:hover:h-3'
                    }`}
                    onMouseDown={isWatchParty && !isHost ? undefined : handleProgressMouseDown}
                    onClick={isWatchParty && !isHost ? undefined : handleProgressClick}
                    onTouchStart={isWatchParty && !isHost ? undefined : handleProgressTouch}
                    style={{ pointerEvents: isWatchParty && !isHost ? 'none' : 'auto' }} // Block interaction for non-host
                  >
                    {/* Progress Fill with Gradient */}
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-netflix-red to-red-500 rounded-full transition-all duration-150 shadow-lg pointer-events-none"
                      style={{ width: `${progressPercentage}%` }}
                    />

                    {/* Premium Scrubber */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 md:w-3 md:h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg border-2 border-netflix-red scale-0 group-hover:scale-100 pointer-events-none"
                      style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
                    />

                    {/* Premium Glow Effect */}
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-netflix-red/50 to-red-500/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-sm pointer-events-none"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Control Buttons - Mobile Responsive */}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3 md:space-x-6'}`}
                  >
                    {/* Play/Pause - Hidden for non-host members in watch party */}
                    {!(isWatchParty && !isHost) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            onClick={togglePlay}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-white hover:text-netflix-red transition-colors"
                          >
                            {isPlaying ? (
                              <Pause
                                className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 md:w-10 md:h-10'}`}
                              />
                            ) : (
                              <Play
                                className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 md:w-10 md:h-10'}`}
                              />
                            )}
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-black/90 text-white border-white/20"
                        >
                          <p>{isPlaying ? 'Pause' : 'Play'} (Space)</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Skip Controls - Hidden for non-host members in watch party */}
                    {!(isWatchParty && !isHost) && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              onClick={() => skip(-10)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-white hover:text-netflix-red transition-colors"
                            >
                              <SkipBack
                                className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6 md:w-7 md:h-7'}`}
                              />
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-black/90 text-white border-white/20"
                          >
                            <p>-10s</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              onClick={() => skip(10)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-white hover:text-netflix-red transition-colors"
                            >
                              <SkipForward
                                className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6 md:w-7 md:h-7'}`}
                              />
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-black/90 text-white border-white/20"
                          >
                            <p>+10s</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}

                    {/* Watch Party Viewer Mode Indicator - Show for non-host members */}
                    {isWatchParty && !isHost && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-netflix-red/20 border border-netflix-red/30 rounded-full">
                        <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
                        <span className="text-netflix-red text-xs font-medium">
                          {isMobile ? 'LIVE' : 'VIEWER MODE'}
                        </span>
                      </div>
                    )}

                    {/* Volume Control - Hidden on mobile */}
                    {!isMobile && (
                      <div className="flex items-center space-x-4 group/volume">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              onClick={toggleMute}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-white hover:text-netflix-red transition-colors"
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeX className="w-6 h-6 md:w-7 md:h-7" />
                              ) : (
                                <Volume2 className="w-6 h-6 md:w-7 md:h-7" />
                              )}
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-black/90 text-white border-white/20"
                          >
                            <p>{isMuted ? 'Unmute' : 'Mute'}</p>
                          </TooltipContent>
                        </Tooltip>

                        <div
                          ref={volumeRef}
                          className="w-0 group-hover/volume:w-24 h-1 bg-white/20 rounded-full cursor-pointer transition-all duration-300 opacity-0 group-hover/volume:opacity-100"
                          onClick={handleVolumeChange}
                        >
                          <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Time Display */}
                    <span
                      className={`text-white font-mono tracking-wider ${isMobile ? 'text-sm' : 'text-base md:text-lg'}`}
                    >
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {/* Speed Indicator */}
                    {playbackSpeed !== 1 && (
                      <Badge
                        variant="secondary"
                        className="bg-netflix-red/20 text-netflix-red text-xs"
                      >
                        {playbackSpeed}x
                      </Badge>
                    )}
                  </div>

                  <div
                    className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4 md:space-x-6'}`}
                  >
                    {/* Settings - Simplified for mobile */}
                    {availableQualities.length > 1 && (
                      <div className="relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              onClick={() => setShowQualityMenu(!showQualityMenu)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-white hover:text-netflix-red transition-colors"
                            >
                              <Settings className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-black/90 text-white border-white/20"
                          >
                            <p>{currentQuality}</p>
                          </TooltipContent>
                        </Tooltip>

                        <AnimatePresence>
                          {showQualityMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-12 right-0 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg min-w-[120px] md:min-w-[140px]"
                            >
                              <div className="p-2">
                                <div className="text-white text-xs font-medium mb-2 text-center">
                                  Quality
                                </div>
                                <div className="space-y-1">
                                  {availableQualities.map((quality) => (
                                    <motion.button
                                      key={quality.quality}
                                      onClick={() => changeQuality(quality.quality)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={`block w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                                        currentQuality.toUpperCase() ===
                                        quality.quality.toUpperCase()
                                          ? 'bg-netflix-red text-white shadow-lg'
                                          : 'text-white/80 hover:text-white hover:bg-white/10'
                                      }`}
                                    >
                                      {quality.quality}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Fullscreen */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={toggleFullscreen}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-white hover:text-netflix-red transition-colors"
                        >
                          {isFullscreen ? (
                            <Minimize className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                          ) : (
                            <Maximize className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                        <p>{isFullscreen ? 'Exit' : 'Fullscreen'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Click overlay for play/pause when controls are hidden */}
        {!showControls && !videoError && !isLoading && (
          <div
            className="absolute inset-0 cursor-pointer z-5"
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
          />
        )}

        {/* Resume Prompt */}
        <AnimatePresence>
          {showResumePrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-30"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="text-center p-8 bg-black/50 border border-white/20 rounded-2xl shadow-2xl max-w-sm mx-4"
              >
                <h3 className="text-white font-bold text-xl mb-2">Welcome Back!</h3>
                <p className="text-white/80 mb-6 text-xs">
                  You left off at{' '}
                  {(() => {
                    const videoId = getVideoId();
                    if (videoId) {
                      try {
                        const saved = localStorage.getItem(`video-position-${videoId}`);
                        const savedPosition = saved ? parseFloat(saved) : 0;
                        return formatTime(savedPosition);
                      } catch (error) {
                        return '0:00';
                      }
                    }
                    return '0:00';
                  })()}
                  . Do you want to resume or start over?
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={handleResume} size="sm" variant={'premium'}>
                    Resume
                  </Button>
                  <Button onClick={handleStartOver} variant={'glass'} size="sm">
                    Start Over
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watermark - CinemaX Logo in top right */}
        <AnimatePresence>
          {isPlaying && !videoError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute top-3 md:top-4 right-3 md:right-4 z-25 pointer-events-none"
            >
              <Image
                src="/text-logo.png"
                alt="CinemaX"
                width={isMobile ? 60 : 80}
                height={isMobile ? 12 : 16}
                className="opacity-80"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
