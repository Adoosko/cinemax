'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, Sparkles } from 'lucide-react';
import { Movie } from '@/lib/data/movies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VOICE_STYLES, VoiceStyleKey } from '@/lib/services/elevenlabs';

interface AiTrailerButtonProps {
  movie: Movie;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  onTrailerGenerated?: (trailer: any) => void;
}

export default function AiTrailerButton({
  movie,
  variant = 'default',
  size = 'default',
  onTrailerGenerated,
}: AiTrailerButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<VoiceStyleKey>('epic');

  const generateTrailer = async (overwrite = false) => {
    if (!movie.id || !movie.slug) {
      alert('Movie must be saved with a slug before generating trailers');
      return;
    }

    setIsGenerating(true);

    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', response.status, errorData);

        // Handle the specific case where trailer already exists
        if (response.status === 409 && !overwrite) {
          console.log('Showing overwrite confirmation dialog');
          // We'll handle this in a separate state later
          throw new Error(
            'A trailer already exists for this movie and voice style. Use overwrite functionality.'
          );
        }

        throw new Error(errorData.error || 'Failed to generate trailer');
      }

      const data = await response.json();

      if (onTrailerGenerated) {
        onTrailerGenerated(data.trailer);
      }

      alert('AI trailer generated successfully!');
      setShowDialog(false);
    } catch (error) {
      console.error('Error generating trailer:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate trailer');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    setShowDialog(true);
  };

  const handleGenerateConfirm = () => {
    generateTrailer(false);
  };

  return (
    <>
      <Button
        onClick={handleGenerateClick}
        disabled={isGenerating || !movie.id}
        variant={variant}
        size={size}
        className="flex items-center space-x-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <Mic className="h-4 w-4" />
            <span>Generate AI Trailer</span>
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate AI Trailer</DialogTitle>
            <DialogDescription>
              Choose a voice style for the trailer narration for "{movie.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Style</label>
              <div className="grid gap-2">
                {Object.entries(VOICE_STYLES).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedVoiceStyle(key as VoiceStyleKey)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedVoiceStyle === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{style.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {style.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateConfirm}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Trailer</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
