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
  product?: {
    id: string;
    name: string;
  };
  // ...add other fields as needed!
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authClient.customer.subscriptions
      .list({ query: { page: 1, limit: 1, active: true } })
      .then(({ data }: any) => {
        console.log('[useSubscription] Raw response data:', data);

        let first: Subscription | null = null;
        if (Array.isArray(data?.result?.items)) {
          first = data.result.items[0] || null;
          console.log('[useSubscription] First subscription object:', first);
        } else {
          console.log('[useSubscription] No subscriptions found in result.items array.');
        }

        if (mounted) setSubscription(first);
      })
      .catch((err: unknown) => {
        console.error('[useSubscription] Error fetching subscriptions:', err);
        if (mounted) setSubscription(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { subscription, loading };
}
