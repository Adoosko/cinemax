'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';

interface VideoQuality {
  quality: string;
  url: string;
  bitrate: number;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  qualities?: VideoQuality[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  title,
  qualities = [],
  onTimeUpdate,
  onEnded,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(qualities[0]?.quality || 'auto');
  const [currentSrc, setCurrentSrc] = useState(src);

  // CRITICAL FIX: Seeking state to prevent timeline jumping
  const [isSeeking, setIsSeeking] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Keyboard controls state
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    setShowControls(true);

    if (isPlaying && !showQualityMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, showQualityMenu]);

  // Video event handlers - FIXED TO PREVENT TIMELINE JUMPING
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // CRITICAL FIX: Only update currentTime state when NOT seeking
      if (!isSeeking && !isMouseDown) {
        const time = video.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time, video.duration || 0);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setVideoError(null);
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(duration);
      onEnded?.();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      resetControlsTimeout();
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setIsBuffering(false);
    };

    const handleSeeking = () => {
      setIsBuffering(true);
    };

    const handleSeeked = () => {
      setIsBuffering(false);
      setIsSeeking(false);
    };

    const handleError = (e: Event) => {
      const errorMessage = video.error?.message || 'Unknown video error';
      const errorCode = video.error?.code || 0;

      console.error('Video error:', {
        code: errorCode,
        message: errorMessage,
        error: video.error,
        src: video.src,
        event: e,
      });

      setIsLoading(false);
      setIsBuffering(false);

      let userFriendlyMessage = 'Unable to play video';

      switch (errorCode) {
        case 1: // MEDIA_ERR_ABORTED
          userFriendlyMessage = 'Video loading was stopped';
          break;
        case 2: // MEDIA_ERR_NETWORK
          userFriendlyMessage = 'Network error - please check your connection';
          break;
        case 3: // MEDIA_ERR_DECODE
          userFriendlyMessage = 'Video format not supported by your browser';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          userFriendlyMessage = 'Video source not available or unsupported';
          break;
        default:
          userFriendlyMessage = `Playback error: ${errorMessage}`;
      }

      setVideoError(userFriendlyMessage);
    };

    // Add all event listeners
    const events = [
      ['timeupdate', handleTimeUpdate],
      ['loadedmetadata', handleLoadedMetadata],
      ['loadeddata', handleLoadedData],
      ['canplay', handleCanPlay],
      ['ended', handleEnded],
      ['play', handlePlay],
      ['pause', handlePause],
      ['waiting', handleWaiting],
      ['playing', handlePlaying],
      ['loadstart', handleLoadStart],
      ['seeking', handleSeeking],
      ['seeked', handleSeeked],
      ['error', handleError],
    ] as const;

    events.forEach(([event, handler]) => {
      video.addEventListener(event, handler as EventListener);
    });

    // Load the video
    if (video.readyState === 0) {
      video.load();
    }

    return () => {
      events.forEach(([event, handler]) => {
        video.removeEventListener(event, handler as EventListener);
      });
    };
  }, [onTimeUpdate, onEnded, currentSrc, isSeeking, isMouseDown, duration, resetControlsTimeout]);

  // Update source when it changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setVideoError(null);
      setIsPlaying(false);
      setIsLoading(true);
      setCurrentTime(0);
    }
  }, [src, currentSrc]);

  // Mouse move handler for showing controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => {
      if (!showQualityMenu) {
        resetControlsTimeout();
      }
    };

    const handleMouseLeave = () => {
      if (!showQualityMenu && isPlaying) {
        setShowControls(false);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [resetControlsTimeout, showQualityMenu, isPlaying]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Control functions
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        await video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Play/pause error:', error);
      setVideoError('Failed to play video. Please try again.');
    }
  };

  // CRITICAL FIX: Proper seeking with mouse tracking
  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsMouseDown(true);
    handleProgressClick(e);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const progressBar = progressRef.current;
      if (!video || !progressBar || !duration) return;

      const rect = progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;

      setIsSeeking(true);
      setCurrentTime(newTime);
      video.currentTime = newTime;

      // Clear seeking flag after video seeks
      setTimeout(() => {
        if (!isMouseDown) {
          setIsSeeking(false);
        }
      }, 100);
    },
    [duration, isMouseDown]
  );

  // Mouse tracking for progress bar
  useEffect(() => {
    if (!isMouseDown) return;

    const handleMouseMove = (e: MouseEvent) => {
      const progressBar = progressRef.current;
      const video = videoRef.current;
      if (!progressBar || !video || !duration) return;

      const rect = progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;

      setCurrentTime(newTime);
      video.currentTime = newTime;
    };

    const handleMouseUp = () => {
      setIsMouseDown(false);
      setTimeout(() => {
        setIsSeeking(false);
      }, 100);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMouseDown, duration]);

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

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted || video.volume === 0) {
      const newVolume = volume > 0 ? volume : 0.5;
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

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

    const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  };

  const changeQuality = (quality: string) => {
    const selectedQuality = qualities.find((q) => q.quality === quality);
    if (!selectedQuality) return;

    const video = videoRef.current;
    if (!video) return;

    const wasPlaying = !video.paused;
    const currentTimeStamp = video.currentTime;

    setCurrentQuality(quality);
    setCurrentSrc(selectedQuality.url);
    setIsLoading(true);

    video.src = selectedQuality.url;

    const handleLoadedData = () => {
      video.currentTime = currentTimeStamp;
      if (wasPlaying) {
        video.play().catch(console.error);
      }
      video.removeEventListener('loadeddata', handleLoadedData);
      setIsLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.load();

    setShowQualityMenu(false);
    resetControlsTimeout();
  };

  // Cycle through qualities with Q key
  const cycleQuality = () => {
    if (qualities.length <= 1) return;

    const currentIndex = qualities.findIndex((q) => q.quality === currentQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    const nextQuality = qualities[nextIndex];

    changeQuality(nextQuality.quality);

    // Show quality change notification
    setShowKeyboardHint(true);
    setTimeout(() => setShowKeyboardHint(false), 2000);
  };

  // Keyboard controls - moved after function definitions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when the player is focused or when no input is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true');

      if (isInputFocused && !isKeyboardFocused) return;

      const video = videoRef.current;
      if (!video || videoError) return;

      // Show keyboard hint briefly
      setShowKeyboardHint(true);
      setTimeout(() => setShowKeyboardHint(false), 2000);

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          skip(e.shiftKey ? -30 : -10); // Shift + Left = 30s back
          break;

        case 'ArrowRight':
          e.preventDefault();
          skip(e.shiftKey ? 30 : 10); // Shift + Right = 30s forward
          break;

        case 'ArrowUp':
          e.preventDefault();
          const newVolumeUp = Math.min(1, volume + 0.1);
          if (video) {
            video.volume = newVolumeUp;
            setVolume(newVolumeUp);
            setIsMuted(false);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          const newVolumeDown = Math.max(0, volume - 0.1);
          if (video) {
            video.volume = newVolumeDown;
            setVolume(newVolumeDown);
            setIsMuted(newVolumeDown === 0);
          }
          break;

        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;

        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 'Home':
          e.preventDefault();
          video.currentTime = 0;
          setCurrentTime(0);
          break;

        case 'End':
          e.preventDefault();
          video.currentTime = duration;
          setCurrentTime(duration);
          break;

        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          e.preventDefault();
          const percent = parseInt(e.code.slice(-1)) / 10;
          const seekTime = duration * percent;
          video.currentTime = seekTime;
          setCurrentTime(seekTime);
          break;

        case 'Digit0':
          e.preventDefault();
          video.currentTime = 0;
          setCurrentTime(0);
          break;

        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;

        case 'KeyJ':
          e.preventDefault();
          skip(-10);
          break;

        case 'KeyL':
          e.preventDefault();
          skip(10);
          break;

        case 'Comma':
          e.preventDefault();
          if (video.paused) {
            video.currentTime = Math.max(0, video.currentTime - 1 / 30); // Frame by frame backward
            setCurrentTime(video.currentTime);
          }
          break;

        case 'Period':
          e.preventDefault();
          if (video.paused) {
            video.currentTime = Math.min(duration, video.currentTime + 1 / 30); // Frame by frame forward
            setCurrentTime(video.currentTime);
          }
          break;

        case 'KeyQ':
          e.preventDefault();
          cycleQuality();
          break;
      }
    };

    const handleFocus = () => setIsKeyboardFocused(true);
    const handleBlur = () => setIsKeyboardFocused(false);
    const handleClick = () => {
      container.focus();
      setIsKeyboardFocused(true);
    };

    // Make container focusable
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
    volume,
    toggleMute,
    toggleFullscreen,
    duration,
    videoError,
    isKeyboardFocused,
    cycleQuality,
  ]);

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

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden group ${className}`}
      style={{ minHeight: '200px' }}
    >
      {/* Video Element */}
      {!videoError && (
        <video
          ref={videoRef}
          src={currentSrc}
          poster={poster}
          className="w-full h-full object-cover bg-black"
          preload="metadata"
          playsInline
          controls={false}
          crossOrigin="anonymous"
        />
      )}

      {/* Error State */}
      {videoError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black p-8"
        >
          <div className="text-center max-w-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </motion.div>

            <h3 className="text-red-400 font-bold text-xl mb-3">Video Error</h3>
            <p className="text-white/70 mb-6 leading-relaxed">{videoError}</p>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-netflix-red text-sm font-semibold mb-2">Source URL:</p>
              <div className="text-white/40 text-xs font-mono break-all bg-black/30 p-2 rounded">
                {currentSrc}
              </div>
            </div>

            <motion.button
              onClick={() => {
                setVideoError(null);
                setIsLoading(true);
                const video = videoRef.current;
                if (video) {
                  video.load();
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Try Again
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
              <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium text-lg">
                {isLoading ? 'Loading video...' : 'Buffering...'}
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
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-10"
          >
            {/* Title */}
            {title && (
              <div className="absolute top-6 left-6">
                <h3 className="text-white text-xl font-bold drop-shadow-lg">{title}</h3>
              </div>
            )}

            {/* Keyboard Hint */}
            <AnimatePresence>
              {showKeyboardHint && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 right-6 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 z-50"
                >
                  <div className="text-white text-sm font-medium">Quality: {currentQuality}</div>
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
                    className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all shadow-2xl border border-white/20"
                  >
                    <Play className="w-12 h-12 text-white ml-2" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              {/* Progress Bar */}
              <div className="mb-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      ref={progressRef}
                      className="w-full h-2 bg-white/20 rounded-full cursor-pointer hover:h-3 transition-all group relative"
                      onMouseDown={handleProgressMouseDown}
                      onClick={handleProgressClick}
                    >
                      <div
                        className="h-full bg-netflix-red rounded-full transition-all relative"
                        style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
                      >
                        <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-netflix-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                    <p>Seek timeline (1-9 keys, ←→)</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Play/Pause */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={togglePlay}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-white hover:text-netflix-red transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-10 h-10" />
                        ) : (
                          <Play className="w-10 h-10" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                      <p>{isPlaying ? 'Pause' : 'Play'} (Space, K)</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Skip Back */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={() => skip(-10)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-white hover:text-netflix-red transition-colors"
                      >
                        <SkipBack className="w-7 h-7" />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                      <p>Skip back 10s (←, J)</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Skip Forward */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={() => skip(10)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-white hover:text-netflix-red transition-colors"
                      >
                        <SkipForward className="w-7 h-7" />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                      <p>Skip forward 10s (→, L)</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Volume Control */}
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
                            <VolumeX className="w-7 h-7" />
                          ) : (
                            <Volume2 className="w-7 h-7" />
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                        <p>{isMuted ? 'Unmute' : 'Mute'} (M)</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          ref={volumeRef}
                          className="w-24 h-1 bg-white/20 rounded-full cursor-pointer opacity-0 group-hover/volume:opacity-100 transition-opacity"
                          onClick={handleVolumeChange}
                        >
                          <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                        <p>Volume: {Math.round(volume * 100)}% (↑↓)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-lg font-mono tracking-wider">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Quality Settings */}
                  {qualities.length > 0 && (
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            onClick={() => setShowQualityMenu(!showQualityMenu)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-white hover:text-netflix-red transition-colors"
                          >
                            <Settings className="w-7 h-7" />
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-black/90 text-white border-white/20"
                        >
                          <p>Quality: {currentQuality} (Q)</p>
                        </TooltipContent>
                      </Tooltip>

                      <AnimatePresence>
                        {showQualityMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-4 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 min-w-[160px] z-50 shadow-2xl"
                          >
                            <div className="text-white font-bold mb-4 text-center">
                              Video Quality
                            </div>
                            <div className="space-y-1">
                              {qualities.map((quality) => (
                                <motion.button
                                  key={quality.quality}
                                  onClick={() => changeQuality(quality.quality)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`block w-full text-left px-4 py-3 text-sm rounded-lg transition-all ${
                                    currentQuality === quality.quality
                                      ? 'bg-netflix-red text-white shadow-lg'
                                      : 'text-white/80 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{quality.quality}</span>
                                    {quality.bitrate > 0 && (
                                      <span className="text-xs opacity-70 ml-2">
                                        {quality.bitrate > 1000
                                          ? `${(quality.bitrate / 1000).toFixed(1)}M`
                                          : `${quality.bitrate}K`}
                                      </span>
                                    )}
                                  </div>
                                </motion.button>
                              ))}
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
                          <Minimize className="w-7 h-7" />
                        ) : (
                          <Maximize className="w-7 h-7" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 text-white border-white/20">
                      <p>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} (F)</p>
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
        <div className="absolute inset-0 cursor-pointer z-5" onClick={togglePlay} />
      )}

      {/* Watermark */}
      <AnimatePresence>
        {!videoError && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 3, duration: 1 }}
            className="absolute -top-4 right-5 z-30 pointer-events-none"
          >
            <Image
              src="/text-logo.png"
              alt="CinemaX"
              width={100}
              height={20}
              className="opacity-20 hover:opacity-30 transition-opacity duration-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
