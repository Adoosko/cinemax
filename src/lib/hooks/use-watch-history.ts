'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export interface WatchHistoryItem {
  id: string;
  userId: string;
  movieId: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  movie: {
    id: string;
    title: string;
    posterUrl: string | null;
    slug: string;
    streamingUrl: string | null;
  };
}

const CACHE_KEY = 'watchHistory';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheData {
  data: WatchHistoryItem[];
  timestamp: number;
}

export function useWatchHistory() {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const getCacheKey = () => `${CACHE_KEY}_${user?.id || 'anonymous'}`;

  const getCachedData = (): WatchHistoryItem[] | null => {
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
      console.error('Error reading cached watch history:', err);
      return null;
    }
  };

  const setCachedData = (data: WatchHistoryItem[]) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    } catch (err) {
      console.error('Error caching watch history:', err);
    }
  };

  const fetchWatchHistory = async (forceRefresh = false) => {
    if (!isAuthenticated) return;

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached) {
        setWatchHistory(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/watch/history');

      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }

      const data = await response.json();
      const watchHistoryData = data.watchHistory || [];
      setWatchHistory(watchHistoryData);
      setCachedData(watchHistoryData);
    } catch (err) {
      console.error('Error fetching watch history:', err);
      setError('Failed to load your watch history');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWatchHistory = async (watchHistoryId: string) => {
    try {
      const response = await fetch(`/api/watch/history?id=${watchHistoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from watch history');
      }

      // Update local state to remove the deleted item
      setWatchHistory((prev) => {
        const updated = prev.filter((item) => item.id !== watchHistoryId);
        setCachedData(updated);
        return updated;
      });

      return true;
    } catch (err) {
      console.error('Error removing from watch history:', err);
      return false;
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchWatchHistory();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  return {
    watchHistory,
    isLoading,
    error,
    refetch: () => fetchWatchHistory(true), // Force refresh when refetching
    removeFromWatchHistory,
  };
}
