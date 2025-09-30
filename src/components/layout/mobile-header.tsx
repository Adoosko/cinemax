'use client';

import { CachedUserProfile } from '@/components/auth/cached-user-profile';
import { UpgradeModal } from '@/components/modals/upgrade-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription } from '@/lib/hooks/use-subscription';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function MobileHeader() {
  const { isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center group">
            <div className="flex items-center">
              <Image className="ml-2" src="/text-logo.png" alt="CINEMX" width={120} height={44} />
            </div>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              {!subscription ? (
                <Button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  variant="premium"
                  size="sm"
                  className="text-xs px-3 py-1 h-8"
                >
                  Upgrade
                </Button>
              ) : (
                <Badge variant="premium" className="text-xs">
                  {subscription.recurringInterval === 'year' ? 'CINEMX+' : 'CINEMX+'}
                </Badge>
              )}
              <CachedUserProfile />
            </div>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-netflix-white hover:bg-white/10"
            >
              <Link href="/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </header>

      <UpgradeModal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />
    </>
  );
}
