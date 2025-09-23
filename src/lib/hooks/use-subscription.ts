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
      .then((response: any) => {
        console.log('[useSubscription] Full response:', response);
        console.log('[useSubscription] Response data:', response?.data);

        let first: Subscription | null = null;

        // Try different possible response structures
        if (response?.data?.result?.items && Array.isArray(response.data.result.items)) {
          first = response.data.result.items[0] || null;
          console.log('[useSubscription] Found subscription in data.result.items:', first);
        } else if (response?.data && Array.isArray(response.data)) {
          first = response.data[0] || null;
          console.log('[useSubscription] Found subscription in data array:', first);
        } else if (response?.result?.items && Array.isArray(response.result.items)) {
          first = response.result.items[0] || null;
          console.log('[useSubscription] Found subscription in result.items:', first);
        } else if (Array.isArray(response)) {
          first = response[0] || null;
          console.log('[useSubscription] Found subscription in response array:', first);
        } else {
          console.log(
            '[useSubscription] Could not find subscription in response. Response structure:',
            response
          );
        }

        console.log('[useSubscription] Final subscription object:', first);
        console.log('[useSubscription] Subscription status:', first?.status);

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
