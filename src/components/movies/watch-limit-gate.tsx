'use client';

import { UpgradeModal } from '@/components/modals/upgrade-modal';
import { Button } from '@/components/ui/button';
import { useSubscriptionContext } from '@/lib/contexts/subscription-context';
import { useWatchLimit } from '@/lib/hooks/use-watch-limit';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';

interface WatchLimitGateProps {
  children: React.ReactNode;
}

export function WatchLimitGate({ children }: WatchLimitGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { subscription, loading: subscriptionLoading } = useSubscriptionContext();
  const { watchLimit, isLoading, error, canWatchMore } = useWatchLimit();

  // Check cached subscription immediately for instant premium detection
  const getCachedSubscription = () => {
    try {
      const cached = localStorage.getItem('cachedSubscription');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsed.cachedAt).getTime();
        const isCacheValid = cacheAge < 24 * 60 * 60 * 1000; // 24 hours
        if (isCacheValid && parsed.data?.status === 'ACTIVE') {
          return parsed.data;
        }
      }
    } catch (err) {
      console.warn('Failed to read cached subscription:', err);
    }
    return null;
  };

  const cachedSubscription = getCachedSubscription();

  // If user has cached active subscription, skip watch limit entirely (no loading)
  const hasActiveSubscription =
    cachedSubscription?.status === 'ACTIVE' || subscription?.status === 'ACTIVE';
  if (hasActiveSubscription) {
    return (
      <>
        {/* Debug overlay - shows premium status */}
        <div className="fixed top-4 right-4 bg-purple-600/80 text-white p-2 rounded text-xs z-50">
          👑 Premium User
        </div>
        {children}
      </>
    );
  }

  // Show loading state while checking subscription or watch limit
  // Skip loading if we have a cached active subscription
  if ((subscriptionLoading || isLoading) && !cachedSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-netflix-red mx-auto mb-4" />
          <p className="text-white/60">Loading watch limit...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Unable to Load Watch Limit</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-netflix-red hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If user cannot watch more, show upgrade gate
  if (!canWatchMore) {
    return (
      <>
        {/* Watch Limit Reached Screen */}
        <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
          <div className="text-center w-full max-w-sm sm:max-w-md">
            <div className="w-12 h-12 sm:w-15 sm:h-15 bg-netflix-red/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-netflix-red" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Watch Limit Reached
            </h1>

            <div className="bg-white/5 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-white/10">
              {watchLimit && (
                <div className="text-center">
                  <p className="text-white/60 text-xs sm:text-sm mb-2">You've watched</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {watchLimit.watchedCount} / {watchLimit.limit}
                  </p>
                </div>
              )}
            </div>

            <p className="text-white/60 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed px-2">
              You've reached your monthly watch limit. Upgrade to premium for unlimited movies and
              remove ads.
            </p>

            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={() => setShowUpgradeModal(true)}
                variant="premium"
                size="sm"
                className="w-full text-base py-3"
              >
                Upgrade to Premium
              </Button>

              <p className="text-white/40 text-xs sm:text-sm">
                Premium starts at $3/month • Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

        {/* Debug overlay - shows current status */}
        <div className="fixed top-4 right-4 bg-red-600/80 text-white p-2 rounded text-xs z-50">
          🚫 Limit Reached: {watchLimit ? `${watchLimit.remaining} left` : 'N/A'}
        </div>
      </>
    );
  }

  // User can watch more - show content
  return (
    <>
      {/* Debug overlay - shows current status */}
      <div className="fixed top-4 right-4 bg-green-600/80 text-white p-2 rounded text-xs z-50">
        ✅ Can Watch: {watchLimit ? `${watchLimit.remaining} left` : 'N/A'}
      </div>
      {children}
    </>
  );
}
