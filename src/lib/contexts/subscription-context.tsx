'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  // Check localStorage synchronously for instant cached data
  const getInitialCachedSubscription = () => {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const cached = localStorage.getItem('cachedSubscription');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsed.cachedAt).getTime();
        const isCacheValid = cacheAge < 24 * 60 * 60 * 1000; // 24 hours
        if (isCacheValid && parsed.data) {
          return parsed.data;
        }
      }
    } catch (err) {
      console.warn('[SubscriptionContext] Failed to load initial cached subscription:', err);
    }
    return null;
  };

  const initialCachedSubscription = getInitialCachedSubscription();

  const [subscription, setSubscription] = useState<Subscription | null>(initialCachedSubscription);
  const [loading, setLoading] = useState(!initialCachedSubscription); // Only loading if no cached data
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch fresh subscription data from ISR API
  const fetchSubscription = async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/subscription', {
        next: { revalidate: 300 }, // 5 minutes ISR
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSubscription(data.subscription);
      setError(null);

      // Cache the fresh subscription data
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'cachedSubscription',
            JSON.stringify({
              data: data.subscription,
              cachedAt: new Date().toISOString(),
            })
          );
        }
      } catch (cacheErr) {
        console.warn('[SubscriptionContext] Failed to cache subscription:', cacheErr);
      }

      console.log('[SubscriptionContext] Updated with fresh subscription data:', data.subscription);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SubscriptionContext] Error fetching subscriptions:', errorMessage);
      setError(errorMessage);

      // For development: provide mock subscription data if API is unavailable
      if (process.env.NODE_ENV === 'development' && errorMessage.includes('fetch failed')) {
        console.warn(
          '[SubscriptionContext] Subscription API unavailable, using mock data for development'
        );
        const mockSubscription = {
          id: 'mock-subscription',
          status: 'ACTIVE',
          recurringInterval: 'monthly',
          productId: 'premium-plan',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          currentPeriodStart: new Date().toISOString(),
          product: {
            id: 'premium-plan',
            name: 'Premium Plan',
          },
        };
        setSubscription(mockSubscription);
        setError(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Manual refetch function
  const refetch = async () => {
    await fetchSubscription();
  };

  useEffect(() => {
    // If we already have cached data from initialization, just fetch fresh data in background
    if (initialCachedSubscription) {
      fetchSubscription(); // Background refresh
    } else {
      // No cached data, fetch fresh data
      fetchSubscription();
    }
  }, []);

  const value: SubscriptionContextType = {
    subscription,
    loading,
    error,
    isRefreshing,
    refetch,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

// Legacy hook for backward compatibility - now uses context
export function useSubscription() {
  return useSubscriptionContext();
}
