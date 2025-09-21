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
  // TEMPORARILY DISABLE WATCH LIMIT FOR TESTING
  return (
    <>
      {/* Debug overlay - shows current status */}
      <div className="fixed top-4 right-4 bg-green-600/80 text-white p-2 rounded text-xs z-50">
        🎬 Watch Limit DISABLED for testing
      </div>
      {children}
    </>
  );
}
