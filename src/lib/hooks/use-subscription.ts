'use client';
import { useEffect, useState } from 'react';
import { authClient } from '../auth-client';

export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authClient.customer.subscriptions
      .list({ query: { page: 1, limit: 1, active: true } })
      .then(async ({ data }) => {
        let subscription = null;
        for await (const sub of data!) {
          subscription = sub;
          break; // Only first subscription
        }
        if (mounted) setSubscription(subscription || null);
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { subscription, loading };
}
