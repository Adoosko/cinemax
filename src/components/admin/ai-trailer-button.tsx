'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, Sparkles } from 'lucide-react';
import { Movie } from '@/lib/data/movies';

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
  onTrailerGenerated 
}: AiTrailerButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTrailer = async () => {
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
          voiceStyle: 'epic', // Default voice style
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate trailer');
      }

      const data = await response.json();
      
      if (onTrailerGenerated) {
        onTrailerGenerated(data.trailer);
      }

      alert('AI trailer generated successfully!');
    } catch (error) {
      console.error('Error generating trailer:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate trailer');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateTrailer}
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
  );
}
