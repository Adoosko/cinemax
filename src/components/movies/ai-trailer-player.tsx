'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic, Download, X, Type, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '../ui/input';

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
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [lyricsMode, setLyricsMode] = useState(false);
  const [lyricsSpeed, setLyricsSpeed] = useState(1.0); // Speed multiplier for lyrics sync
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [loadTimeoutId, setLoadTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Fetch trailers and set initial
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

  // Audio element event management and loading reliability
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedTrailer?.fileUrl) return;

    audio.src = selectedTrailer.fileUrl;
    audio.load();
    setAudioLoaded(false);
    setAudioError(null);
    setDuration(0);

    let timeout = setTimeout(() => {
      if (!audioLoaded) {
        setAudioLoaded(true);
        setAudioError('Audio loading timeout - manual play allowed');
      }
    }, 15000);
    setLoadTimeoutId(timeout);

    const handleLoadedMetadata = () => {
      setAudioLoaded(true);
      setAudioError(null);
      setDuration(audio.duration);
      if (timeout) clearTimeout(timeout);
    };

    const handleCanPlay = () => {
      if (!audioLoaded && audio.duration && audio.duration > 0) {
        setAudioLoaded(true);
        setAudioError(null);
        setDuration(audio.duration);
        if (timeout) clearTimeout(timeout);
      }
    };

    const handleError = () => {
      setAudioError('Failed to load audio file - check URL and network');
      setAudioLoaded(false);
      if (timeout) clearTimeout(timeout);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line
  }, [selectedTrailer?.fileUrl]);

  // Audio basic player controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [selectedTrailer, isPlayerOpen]);

  // Lyrics parsing and timed highlighting
  const scriptWords = useMemo(() => {
    if (!selectedTrailer?.script) return [];
    const cleanedScript = selectedTrailer.script
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = cleanedScript.split(/\s+/).filter(Boolean);

    const timingDuration = duration > 0 ? duration : (words.length / 100) * 60; // Base duration
    const timePerWord = timingDuration / words.length; // Keep total duration same

    return words.map((word, index) => ({
      word: word.toUpperCase(),
      startTime: index * timePerWord,
      endTime: (index + 1) * timePerWord,
    }));
  }, [selectedTrailer?.script, duration, lyricsSpeed]);

  const lyricsLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < scriptWords.length; i += 3) {
      lines.push(scriptWords.slice(i, i + 3));
    }
    return lines;
  }, [scriptWords]);

  // Find current word group (highlight based on speed setting)
  const currentWordGroup = useMemo(() => {
    if (!scriptWords.length) return { start: -1, end: -1 };
    const currentIndex = scriptWords.findIndex(
      (word) => currentTime >= word.startTime && currentTime < word.endTime
    );

    if (currentIndex === -1) return { start: -1, end: -1 };

    // Adjust group size based on speed multiplier
    // Faster speed = larger groups (more words highlighted at once)
    // Slower speed = smaller groups (fewer words highlighted at once)
    const baseGroupSize = 4;
    const adjustedGroupSize = Math.max(1, Math.round(baseGroupSize * lyricsSpeed));

    const start = Math.max(0, currentIndex - Math.floor(adjustedGroupSize / 3));
    const end = Math.min(scriptWords.length - 1, start + adjustedGroupSize - 1);

    return { start, end };
  }, [scriptWords, currentTime, lyricsSpeed]);

  // Scroll karaoke lyrics
  useEffect(() => {
    if (!lyricsContainerRef.current || !lyricsMode) return;
    const currentLineIndex = lyricsLines.findIndex((line) =>
      line.some(
        (wordData) =>
          scriptWords.indexOf(wordData) >= currentWordGroup.start &&
          scriptWords.indexOf(wordData) <= currentWordGroup.end
      )
    );
    if (currentLineIndex !== -1) {
      const lineElement = lyricsContainerRef.current.children[currentLineIndex] as HTMLElement;
      if (lineElement) {
        lineElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }
  }, [currentWordGroup, lyricsMode, lyricsLines, scriptWords]);

  // Duration fallback
  useEffect(() => {
    if (selectedTrailer && duration === 0 && scriptWords.length > 0) {
      const estimated = (scriptWords.length / 100) * 60; // Match the slower WPM rate
      setDuration(estimated);
    }
    // eslint-disable-next-line
  }, [selectedTrailer?.id, duration, scriptWords.length]);

  // Handle retry
  const retryAudio = () => {
    setAudioError(null);
    setAudioLoaded(false);
    const audio = audioRef.current;
    if (audio) audio.load();
    if (loadTimeoutId) clearTimeout(loadTimeoutId);
  };

  // Format time helper
  const formatTime = (t: number) =>
    `${Math.floor(t / 60)}:${Math.floor(t % 60)
      .toString()
      .padStart(2, '0')}`;

  if (aiTrailers.length === 0) return null;

  // BUTTON VARIANTS
  const lyricsSwitchIcon = lyricsMode ? (
    <Music className="w-3 h-3 mr-1" />
  ) : (
    <Type className="w-3 h-3 mr-1" />
  );
  const lyricsSwitchText = lyricsMode ? 'Lyrics' : 'Script';
  const primaryBtn =
    'bg-netflix-red text-white rounded-xl font-semibold flex items-center gap-2 shadow px-4 py-2';
  const outlineBtn = 'bg-white/10 border border-white/30 text-white hover:bg-white/20 rounded-lg';

  return (
    <div className={className}>
      {!isPlayerOpen && (
        <Button size="sm" className={primaryBtn} onClick={() => setIsPlayerOpen(true)}>
          <Mic className="w-4 h-4" /> AI Trailer
        </Button>
      )}
      {isPlayerOpen && selectedTrailer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
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
                className="absolute top-3 right-3"
                onClick={() => setIsPlayerOpen(false)}
                aria-label="Close player"
              >
                <X className="w-5 h-5 text-white" />
              </Button>
              <Button
                variant={lyricsMode ? 'default' : 'outline'}
                size="sm"
                className="mr-10"
                onClick={() => setLyricsMode(!lyricsMode)}
              >
                {lyricsSwitchIcon}
                {lyricsSwitchText}
              </Button>
              {lyricsMode && (
                <div className="flex items-center gap-2 mr-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLyricsSpeed(Math.max(0.5, lyricsSpeed - 0.1))}
                    className="text-xs px-2"
                  >
                    ⏪
                  </Button>
                  <span className="text-white text-xs font-mono min-w-[40px] text-center">
                    {lyricsSpeed.toFixed(1)}x
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLyricsSpeed(Math.min(2.0, lyricsSpeed + 0.1))}
                    className="text-xs px-2"
                  >
                    ⏩
                  </Button>
                </div>
              )}
            </div>
            {/* Script / Lyrics */}
            <div className="mb-6 min-h-[180px] flex items-center">
              {lyricsMode ? (
                <div className="w-full">
                  <div className="w-full bg-white/10 rounded-full h-1 mb-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-netflix-red to-red-500 rounded-full transition-all duration-300 ease-out"
                      style={{
                        width:
                          scriptWords.length > 0
                            ? `${Math.min(100, ((currentWordGroup.end + 1) / scriptWords.length) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className="h-[150px] w-full rounded-md overflow-hidden relative">
                    <div
                      ref={lyricsContainerRef}
                      className="space-y-2 text-center px-4 py-2 h-full overflow-y-auto scrollbar-hide scroll-smooth"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {lyricsLines.map((line, lineIndex) => (
                        <div
                          key={`line-${lineIndex}`}
                          className="flex justify-center items-center gap-2 min-h-[32px]"
                        >
                          {line.map((wordData, wordIndex) => {
                            const globalIndex = lineIndex * 3 + wordIndex;
                            const isInCurrentGroup =
                              globalIndex >= currentWordGroup.start &&
                              globalIndex <= currentWordGroup.end;
                            const isPast = globalIndex < currentWordGroup.start;
                            return (
                              <span
                                key={`${wordData.word}-${globalIndex}`}
                                className={`transition-all duration-700 ease-out px-2 py-1 rounded-lg ${
                                  isInCurrentGroup
                                    ? 'text-white font-bold text-lg scale-105 drop-shadow bg-netflix-red/15 border border-netflix-red/25 animate-pulse'
                                    : isPast
                                      ? 'text-white/85 font-medium'
                                      : 'text-white/45'
                                }`}
                                style={{
                                  textShadow: isInCurrentGroup
                                    ? '0 0 10px rgba(229,9,20,0.6), 0 0 20px rgba(229,9,20,0.3)'
                                    : 'none',
                                  transform: isInCurrentGroup
                                    ? 'scale(1.05) translateY(-1px)'
                                    : 'scale(1) translateY(0)',
                                }}
                              >
                                {wordData.word}
                              </span>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  </div>
                  {(!audioLoaded || scriptWords.length === 0) && !audioError && (
                    <div className="flex flex-col items-center space-y-2 py-4">
                      <div className="w-6 h-6 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
                      <p className="text-white/60 text-xs italic">
                        {scriptWords.length === 0 ? 'Preparing lyrics...' : 'Loading audio...'}
                      </p>
                      {!audioLoaded && scriptWords.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs mt-2"
                          onClick={() => setAudioLoaded(true)}
                        >
                          Try Playing Now
                        </Button>
                      )}
                    </div>
                  )}
                  {audioError && (
                    <div className="flex flex-col items-center space-y-2 py-4">
                      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-red-400 text-xs italic">Audio loading failed</p>
                      <p className="text-white/40 text-xs text-center px-4">{audioError}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs mt-2"
                        onClick={retryAudio}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  {scriptWords.length > 0 && currentWordGroup.end >= scriptWords.length - 1 && (
                    <div className="mt-2 text-center">
                      <p className="text-netflix-red font-medium text-xs animate-pulse">
                        🎬 Trailer Complete
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full">
                  <div className="h-[150px] w-full rounded-md overflow-y-auto scrollbar-hide">
                    <div className="text-center px-4 py-2">
                      <p className="text-white/90 font-medium text-base leading-relaxed">
                        {selectedTrailer.script}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Audio */}
            <audio ref={audioRef} src={selectedTrailer.fileUrl} preload="metadata" />
            {/* Controls */}
            <div className="flex items-center gap-2 w-full mb-3">
              <Button
                size="sm"
                className={primaryBtn}
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
              <Input
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
                variant="outline"
                size="icon"
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
            </div>
            {/* Trailer Choices */}
            {aiTrailers.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {aiTrailers.map((trailer) => (
                  <Button
                    key={trailer.id}
                    variant={selectedTrailer.id === trailer.id ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-lg"
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
