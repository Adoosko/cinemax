'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SeatUpdate {
  seatId: string;
  status: 'available' | 'selected' | 'taken' | 'reserved';
  userId?: string;
  timestamp: number;
  isMySelection?: boolean;
}

interface UseSeatsWebSocketProps {
  showtimeId: string;
  userId?: string;
}

export function useSeatsWebSocket({ showtimeId, userId }: UseSeatsWebSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);
  const mountedRef = useRef(true);

  // ✅ Stable connection function
  const connectSocket = useCallback(() => {
    // Prevent multiple connections
    if (!mountedRef.current) return;
    if (socket?.connected) return;
    if (connectionStatus === 'connecting') return;

    console.log('🔌 Attempting to connect to WebSocket...');
    setConnectionStatus('connecting');

    const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      forceNew: false, // ✅ Don't force new connection to prevent loops
      query: {
        showtimeId,
        userId: userId || `anonymous-${Date.now()}`,
      },
    });

    // ✅ Connection success
    newSocket.on('connect', () => {
      if (!mountedRef.current) return;

      console.log('✅ Connected to seat booking socket:', newSocket.id);
      setIsConnected(true);
      setSocket(newSocket);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;

      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    // ✅ Connection lost
    newSocket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;

      console.log('🔌 Disconnected from socket:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');

      // ✅ Only auto-reconnect for network issues, not intentional disconnects
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }

      // Auto-reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts && mountedRef.current) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        reconnectAttempts.current++;

        console.log(
          `🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectSocket();
          }
        }, delay);
      }
    });

    // ✅ User count updates
    newSocket.on('users-count', (count: number) => {
      if (!mountedRef.current) return;
      console.log('👥 Online users:', count);
      setOnlineUsers(count);
    });

    // ✅ Connection errors
    newSocket.on('connect_error', (error) => {
      if (!mountedRef.current) return;

      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      setConnectionStatus('error');
    });

    // ✅ Seat reservation failures
    newSocket.on('seat-reservation-failed', ({ seatId, reason }) => {
      console.warn(`⚠️ Seat reservation failed for ${seatId}: ${reason}`);
      // Could emit this to parent component for user notification
    });

    return newSocket;
  }, [showtimeId, userId, connectionStatus]); // ✅ Include connectionStatus but not socket

  // ✅ Initialize connection only once
  useEffect(() => {
    mountedRef.current = true;

    // Only connect if we don't have a socket yet
    if (!socket) {
      const socketInstance = connectSocket();
    }

    return () => {
      mountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socket) {
        console.log('🧹 Cleaning up socket connection');
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    };
  }, [showtimeId, userId]); // ✅ Only depend on showtimeId and userId

  // ✅ Reserve seat with error handling
  const reserveSeat = useCallback(
    (seatId: string) => {
      if (socket && isConnected) {
        console.log('🪑 Reserving seat:', seatId);
        socket.emit('reserve-seat', { seatId, showtimeId, userId });
      } else {
        console.warn('⚠️ Cannot reserve seat - not connected to server');
      }
    },
    [socket, isConnected, showtimeId, userId]
  );

  // ✅ Release seat with error handling
  const releaseSeat = useCallback(
    (seatId: string) => {
      if (socket && isConnected) {
        console.log('🪑 Releasing seat:', seatId);
        socket.emit('release-seat', { seatId, showtimeId, userId });
      } else {
        console.warn('⚠️ Cannot release seat - not connected to server');
      }
    },
    [socket, isConnected, showtimeId, userId]
  );

  // ✅ Listen for seat updates
  const onSeatUpdate = useCallback(
    (callback: (update: SeatUpdate) => void) => {
      if (socket) {
        const handleSeatUpdate = (update: SeatUpdate) => {
          // ✅ Mark seats as "my selection" if they belong to current user
          const enhancedUpdate = {
            ...update,
            isMySelection: update.userId === userId,
          };
          callback(enhancedUpdate);
        };

        socket.on('seat-updated', handleSeatUpdate);
        socket.on('initial-reservations', (reservations) => {
          console.log('📋 Received initial reservations:', reservations.length);
          reservations.forEach((reservation: any) => {
            callback({
              seatId: reservation.seatId,
              status: reservation.userId === userId ? 'selected' : 'reserved',
              userId: reservation.userId,
              timestamp: reservation.reservedAt,
              isMySelection: reservation.userId === userId,
            });
          });
        });

        return () => {
          socket.off('seat-updated', handleSeatUpdate);
          socket.off('initial-reservations');
        };
      }
      return () => {};
    },
    [socket, userId]
  );

  return {
    socket,
    isConnected,
    onlineUsers,
    connectionStatus,
    reserveSeat,
    releaseSeat,
    onSeatUpdate,
  };
}
