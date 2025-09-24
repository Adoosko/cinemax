'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Crown, Clock, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSubscription } from '@/lib/hooks/use-subscription';

interface CreateWatchPartyButtonProps {
  movieId: string;
  movieTitle: string;
  className?: string;
}

export function CreateWatchPartyButton({
  movieId,
  movieTitle,
  className = '',
}: CreateWatchPartyButtonProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [partyData, setPartyData] = useState<{ inviteLink: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [copied, setCopied] = useState(false);

  const handleCreateParty = async () => {
    if (!subscription) {
      setError('Premium subscription required to create watch parties');
    }
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/watch-party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId }),
      });
      const data = await response.json();
      if (response.ok) {
        setPartyData({ inviteLink: data.inviteLink });
        setShowDialog(true);
      } else {
        setError(data.error || 'Failed to create watch party');
      }
    } catch {
      setError('Failed to create watch party. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = async () => {
    if (!partyData) return;
    try {
      await navigator.clipboard.writeText(partyData.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <Button
        onClick={handleCreateParty}
        disabled={isCreating || subscriptionLoading || !subscription}
        variant={'glass'}
        size={'sm'}
      >
        {subscriptionLoading ? (
          <>Loading...</>
        ) : !subscription ? (
          <>
            <Crown className="w-5 h-5 mr-2" /> Party
          </>
        ) : isCreating ? (
          <>Creating...</>
        ) : (
          <>
            <Users className="w-5 h-5 mr-2" />
            Party
          </>
        )}
      </Button>
      {error && (
        <div className="mt-2 p-2 bg-netflix-dark-gray border border-netflix-red/30 rounded text-netflix-red text-sm">
          {error}
        </div>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-netflix-black border border-netflix-medium-gray">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-netflix-red" /> Watch Party Created!
            </DialogTitle>
          </DialogHeader>
          {partyData && (
            <Card className="bg-transparent border-0 mb-4 p-4">
              <span className="text-white text-lg font-semibold mb-1">{movieTitle}</span>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-netflix-red/20 text-netflix-red">Host: You</Badge>
                <Clock className="w-4 h-4 text-netflix-text-gray" />
                Expires in 4 hours
              </div>
            </Card>
          )}
          {partyData && (
            <div>
              <label className="text-sm font-medium text-white">Invite Link</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={partyData.inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-netflix-medium-gray border border-netflix-light-gray rounded-md text-sm font-mono text-white"
                />
                <Button onClick={copyInviteLink} size="sm">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
          <Button onClick={() => router.push(partyData?.inviteLink || '/')} variant={'premium'}>
            Join Party
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
