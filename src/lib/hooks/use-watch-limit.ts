'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export interface WatchLimit {
  isPremium: boolean;
  watchedCount: number;
  remaining: number;
  limit: number;
}

export function useWatchLimit() {
  const [watchLimit, setWatchLimit] = useState<WatchLimit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchWatchLimit = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/watch/remaining');
      
      if (!response.ok) {
        throw new Error('Failed to fetch watch limit');
      }
      
      const data = await response.json();
      setWatchLimit(data);
    } catch (err) {
      console.error('Error fetching watch limit:', err);
      setError('Failed to load your watch limit');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchWatchLimit();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  return {
    watchLimit,
    isLoading,
    error,
    refetch: fetchWatchLimit,
    canWatchMore: watchLimit ? watchLimit.remaining > 0 || watchLimit.isPremium : false,
  };
}
