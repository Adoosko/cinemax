'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, RotateCcw, Play } from 'lucide-react';
import { VideoPlayer } from '@/components/video/video-player';

interface VideoQuality {
  quality: string;
  url: string;
  bitrate: number;
}

interface MoviePlayerClientProps {
  title?: string;
  poster?: string;
  qualities?: VideoQuality[];
}

export function MoviePlayerClient({ title, poster, qualities = [] }: MoviePlayerClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [savedTimeInSeconds, setSavedTimeInSeconds] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    setIsClient(true);

    console.log('MoviePlayerClient initialized:', {
      title,
      qualitiesCount: qualities.length,
      hasValidQualities: qualities.length > 0 && qualities.every((q) => q.url),
    });

    // Validate that we have valid qualities with presigned URLs
    if (qualities.length === 0) {
      setError('No video qualities available');
      setIsLoading(false);
      return;
    }

    // Check if URLs look like presigned URLs (should contain signature)
    const hasValidUrls = qualities.every(
      (q) => q.url && (q.url.includes('X-Amz-Signature') || q.url.startsWith('https://'))
    );

    if (!hasValidUrls) {
      setError('Invalid video URLs - authentication required');
      setIsLoading(false);
      return;
    }

    // Load saved progress
    if (title) {
      const savedProgress = localStorage.getItem(`movie-progress-${title}`);
      const savedTime = localStorage.getItem(`movie-time-${title}`);

      if (savedProgress && !isNaN(Number(savedProgress))) {
        setProgress(parseFloat(savedProgress));
      }

      if (savedTime && !isNaN(Number(savedTime))) {
        const timeInSeconds = parseFloat(savedTime);
        if (timeInSeconds > 30) {
          setSavedTimeInSeconds(timeInSeconds);
          setShowResumePrompt(true);
        }
      }
    }

    setIsLoading(false);
  }, [title, qualities]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  };

  if (!isClient) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-white text-lg">Initializing player...</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-white text-xl font-semibold mb-2">Loading Video</h3>
          <p className="text-white/60">Preparing your movie experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h3 className="text-red-400 font-bold text-xl mb-3">Video Unavailable</h3>
          <p className="text-white/70 mb-6">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Resume Prompt */}
      <AnimatePresence>
        {showResumePrompt && savedTimeInSeconds && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-netflix-red mr-2" />
              <span className="text-white">
                Resume from {formatTime(savedTimeInSeconds)} ({Math.round(progress)}%)
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResumePrompt(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </button>
              <button
                onClick={() => setShowResumePrompt(false)}
                className="px-4 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-md flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player */}
      <VideoPlayer
        title={title}
        poster={poster}
        qualities={qualities}
        className="w-full h-full"
        onTimeUpdate={(time, duration) => {
          if (duration > 0) {
            const progressPercent = Math.round((time / duration) * 100);
            setProgress(progressPercent);

            // Save progress every 5 seconds
            if (Math.floor(time) % 5 === 0 && title) {
              localStorage.setItem(`movie-progress-${title}`, progressPercent.toString());
              localStorage.setItem(`movie-time-${title}`, time.toString());
              localStorage.setItem(`movie-last-watched-${title}`, new Date().toISOString());
            }
          }
        }}
        onEnded={() => {
          if (title) {
            localStorage.setItem(`movie-completed-${title}`, 'true');
            localStorage.setItem(`movie-progress-${title}`, '100');
          }
        }}
      />
    </div>
  );
}
