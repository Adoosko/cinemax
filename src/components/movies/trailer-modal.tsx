'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string | null;
  movieTitle: string;
}

export function TrailerModal({ isOpen, onClose, trailerUrl, movieTitle }: TrailerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasWindow, setHasWindow] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasWindow(true);
    }
  }, []);

  // Auto-play when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsPlaying(false);
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Generate fallback YouTube search URL if no trailer URL
  const getVideoUrl = () => {
    if (trailerUrl) {
      return trailerUrl;
    }
    // Fallback to YouTube search
    const searchQuery = encodeURIComponent(`${movieTitle} trailer`);
    return `https://www.youtube.com/results?search_query=${searchQuery}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!hasWindow) {
    return null; // Don't render on server side
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-6xl bg-black rounded-xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white text-xl font-bold">{movieTitle}</h2>
                    <p className="text-white/60 text-sm">Official Trailer</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Mute Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMuted(!isMuted)}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </motion.button>

                    {/* Fullscreen Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleFullscreen}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize className="w-5 h-5" />
                      ) : (
                        <Maximize className="w-5 h-5" />
                      )}
                    </motion.button>

                    {/* Close Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                {trailerUrl ? (
                  <ReactPlayer
                    {...({
                      url: getVideoUrl(),
                      width: '100%',
                      height: '100%',
                      playing: isPlaying,
                      muted: isMuted,
                      controls: true,
                      pip: true,
                      onPlay: () => setIsPlaying(true),
                      onPause: () => setIsPlaying(false),
                      onEnded: () => setIsPlaying(false),
                      onError: (error: any) => {
                        console.error('Video player error:', error);
                        // Fallback to YouTube search
                        window.open(getVideoUrl(), '_blank');
                        onClose();
                      },
                    } as any)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-netflix-dark-gray">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white text-xl font-semibold mb-2">
                        No Trailer Available
                      </h3>
                      <p className="text-white/60 mb-6">
                        We couldn't find an official trailer for this movie.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          window.open(getVideoUrl(), '_blank');
                          onClose();
                        }}
                        className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Search on YouTube
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* Loading Overlay */}
              {trailerUrl && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none opacity-0 transition-opacity">
                  <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
