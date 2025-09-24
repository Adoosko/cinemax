'use client';
import { useEffect, useState } from 'react';
import { authClient } from '../auth-client';

export interface Subscription {
  id: string;
  status?: string;
  recurringInterval?: string;
  productId?: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  portalUrl?: string;
  product?: {
    id: string;
    name: string;
  };
  // ...add other fields as needed!
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    let hasCachedData = false;

    // Immediately load cached subscription data
    const loadCachedSubscription = () => {
      try {
        const cached = localStorage.getItem('cachedSubscription');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Check if cache is still valid (less than 24 hours old)
          const cacheAge = Date.now() - new Date(parsed.cachedAt).getTime();
          const isCacheValid = cacheAge < 24 * 60 * 60 * 1000; // 24 hours

          if (isCacheValid && mounted) {
            setSubscription(parsed.data);
            hasCachedData = true;
            setLoading(false); // Stop loading immediately when we have cached data
            console.log('[useSubscription] Loaded cached subscription:', parsed.data);
          }
        }
      } catch (err) {
        console.warn('[useSubscription] Failed to load cached subscription:', err);
      }
    };

    // Load cached data immediately
    loadCachedSubscription();

    // If we don't have cached data, set loading to false immediately and provide instant feedback
    // The API call will update the data in the background
    if (!hasCachedData) {
      // For instant loading, set loading to false immediately
      // This allows the UI to render without cached data while API call happens in background
      setLoading(false);

      // Optional: Set a default state for instant feedback (no subscription)
      // This prevents any loading delays for users without cached data
    }

    // Fetch fresh data from Polar API in background
    const fetchFreshSubscription = async () => {
      if (mounted) {
        setIsRefreshing(true);
      }

      try {
        const response: any = await authClient.customer.subscriptions.list({
          query: { page: 1, limit: 1, active: true }
        });

        let first: Subscription | null = null;

        // Try different possible response structures
        if (response?.data?.result?.items && Array.isArray(response.data.result.items)) {
          first = response.data.result.items[0] || null;
        } else if (response?.data && Array.isArray(response.data)) {
          first = response.data[0] || null;
        } else if (response?.result?.items && Array.isArray(response.result.items)) {
          first = response.result.items[0] || null;
        } else if (Array.isArray(response)) {
          first = response[0] || null;
        }

        if (mounted) {
          setSubscription(first);
          setError(null);

          // Cache the fresh subscription data
          try {
            localStorage.setItem('cachedSubscription', JSON.stringify({
              data: first,
              cachedAt: new Date().toISOString()
            }));
          } catch (cacheErr) {
            console.warn('[useSubscription] Failed to cache subscription:', cacheErr);
          }

          console.log('[useSubscription] Updated with fresh subscription data:', first);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useSubscription] Error fetching subscriptions:', errorMessage);

        // Handle specific Polar API errors
        if (mounted) {
          setError(errorMessage);

          // For development: provide mock subscription data if Polar is unavailable
          if (process.env.NODE_ENV === 'development' && errorMessage.includes('fetch failed')) {
            console.warn(
              '[useSubscription] Polar API unavailable, using mock data for development'
            );
            // Uncomment the line below if you want to use mock data during development
            // setSubscription({ id: 'mock-subscription', status: 'ACTIVE', recurringInterval: 'monthly' } as Subscription);
          }
        }
      } finally {
        if (mounted) {
          setIsRefreshing(false); // Stop refreshing indicator after API call completes
        }
      }
    };

    // Fetch fresh data in background
    fetchFreshSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  return { subscription, loading, error, isRefreshing };
}
