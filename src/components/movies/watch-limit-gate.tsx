'use client';

import { useState } from 'react';
import { useWatchLimit } from '@/lib/hooks/use-watch-limit';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { UpgradeModal } from '@/components/modals/upgrade-modal';

interface WatchLimitGateProps {
  children: React.ReactNode;
}

export function WatchLimitGate({ children }: WatchLimitGateProps) {
  const { watchLimit, isLoading, error, canWatchMore } = useWatchLimit();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <Loader2 className="w-8 h-8 text-netflix-red animate-spin mb-4" />
        <p className="text-white/70">Checking your watch limit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-black/50 rounded-xl">
        <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
        <p className="text-white font-medium mb-2">Unable to verify your watch limit</p>
        <p className="text-white/70 text-center max-w-md mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // If the user can watch more movies or we don't have watch limit data yet, show the children
  if (canWatchMore || !watchLimit) {
    return <>{children}</>;
  }

  // Otherwise, show the limit reached message
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-black/50 backdrop-blur-sm rounded-xl border border-white/10">
      <Lock className="w-12 h-12 text-netflix-red mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">Monthly Watch Limit Reached</h2>
      <p className="text-white/70 text-center max-w-md mb-6">
        You've watched {watchLimit.watchedCount} movies this month, which is your free plan limit.
        Upgrade to CinemaX+ for unlimited movie watching!
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="bg-netflix-red hover:bg-red-700 text-white"
        >
          Upgrade to CINEMX+
        </Button>
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
          onClick={() => (window.location.href = '/movies')}
        >
          Browse Movies
        </Button>
      </div>
      <p className="text-xs text-white/50 mt-6">
        Your watch limit will reset at the beginning of next month.
      </p>

      <UpgradeModal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />
    </div>
  );
}
