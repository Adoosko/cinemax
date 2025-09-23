'use client';

import { useState, useEffect } from 'react';

interface AiTrailer {
  id: string;
  script: string;
  fileUrl: string;
  fileSize: number;
  voiceStyle: string;
  createdAt: string;
}

export function useAiTrailers(movieSlug: string) {
  const [aiTrailers, setAiTrailers] = useState<AiTrailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAiTrailers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/movies/${movieSlug}/ai-trailers`);

      if (!response.ok) {
        throw new Error('Failed to fetch AI trailers');
      }

      const data = await response.json();
      if (data.success && data.aiTrailers) {
        setAiTrailers(data.aiTrailers);
      } else {
        setAiTrailers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAiTrailers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movieSlug) {
      fetchAiTrailers();
    }
  }, [movieSlug]);

  return { aiTrailers, loading, error, refetch: fetchAiTrailers };
}
