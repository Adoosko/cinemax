import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import cors from 'cors';
import { db } from './db';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL : 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Watch Party state management
const watchPartyRooms = new Map<
  string,
  {
    hostId: string;
    movieId: string;
    participants: Map<string, { id: string; nickname: string; joinedAt: number; isHost: boolean }>;
    currentTime: number;
    isPlaying: boolean;
    playbackSpeed: number;
    lastSync: number;
    chatMessages: Array<{
      id: string;
      nickname: string;
      message: string;
      timestamp: number;
    }>;
  }
>();

// Connection rate limiting
const connectionCooldowns = new Map<string, number>();

io.on('connection', async (socket) => {
  console.log('🔌 User connected:', socket.id);

  const { watchPartyId, nickname } = socket.handshake.query;

  // Only handle watch party connections
  if (watchPartyId && nickname) {
    const partyId = watchPartyId as string;
    const userNickname = nickname as string;
    const participantId = socket.id; // Use socket.id directly to avoid duplicates
    const userId = socket.handshake.query.userId as string || null; // Get user ID if available

    // Rate limiting: prevent rapid reconnections (use socket ID for stability)
    const cooldownKey = `${partyId}_${socket.id}`;
    const now = Date.now();
    const lastConnection = connectionCooldowns.get(cooldownKey) || 0;

    if (now - lastConnection < 2000) { // 2 second cooldown
      console.log(`⏳ Connection throttled for socket ${socket.id} in party ${partyId}`);
      socket.disconnect();
      return;
    }

    connectionCooldowns.set(cooldownKey, now);

    console.log(`🎬 Watch Party connection: ${partyId}, Nickname: ${userNickname}, Socket: ${socket.id}`);

    // Check if participant is already in the room (prevent duplicate joins)
    const existingRoom = watchPartyRooms.get(partyId);
    if (existingRoom && existingRoom.participants.has(participantId)) {
      console.log(`⚠️ Participant ${userNickname} (${participantId}) already in party ${partyId}, skipping duplicate join`);
      socket.disconnect();
      return;
    }

    // Initialize room if it doesn't exist
    if (!watchPartyRooms.has(partyId)) {
      watchPartyRooms.set(partyId, {
        hostId: '', // Will be set when host joins
        movieId: '',
        participants: new Map(),
        currentTime: 0,
        isPlaying: false,
        playbackSpeed: 1,
        lastSync: Date.now(),
        chatMessages: [],
      });
    }

    const room = watchPartyRooms.get(partyId)!;
    socket.join(partyId);

    // Fetch the watch party from the database to determine the host
    try {
      // Get the watch party from the database
      const watchParty = await db.watchParty.findUnique({
        where: { id: partyId },
        include: { host: { select: { id: true } } }
      });
      
      if (!watchParty) {
        console.log(`⚠️ Watch party ${partyId} not found in database`);
        socket.emit('error', { message: 'Watch party not found' });
        socket.disconnect();
        return;
      }
      
      // Add participant to room
      const isFirstParticipant = room.participants.size === 0;
      // Check if this user is the host (either by userId or first participant)
      const isHost = userId ? (watchParty.hostUserId === userId) : isFirstParticipant;
      
      console.log(`👥 Adding participant ${userNickname} to party ${partyId}`, { 
        isHost, 
        hostUserId: watchParty.hostUserId,
        userId: userId || 'anonymous',
        isFirstParticipant
      });
      
      // Add the participant
      room.participants.set(participantId, {
        id: participantId,
        nickname: userNickname,
        joinedAt: Date.now(),
        isHost: isHost, // Set based on database record
      });
      
      // If this is the host, set the hostId
      if (isHost) {
        console.log(`👑 ${userNickname} is the host for party ${partyId}`);
        room.hostId = participantId;
      }
    } catch (error) {
      console.error('Error checking host status:', error);
      // Fallback to first participant is host
      const isFirstParticipant = room.participants.size === 0;
      room.participants.set(participantId, {
        id: participantId,
        nickname: userNickname,
        joinedAt: Date.now(),
        isHost: isFirstParticipant,
      });
      
      if (isFirstParticipant) {
        console.log(`👑 Fallback: Setting ${userNickname} as host for party ${partyId}`);
        room.hostId = participantId;
      }
    }

    console.log(`👥 Participant ${userNickname} joined watch party ${partyId}`);

    // Send current room state to new participant
    socket.emit('watch-party-joined', {
      partyId,
      participants: Array.from(room.participants.values()),
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      playbackSpeed: room.playbackSpeed,
      recentMessages: room.chatMessages.slice(-10), // Last 10 messages
    });

    // Notify others of new participant
    socket.to(partyId).emit('participant-joined', {
      participant: room.participants.get(participantId),
    });

    // Handle video sync events
    socket.on(
      'sync-video',
      (data: { currentTime: number; isPlaying: boolean; playbackSpeed?: number }) => {
        console.log(`🎬 Video sync from ${userNickname}:`, data);

        // Update room state
        room.currentTime = data.currentTime;
        room.isPlaying = data.isPlaying;
        if (data.playbackSpeed !== undefined) {
          room.playbackSpeed = data.playbackSpeed;
        }
        room.lastSync = Date.now();

        // Broadcast to all other participants in the room
        socket.to(partyId).emit('video-sync', {
          ...data,
          from: participantId,
        });
      }
    );

    // Handle chat messages
    socket.on('send-message', (data: { message: string }) => {
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nickname: userNickname,
        message: data.message.trim(),
        timestamp: Date.now(),
      };

      // Add to room chat history
      room.chatMessages.push(message);

      // Keep only last 100 messages
      if (room.chatMessages.length > 100) {
        room.chatMessages = room.chatMessages.slice(-100);
      }

      // Broadcast message to all participants
      io.to(partyId).emit('new-message', message);
      console.log(`💬 Message from ${userNickname} in party ${partyId}`);
    });

    // Handle emoji reactions
    socket.on('send-reaction', (data: { emoji: string }) => {
      io.to(partyId).emit('new-reaction', {
        emoji: data.emoji,
        from: userNickname,
        timestamp: Date.now(),
      });
      console.log(`😀 Reaction ${data.emoji} from ${userNickname} in party ${partyId}`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🎬 Participant ${userNickname} left watch party ${partyId}, reason: ${reason}`);

      // Remove participant from room
      room.participants.delete(participantId);

      // If room is empty, clean it up
      if (room.participants.size === 0) {
        watchPartyRooms.delete(partyId);
        console.log(`🧹 Cleaned up empty watch party ${partyId}`);
      } else {
        // Notify others
        socket.to(partyId).emit('participant-left', {
          participantId,
          nickname: userNickname,
        });
      }
    });
  }
});

// Clean up expired watch parties every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expiredParties: string[] = [];

  watchPartyRooms.forEach((room, partyId) => {
    // Check if party has exceeded 4 hours
    const partyAge = now - room.lastSync;
    const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

    if (partyAge > fourHours) {
      expiredParties.push(partyId);
      console.log(`🧹 Watch party ${partyId} expired after 4 hours`);
    }
  });

  // Clean up expired parties
  expiredParties.forEach((partyId) => {
    const room = watchPartyRooms.get(partyId);
    if (room) {
      // Notify all participants that the party has ended
      io.to(partyId).emit('party-ended', {
        reason: 'expired',
        message: 'This watch party has expired after 4 hours.',
      });

      // Remove all participants
      room.participants.clear();
      watchPartyRooms.delete(partyId);
    }
  });

  if (expiredParties.length > 0) {
    console.log(`🧹 Cleaned up ${expiredParties.length} expired watch parties`);
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Clean up old connection cooldowns every minute
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (5 * 60 * 1000); // 5 minutes ago

  for (const [key, timestamp] of connectionCooldowns.entries()) {
    if (timestamp < cutoff) {
      connectionCooldowns.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

const PORT = process.env.WEBSOCKET_PORT || 3001;

server.listen(PORT, () => {
  console.log(`🔌 WebSocket server running on port ${PORT}`);
  console.log(`🎬 Ready for watch party real-time sync`);
});
export { io };
