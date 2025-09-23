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
  onVideoSync,
}: UseWatchPartyOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{
      id: string;
      nickname: string;
      joinedAt: number;
      isHost: boolean;
    }>
  >([]);
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
        userId: userId || undefined, // Pass userId to identify host
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

      // Prevent duplicate participants by using Map with unique IDs
      const uniqueParticipants = Array.from(
        new Map(data.participants.map((p: any) => [p.id, p]))
      ).map(
        ([_, participant]) =>
          participant as {
            id: string;
            nickname: string;
            joinedAt: number;
            isHost: boolean;
          }
      );

      setParticipants(uniqueParticipants);
      setCurrentTime(data.currentTime || 0);
      setIsPlaying(data.isPlaying || false);
      setPlaybackSpeed(data.playbackSpeed || 1);

      // Apply video sync immediately upon joining
      if (!isHost && onVideoSync && data.currentTime !== undefined) {
        console.log('🎬 Initial sync on join:', {
          currentTime: data.currentTime,
          isPlaying: data.isPlaying || false,
          playbackSpeed: data.playbackSpeed || 1,
        });

        onVideoSync({
          currentTime: data.currentTime,
          isPlaying: data.isPlaying || false,
          playbackSpeed: data.playbackSpeed || 1,
        });
      }
    });

    newSocket.on('participant-joined', (data) => {
      console.log('👥 Participant joined:', data.participant.nickname);

      // Prevent duplicate participants by checking if ID already exists
      setParticipants((prev) => {
        // Check if this participant ID already exists
        const exists = prev.some((p) => p.id === data.participant.id);
        if (exists) {
          console.log('⚠️ Prevented duplicate participant:', data.participant.nickname);
          return prev; // Don't add duplicate
        }
        return [...prev, data.participant];
      });

      // If host, send current playback state to the new participant
      if (isHost) {
        console.log('👑 Host sending current state to new participant');
        setTimeout(() => {
          syncVideo({
            currentTime: currentTime,
            isPlaying: isPlaying,
            playbackSpeed: playbackSpeed,
          });
        }, 1000); // Small delay to ensure the new participant is ready
      }
    });

    newSocket.on('participant-left', (data) => {
      console.log('👋 Participant left:', data.nickname);
      setParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
    });

    // Handle sync requests from members
    newSocket.on('request-sync', (data) => {
      // Only hosts should respond to sync requests
      if (isHost) {
        console.log('📢 Host received sync request, sending current state');
        setTimeout(() => {
          syncVideo({
            currentTime: currentTime,
            isPlaying: isPlaying,
            playbackSpeed: playbackSpeed,
          });
        }, 500); // Small delay to ensure the requester is ready
      }
    });

    newSocket.on('video-sync', (data) => {
      // For non-host members, always apply sync regardless of local state
      // For hosts, prevent sync loops by checking if we're currently syncing
      if (isHost && isSyncingRef.current) {
        console.log('🎬 Host ignoring sync during active sync');
        return;
      }

      console.log('🎬 Received video sync:', data);
      lastSyncRef.current = Date.now();

      // Update local state
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
      if (data.playbackSpeed) {
        setPlaybackSpeed(data.playbackSpeed);
      }

      // For non-host members, always apply sync to video element
      // This ensures members stay in sync with host
      if (!isHost && onVideoSync) {
        console.log('📥 Member applying host sync');
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

  /**
   * Send video sync updates - Host only function
   * This function is the core of the watch party synchronization system.
   * Only hosts can send sync updates to maintain a single source of truth.
   */
  const syncVideo = useCallback(
    (data: {
      currentTime: number;
      isPlaying: boolean;
      playbackSpeed?: number;
      requestSync?: boolean; // Added to support sync requests from members
    }) => {
      if (!socket || !isConnected) {
        console.log('🎬 Sync skipped: no socket or not connected');
        return;
      }

      // Special case: Allow sync requests from members
      if (data.requestSync && !isHost) {
        console.log('📢 Member requesting sync from host');
        socket.emit('request-sync');
        return;
      }

      // WATCH PARTY CONTROL LOCK: Only hosts can send regular sync updates
      if (!isHost) {
        console.log('🔒 Non-host blocked from sending sync updates - host-only mode');
        return;
      }

      // For critical events (play/pause), bypass throttling
      const now = Date.now();
      const isPlayStateChange = data.isPlaying !== isPlaying;
      const isSignificantSeek = Math.abs(data.currentTime - currentTime) > 3;

      // Throttle regular updates but allow critical events
      if (!isPlayStateChange && !isSignificantSeek && now - lastSyncRef.current < 500) {
        console.log('🎬 Sync throttled: too soon since last sync');
        return; // Throttle regular updates
      }

      console.log('👑 Host sending video sync:', {
        currentTime: data.currentTime.toFixed(2),
        isPlaying: data.isPlaying,
        playbackSpeed: data.playbackSpeed,
        isPlayStateChange,
        isSignificantSeek,
      });

      lastSyncRef.current = now;
      isSyncingRef.current = true;

      // Update local state to match what we're sending
      setCurrentTime(data.currentTime);
      setIsPlaying(data.isPlaying);
      if (data.playbackSpeed) setPlaybackSpeed(data.playbackSpeed);

      // Send to all members
      socket.emit('sync-video', data);

      // Reset sync flag after a brief delay
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 500);
    },
    [socket, isConnected, isHost]
  );

  // Send chat messages
  const sendMessage = useCallback(
    (message: string) => {
      if (!socket || !isConnected) return;

      socket.emit('send-message', { message });
    },
    [socket, isConnected]
  );

  // Send emoji reactions
  const sendReaction = useCallback(
    (emoji: string) => {
      if (!socket || !isConnected) return;

      socket.emit('send-reaction', { emoji });
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    participants,
    currentTime,
    isPlaying,
    playbackSpeed,
    syncVideo,
    sendMessage,
    sendReaction,
  };
}
