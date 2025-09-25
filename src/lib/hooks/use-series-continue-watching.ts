'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export interface SeriesContinueWatchingItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  seriesSlug: string;
  seriesCover: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  episodeCover: string;
  positionSeconds: number;
  progress: number;
  lastActive: string;
}

export function useSeriesContinueWatching() {
  const [continueWatching, setContinueWatching] = useState<SeriesContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchContinueWatching = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/watch/series-continue-watching');

      if (!response.ok) {
        throw new Error('Failed to fetch continue watching series');
      }

      const data = await response.json();
      setContinueWatching(data.continueWatching || []);
    } catch (err) {
      console.error('Error fetching continue watching series:', err);
      setError('Failed to load your continue watching series');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromContinueWatching = async (seriesId: string) => {
    try {
      const response = await fetch(`/api/watch/series-continue-watching?seriesId=${seriesId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from continue watching');
      }

      // Update local state to remove the deleted series
      setContinueWatching((prev) => prev.filter((item) => item.seriesId !== seriesId));

      return true;
    } catch (err) {
      console.error('Error removing from continue watching:', err);
      return false;
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchContinueWatching();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  return {
    continueWatching,
    isLoading,
    error,
    refetch: fetchContinueWatching,
    removeFromContinueWatching,
  };
}
