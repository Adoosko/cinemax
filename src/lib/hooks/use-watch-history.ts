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

export function useWatchHistory() {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchWatchHistory = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/watch/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }
      
      const data = await response.json();
      setWatchHistory(data.watchHistory || []);
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
      setWatchHistory((prev) => 
        prev.filter((item) => item.id !== watchHistoryId)
      );
      
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
    refetch: fetchWatchHistory,
    removeFromWatchHistory,
  };
}
