'use client';

import { useSession } from '@/lib/auth-client';

export function useAuth() {
  const session = useSession(); // ✅ Now properly typed from better-auth/react

  return {
    user: session.data?.user || null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    error: session.error,
    refetch: async () => {
      // Force refetch session
      window.location.reload(); // Simple solution for now
    },
  };
}
