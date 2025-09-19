'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Play, Clock, Bookmark } from 'lucide-react';
import { VideoPlayer } from '@/components/video/video-player';

interface VideoQuality {
  quality: string;
  url: string;
  bitrate: number;
}

interface MoviePlayerClientProps {
  src: string;
  poster?: string;
  title?: string;
  qualities?: VideoQuality[];
}

export function MoviePlayerClient({ src, poster, title, qualities = [] }: MoviePlayerClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(src);
  const [progress, setProgress] = useState(0);
  const [lastWatched, setLastWatched] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Validate the video URL
    if (!src) {
      setError('No video source provided');
      setIsLoading(false);
      return;
    }

    // Load saved progress from localStorage
    if (title) {
      const savedProgress = localStorage.getItem(`movie-progress-${title}`);
      const savedLastWatched = localStorage.getItem(`movie-last-watched-${title}`);

      if (savedProgress) {
        const progressValue = parseFloat(savedProgress);
        setProgress(progressValue);
      }

      if (savedLastWatched) {
        setLastWatched(savedLastWatched);
      }
    }

    console.log('Video source URL:', src);
    setIsLoading(false);
  }, [src, title]);

  // Update video URL when src prop changes
  useEffect(() => {
    setVideoUrl(src);
  }, [src]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-white text-lg">Initializing player...</span>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-white text-xl font-semibold mb-2">Loading Video</h3>
          <p className="text-white/60">Preparing your movie experience...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full bg-black flex items-center justify-center p-6"
      >
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle className="w-10 h-10 text-red-500" />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-red-400 font-bold text-xl mb-3"
          >
            Video Unavailable
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/70 mb-6 leading-relaxed"
          >
            {error}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl text-left mb-6"
          >
            <p className="text-netflix-red text-sm font-semibold mb-2">Debug Info:</p>
            <div className="text-white/40 text-xs font-mono break-all">{src}</div>
          </motion.div>

          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-netflix-red/25"
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Video Player */}
      <VideoPlayer
        src={src}
        poster={poster}
        title={title}
        qualities={qualities || []}
        className="w-full h-full"
        onTimeUpdate={(time, duration) => {
          if (duration > 0) {
            const progressPercent = Math.round((time / duration) * 100);
            setProgress(progressPercent);

            // Save to localStorage every 10 seconds
            if (Math.floor(time) % 10 === 0 && title) {
              localStorage.setItem(`movie-progress-${title}`, progressPercent.toString());

              const now = new Date().toISOString();
              localStorage.setItem(`movie-last-watched-${title}`, now);
              setLastWatched(now);
            }
          }
        }}
        onEnded={() => {
          console.log('Movie completed');
          if (title) {
            localStorage.setItem(`movie-completed-${title}`, 'true');
            localStorage.setItem(`movie-progress-${title}`, '100');
          }
        }}
      />
    </div>
  );
}
