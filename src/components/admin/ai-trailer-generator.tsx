'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, Download, Trash2, RefreshCw } from 'lucide-react';
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

  // Load voice styles and existing trailers
  useEffect(() => {
    loadInitialData();
  }, [movie.id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Load voice styles
      const stylesResponse = await fetch('/api/admin/ai-trailers/voice-styles');
      if (stylesResponse.ok) {
        const stylesData = await stylesResponse.json();
        setVoiceStyles(stylesData.voiceStyles || []);
      }

      // Load existing trailers for this movie
      const trailersResponse = await fetch(`/api/admin/ai-trailers/generate?movieId=${movie.id}`);
      if (trailersResponse.ok) {
        const trailersData = await trailersResponse.json();
        setExistingTrailers(trailersData.trailers || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load trailer data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrailer = async (overwrite = false) => {
    if (!selectedVoiceStyle) {
      setError('Please select a voice style');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerationProgress(0);
    setGenerationStatus('Starting generation...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 1000);

      const response = await fetch('/api/admin/ai-trailers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.id,
          voiceStyle: selectedVoiceStyle,
          overwrite,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate trailer');
      }

      const data = await response.json();
      setGenerationProgress(100);
      setGenerationStatus('Trailer generated successfully!');

      // Refresh trailers list
      await loadInitialData();

      if (onTrailerGenerated) {
        onTrailerGenerated(data.trailer);
      }
    } catch (error) {
      console.error('Error generating trailer:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate trailer');
      setGenerationProgress(0);
      setGenerationStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTrailer = async (trailerId: string) => {
    if (!confirm('Are you sure you want to delete this trailer?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ai-trailers/${trailerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trailer');
      }

      // Refresh trailers list
      await loadInitialData();
    } catch (error) {
      console.error('Error deleting trailer:', error);
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

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Trailer Generator</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasExistingTrailer = existingTrailers.some(
    (trailer) => trailer.voiceStyle === selectedVoiceStyle && trailer.status === 'COMPLETED'
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Trailer Generator</CardTitle>
          <CardDescription>
            Generate AI-powered voice-over trailers for {movie.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Style</label>
            <Select value={selectedVoiceStyle} onValueChange={setSelectedVoiceStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select a voice style" />
              </SelectTrigger>
              <SelectContent>
                {voiceStyles.map((style) => (
                  <SelectItem key={style.key} value={style.key}>
                    <div>
                      <div className="font-medium">{style.name}</div>
                      <div className="text-sm text-muted-foreground">{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasExistingTrailer && (
            <Alert>
              <AlertDescription>
                A trailer with this voice style already exists. Use "Regenerate" to create a new
                one.
              </AlertDescription>
            </Alert>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{generationStatus}</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={() => generateTrailer(false)}
              disabled={isGenerating || !selectedVoiceStyle}
              className="flex-1"
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
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {existingTrailers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Trailers</CardTitle>
            <CardDescription>Previously generated trailers for this movie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingTrailers.map((trailer) => (
                <div
                  key={trailer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">{trailer.voiceStyle}</span>
                      {getStatusBadge(trailer.status)}
                    </div>

                    {trailer.status === 'COMPLETED' && (
                      <div className="text-sm text-muted-foreground">
                        Size: {formatFileSize(trailer.fileSize)} • Created:{' '}
                        {new Date(trailer.createdAt).toLocaleDateString()}
                      </div>
                    )}

                    {trailer.status === 'FAILED' && trailer.errorMessage && (
                      <div className="text-sm text-red-600">Error: {trailer.errorMessage}</div>
                    )}

                    {trailer.script && (
                      <Textarea value={trailer.script} readOnly className="text-sm" rows={3} />
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {trailer.status === 'COMPLETED' && trailer.fileUrl && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const audio = new Audio(trailer.fileUrl);
                            audio.play();
                          }}
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
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => deleteTrailer(trailer.id)}>
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
