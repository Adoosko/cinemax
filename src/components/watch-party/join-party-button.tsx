'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Play, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JoinPartyButtonProps {
  movieId: string;
  slug: string;
  className?: string;
}

interface ActiveParty {
  id: string;
  host: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  participantCount: number;
  createdAt: string;
  isActive: boolean;
}

export function JoinPartyButton({ movieId, slug, className = '' }: JoinPartyButtonProps) {
  const [activeParty, setActiveParty] = useState<ActiveParty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for active parties for this movie
  useEffect(() => {
    const checkActiveParties = async () => {
      try {
        const response = await fetch(`/api/movies/${slug}/active-parties`);
        if (response.ok) {
          const data = await response.json();
          if (data.activeParties && data.activeParties.length > 0) {
            setActiveParty(data.activeParties[0]); // Get the most recent active party
          }
        }
      } catch (error) {
        console.error('Error checking active parties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveParties();

    // Check every 30 seconds for active parties
    const interval = setInterval(checkActiveParties, 30000);
    return () => clearInterval(interval);
  }, [movieId]);

  const joinParty = () => {
    if (!activeParty) return;

    // Navigate to the movie watch page with party parameters
    const url = `/movies/${movieId}/watch?party=${activeParty.id}`;
    router.push(url);
  };

  const getHostDisplayName = (host: ActiveParty['host']) => {
    if (host.firstName && host.lastName) {
      return `${host.firstName} ${host.lastName}`;
    }
    return host.name || 'Someone';
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-300 rounded-lg w-32"></div>
      </div>
    );
  }

  if (!activeParty) {
    return null; // No active parties to join
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-500/30">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
        Live Watch Party
      </Badge>

      <div className="bg-netflix-dark-gray/80 backdrop-blur-sm border border-netflix-light-gray/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-netflix-white font-medium text-sm">
              {getHostDisplayName(activeParty.host)}'s Party
            </p>
            <div className="flex items-center gap-3 text-netflix-text-gray text-xs">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {activeParty.participantCount} watching
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started {getTimeAgo(activeParty.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={joinParty}
          className="w-full bg-netflix-red hover:bg-netflix-dark-red text-white font-semibold"
          size="sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Join Watch Party
        </Button>
      </div>
    </div>
  );
}
