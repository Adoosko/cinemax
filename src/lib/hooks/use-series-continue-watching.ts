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

const CACHE_KEY = 'seriesContinueWatching';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheData {
  data: SeriesContinueWatchingItem[];
  timestamp: number;
}

export function useSeriesContinueWatching() {
  const [continueWatching, setContinueWatching] = useState<SeriesContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const getCacheKey = () => `${CACHE_KEY}_${user?.id || 'anonymous'}`;

  const getCachedData = (): SeriesContinueWatchingItem[] | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(getCacheKey());
      if (!cached) return null;

      const parsed: CacheData = JSON.parse(cached);
      const now = Date.now();

      if (now - parsed.timestamp > CACHE_DURATION) {
        localStorage.removeItem(getCacheKey());
        return null;
      }

      return parsed.data;
    } catch (err) {
      console.error('Error reading cached series continue watching:', err);
      return null;
    }
  };

  const setCachedData = (data: SeriesContinueWatchingItem[]) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    } catch (err) {
      console.error('Error caching series continue watching:', err);
    }
  };

  const fetchContinueWatching = async (forceRefresh = false) => {
    if (!isAuthenticated) return;

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached) {
        setContinueWatching(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/watch/series-continue-watching');

      if (!response.ok) {
        throw new Error('Failed to fetch continue watching series');
      }

      const data = await response.json();
      const continueWatchingData = data.continueWatching || [];
      setContinueWatching(continueWatchingData);
      setCachedData(continueWatchingData);
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
      setContinueWatching((prev) => {
        const updated = prev.filter((item) => item.seriesId !== seriesId);
        setCachedData(updated);
        return updated;
      });

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
    refetch: () => fetchContinueWatching(true), // Force refresh when refetching
    removeFromContinueWatching,
  };
}
