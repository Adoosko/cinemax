'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic, Download, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchAiTrailers = async () => {
      const res = await fetch(`/api/movies/${movieSlug}/ai-trailers`);
      const data = await res.json();
      if (data.success && data.aiTrailers) {
        setAiTrailers(data.aiTrailers);
        if (data.aiTrailers.length > 0) setSelectedTrailer(data.aiTrailers[0]);
      }
    };
    fetchAiTrailers();
  }, [movieSlug]);

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

  if (aiTrailers.length === 0) return null;

  const formatTime = (t: number) =>
    `${Math.floor(t / 60)}:${Math.floor(t % 60)
      .toString()
      .padStart(2, '0')}`;

  return (
    <div className={className}>
      {!isPlayerOpen && (
        <Button size="sm" variant={'glass'} onClick={() => setIsPlayerOpen(true)}>
          <Mic className="w-4 h-4" />
          AI Trailer
        </Button>
      )}
      {isPlayerOpen && selectedTrailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          tabIndex={0}
          onClick={() => setIsPlayerOpen(false)}
        >
          <div
            className="bg-black border border-white/10 rounded-2xl w-full max-w-lg p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-netflix-red text-white font-medium px-3 py-2 rounded-lg">
                {selectedTrailer.voiceStyle}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-7 right-7"
                onClick={() => setIsPlayerOpen(false)}
                aria-label="Close player"
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>
            {/* Script */}
            <p className="text-white font-medium text-base mb-5">{selectedTrailer.script}</p>
            {/* Audio */}
            <audio ref={audioRef} src={selectedTrailer.fileUrl} preload="metadata" />
            {/* Controls */}
            <div className="flex items-center gap-2 w-full mb-3">
              <Button
                size="sm"
                className="bg-netflix-red text-white rounded-full w-11 h-11 flex items-center justify-center"
                onClick={() => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  if (isPlaying) audio.pause();
                  else audio.play();
                  setIsPlaying(!isPlaying);
                }}
                aria-label={isPlaying ? 'Pause trailer' : 'Play trailer'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  const newTime = parseFloat(e.target.value);
                  audio.currentTime = newTime;
                  setCurrentTime(newTime);
                }}
                className="flex-1 accent-netflix-red h-2 rounded-lg bg-white/20 cursor-pointer"
              />
              <span className="text-white/70 text-xs font-mono w-16 text-center">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={() => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  audio.muted = !isMuted;
                  setIsMuted(!isMuted);
                }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <a href={selectedTrailer.fileUrl} download aria-label="Download audio file">
                <Download className="w-5 h-5 text-white ml-2" />
              </a>
            </div>
            {/* Trailer Choices */}
            {aiTrailers.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {aiTrailers.map((trailer) => (
                  <Button
                    key={trailer.id}
                    variant={selectedTrailer.id === trailer.id ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-lg ${selectedTrailer.id === trailer.id ? 'bg-netflix-red text-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/30'}`}
                    onClick={() => setSelectedTrailer(trailer)}
                  >
                    {trailer.voiceStyle}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
