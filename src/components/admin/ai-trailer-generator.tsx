'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mic, Play, Download, Trash2, RefreshCw, Video } from 'lucide-react';
import { Movie } from '@/lib/data/movies';
import { AiTrailerStatus } from '@/lib/data/ai-trailers-simple';

interface VoiceStyle {
  key: string;
  name: string;
  description: string;
}

interface AiTrailer {
  id: string;
  movieId: string;
  script: string;
  fileUrl: string;
  fileSize: number;
  voiceStyle: string;
  status: AiTrailerStatus;
  errorMessage?: string;
  createdAt: string;
  movie?: {
    title: string;
    slug: string;
  };
}

interface AiTrailerGeneratorProps {
  movie: Movie;
  onTrailerGenerated?: (trailer: AiTrailer) => void;
}

export default function AiTrailerGenerator({ movie, onTrailerGenerated }: AiTrailerGeneratorProps) {
  const [voiceStyles, setVoiceStyles] = useState<VoiceStyle[]>([]);
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<string>('epic');
  const [existingTrailers, setExistingTrailers] = useState<AiTrailer[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, [movie.id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const stylesResponse = await fetch('/api/admin/ai-trailers/voice-styles');
      if (stylesResponse.ok) {
        const stylesData = await stylesResponse.json();
        setVoiceStyles(stylesData.voiceStyles || []);
      }
      const trailersResponse = await fetch(`/api/admin/ai-trailers/generate?movieId=${movie.id}`);
      if (trailersResponse.ok) {
        const trailersData = await trailersResponse.json();
        setExistingTrailers(trailersData.trailers || []);
      }
    } catch (error) {
      setError('Failed to load trailer data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrailer = async (overwrite = false) => {
    if (!selectedVoiceStyle) return setError('Please select a voice style');
    setIsGenerating(true);
    setError('');
    setGenerationProgress(0);
    setGenerationStatus('Starting generation...');
    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 1000);
      const response = await fetch('/api/admin/ai-trailers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, voiceStyle: selectedVoiceStyle, overwrite }),
      });
      clearInterval(progressInterval);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate trailer');
      }
      const data = await response.json();
      setGenerationProgress(100);
      setGenerationStatus('Trailer generated successfully!');
      await loadInitialData();
      onTrailerGenerated?.(data.trailer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate trailer');
      setGenerationProgress(0);
      setGenerationStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTrailer = async (trailerId: string) => {
    if (!confirm('Are you sure you want to delete this trailer?')) return;
    try {
      const response = await fetch(`/api/admin/ai-trailers/${trailerId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete trailer');
      await loadInitialData();
    } catch {
      setError('Failed to delete trailer');
    }
  };

  const getStatusBadge = (status: AiTrailerStatus) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-500', text: 'Pending' },
      GENERATING_SCRIPT: { color: 'bg-blue-500', text: 'Generating Script' },
      GENERATING_AUDIO: { color: 'bg-purple-500', text: 'Generating Audio' },
      UPLOADING: { color: 'bg-orange-500', text: 'Uploading' },
      COMPLETED: { color: 'bg-green-500', text: 'Completed' },
      FAILED: { color: 'bg-red-500', text: 'Failed' },
    };
    const config = (statusConfig as any)[status] || statusConfig.PENDING;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024,
      sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasExistingTrailer = existingTrailers.some(
    (trailer) => trailer.voiceStyle === selectedVoiceStyle && trailer.status === 'COMPLETED'
  );

  if (isLoading) {
    return (
      <Card className="bg-black/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-8">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-3">
              <Mic className="w-7 h-7 text-netflix-red" />
              AI Trailer Generator
            </div>
          </CardTitle>
          <CardDescription className="text-white/60">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 text-netflix-red animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-black/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-8">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-3">
              <Mic className="w-7 h-7 text-netflix-red" />
              AI Trailer Generator
            </div>
          </CardTitle>
          <CardDescription className="text-white/60">
            Create custom voice-over trailers for <span className="font-bold">{movie.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <label className="block text-white font-semibold">Voice Style</label>
            <Select value={selectedVoiceStyle} onValueChange={setSelectedVoiceStyle}>
              <SelectTrigger className="bg-black/60 border border-white/20 text-white">
                <SelectValue placeholder="Choose voice style" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 border border-white/20 rounded-lg">
                {voiceStyles.map((style) => (
                  <SelectItem key={style.key} value={style.key} className="text-white">
                    <span className="font-medium">{style.name}</span>
                    <span className="text-sm text-white/50 ml-2">{style.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{generationStatus}</span>
              </div>
              <Progress value={generationProgress} className="w-full bg-white/10" />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => generateTrailer(false)}
              disabled={isGenerating || !selectedVoiceStyle}
              className="bg-netflix-red text-white flex-1"
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Generate Trailer
            </Button>
            {hasExistingTrailer && (
              <Button
                onClick={() => generateTrailer(true)}
                disabled={isGenerating}
                variant="outline"
                size="lg"
                className="flex-1 border-netflix-red text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {existingTrailers.length > 0 && (
        <Card className="bg-black/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-8">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-netflix-red" />
                Existing Trailers
              </div>
            </CardTitle>
            <CardDescription className="text-white/60">
              Previously generated trailers for this movie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingTrailers.map((trailer) => (
                <div
                  key={trailer.id}
                  className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`capitalize mr-2 ${getStatusBadge(trailer.status).props.className}`}
                      >
                        {getStatusBadge(trailer.status)?.props.children}
                      </Badge>
                      <span className="font-medium">{trailer.voiceStyle}</span>
                      {trailer.status === 'FAILED' && (
                        <span className="text-red-500 text-xs ml-2">
                          Error: {trailer.errorMessage}
                        </span>
                      )}
                    </div>
                    <Textarea
                      value={trailer.script}
                      readOnly
                      className="text-sm bg-white/5 text-white p-2 my-2 rounded"
                      rows={3}
                    />
                    {trailer.status === 'COMPLETED' && (
                      <div className="text-sm text-white/60">
                        Size: {formatFileSize(trailer.fileSize)} • Created:{' '}
                        {new Date(trailer.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4">
                    {trailer.status === 'COMPLETED' && trailer.fileUrl && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => new Audio(trailer.fileUrl).play()}
                          className="border border-netflix-red/50 text-white"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = trailer.fileUrl;
                            link.download = `${movie.slug}-${trailer.voiceStyle}-trailer.mp3`;
                            link.click();
                          }}
                          className="border border-netflix-red/50 text-white"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTrailer(trailer.id)}
                      className="border border-destructive/50 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
