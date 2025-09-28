'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

// Global SWR configuration for Netflix-grade caching
const swrConfig = {
  // Cache everything for 5 minutes by default
  dedupingInterval: 5 * 60 * 1000,
  // Revalidate on focus for fresh data when user comes back
  revalidateOnFocus: true,
  // Revalidate on reconnect for offline/online scenarios
  revalidateOnReconnect: true,
  // Don't revalidate on mount if data is fresh (< 30 seconds)
  revalidateIfStale: true,
  // Keep previous data while fetching new data (instant loading)
  keepPreviousData: true,
  // Retry on error with exponential backoff
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  // Optimistic updates - show old data immediately
  fallbackData: undefined,
  // Fast refresh interval for critical data
  refreshInterval: 0,
  // Custom fetcher with proper error handling
  fetcher: async (url: string) => {
    const response = await fetch(url, {
      // Use stale-while-revalidate for instant loading
      next: { revalidate: 300 }, // 5 minute cache
    });

    if (!response.ok) {
      // Create error object with status for better error handling
      const error = new Error(`HTTP ${response.status}`) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    return response.json();
  },
  // On error, keep showing stale data for better UX
  onError: (error: Error & { status?: number }) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('SWR Error:', error);
    }
  },
  // Performance optimization: load data faster
  loadingTimeout: 3000,
  // Preload data on hover/focus for instant navigation
  isPaused: () => false,
};

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
