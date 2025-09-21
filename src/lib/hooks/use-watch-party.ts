'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWatchPartyOptions {
  partyId?: string;
  nickname?: string;
  userId?: string; // User ID to identify host
  isHost?: boolean;
  onVideoSync?: (data: { currentTime: number; isPlaying: boolean; playbackSpeed?: number }) => void;
}

export function useWatchParty({
  partyId,
  nickname,
  userId,
  isHost = false,
  onVideoSync
}: UseWatchPartyOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Array<{
    id: string;
    nickname: string;
    joinedAt: number;
    isHost: boolean;
  }>>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const lastSyncRef = useRef<number>(Date.now());
  const isSyncingRef = useRef<boolean>(false);

  // Connect to watch party
  useEffect(() => {
    if (!partyId || !nickname) return;

    console.log('🎬 Connecting to watch party:', partyId, 'as', nickname);

    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      query: {
        watchPartyId: partyId,
        nickname: nickname,
        userId: userId || undefined // Pass userId to identify host
      },
      // Add connection stability options
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('🎬 Connected to watch party socket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🎬 Disconnected from watch party socket:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🎬 Socket connection error:', error);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🎬 Reconnected to watch party socket, attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🎬 Socket reconnection error:', error);
    });

    // Watch party events
    newSocket.on('watch-party-joined', (data) => {
      console.log('🎬 Joined watch party:', data);
      setParticipants(data.participants);
      setCurrentTime(data.currentTime || 0);
      setIsPlaying(data.isPlaying || false);
      setPlaybackSpeed(data.playbackSpeed || 1);
    });

    newSocket.on('participant-joined', (data) => {
      console.log('👥 Participant joined:', data.participant.nickname);
      setParticipants(prev => [...prev, data.participant]);
    });

    newSocket.on('participant-left', (data) => {
      console.log('👋 Participant left:', data.nickname);
      setParticipants(prev => prev.filter(p => p.id !== data.participantId));
    });

    newSocket.on('video-sync', (data) => {
      // Prevent sync loops by checking if we're currently syncing
      if (isSyncingRef.current) {
        console.log('🎬 Ignoring sync during active sync');
        return;
      }

      console.log('🎬 Received video sync:', data, 'isSyncing:', isSyncingRef.current);
      lastSyncRef.current = Date.now();

      // Update local state for other participants
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
      if (data.playbackSpeed) {
        setPlaybackSpeed(data.playbackSpeed);
      }

      // Only call onVideoSync if we're not the one who triggered this sync
      if (onVideoSync) {
        console.log('📥 Calling onVideoSync callback');
        onVideoSync(data);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [partyId, nickname, onVideoSync]);

  // Send video sync updates (host only or when needed)
  const syncVideo = useCallback((data: {
    currentTime: number;
    isPlaying: boolean;
    playbackSpeed?: number;
  }) => {
    if (!socket || !isConnected) {
      console.log('🎬 Sync skipped: no socket or not connected');
      return;
    }

    // Throttle sync updates to avoid spam
    const now = Date.now();
    if (now - lastSyncRef.current < 1000) {
      console.log('🎬 Sync throttled: too soon since last sync');
      return; // Max 1 sync per second
    }

    console.log('🎬 Sending video sync:', data, 'isSyncing before:', isSyncingRef.current);
    lastSyncRef.current = now;
    isSyncingRef.current = true;

    socket.emit('sync-video', data);

    // Reset sync flag after a longer delay to prevent loops
    setTimeout(() => {
      console.log('🎬 Resetting sync flag');
      isSyncingRef.current = false;
    }, 1000); // Increased from 500ms to 1000ms
  }, [socket, isConnected]);

  // Send chat messages
  const sendMessage = useCallback((message: string) => {
    if (!socket || !isConnected) return;

    socket.emit('send-message', { message });
  }, [socket, isConnected]);

  // Send emoji reactions
  const sendReaction = useCallback((emoji: string) => {
    if (!socket || !isConnected) return;

    socket.emit('send-reaction', { emoji });
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    participants,
    currentTime,
    isPlaying,
    playbackSpeed,
    syncVideo,
    sendMessage,
    sendReaction
  };
}
