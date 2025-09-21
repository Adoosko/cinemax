'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Crown, Clock, Copy, Check } from 'lucide-react';
import { useSubscription } from '@/lib/hooks/use-subscription';

interface CreateWatchPartyButtonProps {
  movieId: string;
  movieTitle: string;
  className?: string;
}

interface WatchPartyResponse {
  success: boolean;
  watchParty: {
    id: string;
    host: {
      id: string;
      name: string;
      firstName?: string;
      lastName?: string;
    };
    movie: {
      id: string;
      title: string;
      posterUrl?: string;
    };
    createdAt: string;
    expiresAt: string;
    maxGuests: number;
  };
  inviteLink: string;
  existingParty?: {
    id: string;
    inviteLink: string;
  };
}

export function CreateWatchPartyButton({
  movieId,
  movieTitle,
  className = '',
}: CreateWatchPartyButtonProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [watchPartyData, setWatchPartyData] = useState<WatchPartyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [existingParty, setExistingParty] = useState<WatchPartyResponse['existingParty'] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateParty = async () => {
    console.log('Creating watch party for movie:', movieId);
    // Since useSubscription already filters for active subscriptions, just check if we have one
    if (!subscription) {
      setError('Premium subscription required to create watch parties');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/watch-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId }),
      });

      console.log('Watch party created:', response);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError('Premium subscription required to create watch parties');
        } else if (response.status === 409) {
          // User already has an active party - show option to join it
          if (data.partyId && data.inviteLink) {
            setExistingParty({
              id: data.partyId,
              inviteLink: data.inviteLink
            });
            setShowDialog(true);
          }
          setError(data.message || 'You already have an active watch party');
        } else {
          setError(data.error || 'Failed to create watch party');
        }
        return;
      }

      setWatchPartyData(data);
      setShowDialog(true);
    } catch (err) {
      setError('Failed to create watch party. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = async () => {
    if (!watchPartyData) return;

    try {
      await navigator.clipboard.writeText(watchPartyData.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = watchPartyData.inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deleteParty = async () => {
    if (!existingParty) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/watch-party?partyId=${existingParty.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExistingParty(null);
        setShowDialog(false);
        setError(null);
        // Refresh or show success message
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete watch party');
      }
    } catch (err) {
      setError('Failed to delete watch party. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleCreateParty}
        disabled={isCreating || subscriptionLoading || !subscription}
        className={`bg-netflix-red hover:bg-red-700 text-white ${className}`}
        size="lg"
      >
        {subscriptionLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </>
        ) : !subscription ? (
          <>
            <Crown className="w-5 h-5 mr-2" />
            Premium Required
          </>
        ) : isCreating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Creating...
          </>
        ) : (
          <>
            <Users className="w-5 h-5 mr-2" />
            Create Watch Party
          </>
        )}
      </Button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-netflix-dark-gray/50 border border-netflix-red/30 rounded-lg backdrop-blur-sm"
        >
          <p className="text-netflix-red text-sm font-medium">{error}</p>
          {!subscription && (
            <p className="text-netflix-text-gray text-xs mt-1">
              Upgrade to premium to create watch parties with friends!
            </p>
          )}
        </motion.div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-netflix-dark-gray border-netflix-medium-gray">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-netflix-white">
              <Crown className="w-5 h-5 text-netflix-red" />
              Watch Party Created!
            </DialogTitle>
          </DialogHeader>

          {watchPartyData && (
            <div className="space-y-4">
              {/* Party Details */}
              <Card className="bg-netflix-medium-gray border-netflix-light-gray">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {watchPartyData.watchParty.movie.posterUrl && (
                      <img
                        src={watchPartyData.watchParty.movie.posterUrl}
                        alt={watchPartyData.watchParty.movie.title}
                        className="w-16 h-24 object-cover rounded border border-netflix-light-gray"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-netflix-white">
                        {watchPartyData.watchParty.movie.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-netflix-red/20 text-netflix-red border-netflix-red/30">
                          <Users className="w-3 h-3 mr-1" />
                          Host: {watchPartyData.watchParty.host.firstName || watchPartyData.watchParty.host.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-netflix-text-gray">
                        <Clock className="w-4 h-4" />
                        Expires in 4 hours
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invite Link */}
              <div>
                <label className="text-sm font-medium text-netflix-white">Invite Link</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={watchPartyData.inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-netflix-medium-gray border border-netflix-light-gray rounded-md text-sm font-mono text-netflix-white placeholder-netflix-text-gray focus:border-netflix-red focus:outline-none"
                  />
                  <Button
                    onClick={copyInviteLink}
                    variant="outline"
                    size="sm"
                    className="border-netflix-light-gray bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-netflix-red rounded-full"></div>
                  <span className="text-netflix-text-gray">Synchronized playback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-netflix-red rounded-full"></div>
                  <span className="text-netflix-text-gray">Real-time chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-netflix-red rounded-full"></div>
                  <span className="text-netflix-text-gray">Emoji reactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-netflix-red rounded-full"></div>
                  <span className="text-netflix-text-gray">Up to {watchPartyData.watchParty.maxGuests} guests</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => router.push(watchPartyData.inviteLink)} className="flex-1 bg-netflix-red hover:bg-netflix-dark-red text-netflix-white">
                  Join Party
                </Button>
                <Button
                  onClick={() => setShowDialog(false)}
                  variant="outline"
                  className="flex-1 border-netflix-light-gray bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {existingParty && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-netflix-white mb-2">You Already Have an Active Watch Party!</h3>
                <p className="text-netflix-text-gray text-sm">You can join your existing party or create a new one after ending the current one.</p>
              </div>

              {/* Invite Link */}
              <div>
                <label className="text-sm font-medium text-netflix-white">Your Party Link</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={existingParty.inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-netflix-medium-gray border border-netflix-light-gray rounded-md text-sm font-mono text-netflix-white placeholder-netflix-text-gray focus:border-netflix-red focus:outline-none"
                  />
                  <Button
                    onClick={copyInviteLink}
                    variant="outline"
                    size="sm"
                    className="border-netflix-light-gray bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(existingParty.inviteLink)}
                  className="flex-1 bg-netflix-red hover:bg-netflix-dark-red text-netflix-white"
                >
                  Join My Party
                </Button>
                <Button
                  onClick={deleteParty}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex-1 bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white border-netflix-light-gray"
                >
                  {isDeleting ? 'Ending...' : 'End Party'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
