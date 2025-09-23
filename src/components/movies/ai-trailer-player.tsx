'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic, Sparkles, Clock, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AiTrailer {
  id: string;
  script: string;
  fileUrl: string;
  fileSize: number;
  voiceStyle: string;
  createdAt: string;
}

interface AiTrailerPlayerProps {
  movieSlug: string;
  className?: string;
}

export function AiTrailerPlayer({ movieSlug, className = '' }: AiTrailerPlayerProps) {
  const [aiTrailers, setAiTrailers] = useState<AiTrailer[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<AiTrailer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch AI trailers for the movie
  useEffect(() => {
    const fetchAiTrailers = async () => {
      try {
        const response = await fetch(`/api/movies/${movieSlug}/ai-trailers`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.aiTrailers) {
            setAiTrailers(data.aiTrailers);
            if (data.aiTrailers.length > 0) {
              setSelectedTrailer(data.aiTrailers[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching AI trailers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAiTrailers();
  }, [movieSlug]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [selectedTrailer]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVoiceStyleLabel = (style: string) => {
    const styles: Record<string, string> = {
      epic: 'Epic',
      dramatic: 'Dramatic',
      mysterious: 'Mysterious',
      heroic: 'Heroic',
      classic: 'Classic'
    };
    return styles[style] || style;
  };

  const getVoiceStyleColor = (style: string) => {
    const colors: Record<string, string> = {
      epic: 'bg-red-500',
      dramatic: 'bg-purple-500',
      mysterious: 'bg-indigo-500',
      heroic: 'bg-blue-500',
      classic: 'bg-amber-500'
    };
    return colors[style] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <span className="text-white/60 text-sm">Loading AI trailers...</span>
      </div>
    );
  }

  if (aiTrailers.length === 0) {
    return null; // Don't show anything if no AI trailers exist
  }

  return (
    <div className={className}>
      {/* AI Trailer Button */}
      {!showPlayer && (
        <button
          onClick={() => setShowPlayer(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 font-semibold transition-all flex items-center justify-center rounded-lg border border-purple-500/50 shadow-lg hover:shadow-purple-500/25"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          <Mic className="w-4 h-4 mr-2" />
          AI Trailer ({aiTrailers.length})
        </button>
      )}

      {/* AI Trailer Player Modal */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowPlayer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Generated Trailers</h2>
                    <p className="text-white/60 text-sm">{aiTrailers.length} voice-over{aiTrailers.length !== 1 ? 's' : ''} available</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlayer(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Trailer Selection */}
              {aiTrailers.length > 1 && (
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3">Select Voice Style:</h3>
                  <div className="flex flex-wrap gap-2">
                    {aiTrailers.map((trailer) => (
                      <button
                        key={trailer.id}
                        onClick={() => setSelectedTrailer(trailer)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedTrailer?.id === trailer.id
                            ? `${getVoiceStyleColor(trailer.voiceStyle)} text-white`
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {getVoiceStyleLabel(trailer.voiceStyle)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Trailer Info */}
              {selectedTrailer && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getVoiceStyleColor(selectedTrailer.voiceStyle)}`}>
                        {getVoiceStyleLabel(selectedTrailer.voiceStyle)}
                      </span>
                      <span className="text-white/60 text-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(selectedTrailer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <a
                      href={selectedTrailer.fileUrl}
                      download
                      className="text-white/60 hover:text-white transition-colors"
                      title="Download audio file"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{selectedTrailer.script}</p>
                </div>
              )}

              {/* Audio Player */}
              {selectedTrailer && (
                <div className="space-y-4">
                  <audio
                    ref={audioRef}
                    src={selectedTrailer.fileUrl}
                    preload="metadata"
                  />

                  {/* Controls */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 bg-netflix-red hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 space-y-2">
                      {/* Progress Bar */}
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                      />
                      
                      {/* Time Display */}
                      <div className="flex justify-between text-xs text-white/60">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <button
                      onClick={toggleMute}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e50914;
          cursor: pointer;
          border: 2px solid #fff;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e50914;
          cursor: pointer;
          border: 2px solid #fff;
        }
      `}</style>
    </div>
  );
}
