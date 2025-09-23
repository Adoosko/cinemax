'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Clock, Play, MessageCircle } from 'lucide-react';
import Image from 'next/image';

interface WatchParty {
  id: string;
  host: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    image?: string;
  };
  movie: {
    id: string;
    title: string;
    posterUrl?: string;
    backdropUrl?: string;
    description?: string;
    duration?: number;
    genre?: string[];
    rating?: string;
    director?: string;
    cast?: string[];
    streamingUrl?: string;
  };
  createdAt: string;
  expiresAt: string;
  maxGuests: number;
  isActive: boolean;
}

export default function WatchPartyPage() {
  const params = useParams();
  const router = useRouter();
  const partyId = params.id as string;

  const [watchParty, setWatchParty] = useState<WatchParty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchWatchParty();
  }, [partyId]);

  const fetchWatchParty = async () => {
    try {
      const response = await fetch(`/api/watch-party/${partyId}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 410) {
          setError(data.error);
        } else {
          setError('Failed to load watch party');
        }
        return;
      }

      setWatchParty(data.watchParty);
    } catch (err) {
      setError('Failed to load watch party');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinParty = async () => {
    if (!nickname.trim()) return;

    setIsJoining(true);
    try {
      // Navigate to the actual watch page with the movie and party context
      router.push(
        `/movies/${watchParty!.movie.id}/watch?party=${partyId}&nickname=${encodeURIComponent(nickname.trim())}`
      );
    } catch (err) {
      setError('Failed to join watch party');
      setIsJoining(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading watch party...</p>
        </div>
      </div>
    );
  }

  if (error || !watchParty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-red-900/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-2">Watch Party Unavailable</h1>
          <p className="text-white/70 mb-6 leading-relaxed">
            {error || 'This watch party could not be found or has ended.'}
          </p>

          <Button
            onClick={() => router.push('/movies')}
            className="bg-netflix-red hover:bg-red-700 text-white"
          >
            Browse Movies
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        {watchParty.movie.backdropUrl && (
          <div className="absolute inset-0">
            <Image
              src={watchParty.movie.backdropUrl}
              alt={watchParty.movie.title}
              fill
              className="object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
        )}

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Movie Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-netflix-red/20 text-netflix-red">
                  <Users className="w-3 h-3 mr-1" />
                  Watch Party
                </Badge>
                <Badge variant="outline" className="text-white/70">
                  <Clock className="w-3 h-3 mr-1" />
                  {getTimeUntilExpiry(watchParty.expiresAt)}
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                {watchParty.movie.title}
              </h1>

              <div className="flex items-center gap-4 mb-6 text-white/70">
                {watchParty.movie.rating && (
                  <span className="px-2 py-1 bg-white/10 rounded text-sm">
                    {watchParty.movie.rating}
                  </span>
                )}
                {watchParty.movie.duration && (
                  <span>
                    {Math.floor(watchParty.movie.duration / 60)}h {watchParty.movie.duration % 60}m
                  </span>
                )}
                {watchParty.movie.genre && watchParty.movie.genre.length > 0 && (
                  <span>{watchParty.movie.genre.slice(0, 2).join(', ')}</span>
                )}
              </div>

              <p className="text-white/80 text-lg mb-8 leading-relaxed max-w-2xl">
                {watchParty.movie.description}
              </p>

              {/* Host Info */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-netflix-red rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {watchParty.host.firstName?.[0] || watchParty.host.name?.[0] || 'H'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    Hosted by {watchParty.host.firstName || watchParty.host.name}
                  </p>
                  <p className="text-white/60 text-sm">
                    Started {formatTime(watchParty.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Join Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-center">
                    You've been invited to a watch party!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center text-white/70 mb-4">
                    <p>
                      Join up to {watchParty.maxGuests} people for a synchronized viewing
                      experience.
                    </p>
                    <p className="text-sm mt-2">No account required - just pick a nickname!</p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Enter your nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinParty()}
                      maxLength={20}
                    />

                    <Button
                      onClick={handleJoinParty}
                      disabled={!nickname.trim() || isJoining}
                      className="w-full bg-netflix-red hover:bg-red-700 text-white"
                      size="lg"
                    >
                      {isJoining ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Join Watch Party
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center text-white/50 text-sm space-y-1">
                    <p>🎬 Synchronized playback</p>
                    <p>💬 Real-time chat</p>
                    <p>😀 Emoji reactions</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-netflix-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-netflix-red" />
            </div>
            <h3 className="text-white font-semibold mb-2">Group Watching</h3>
            <p className="text-white/70 text-sm">
              Watch together with friends and family from anywhere
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-netflix-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-netflix-red" />
            </div>
            <h3 className="text-white font-semibold mb-2">Live Chat</h3>
            <p className="text-white/70 text-sm">Chat with participants during the movie</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-netflix-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-6 h-6 text-netflix-red" />
            </div>
            <h3 className="text-white font-semibold mb-2">Sync Playback</h3>
            <p className="text-white/70 text-sm">Everyone stays perfectly in sync</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
