/**
 * Socket.io event handlers for Watch Party
 *
 * This file contains the server-side socket event handlers for the watch party feature.
 */

/**
 * Handle socket connections for watch parties
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
module.exports = function setupSocketHandlers(io) {
  // Store active watch parties and their participants
  const watchParties = new Map();

  io.on('connection', (socket) => {
    const { watchPartyId, nickname, userId } = socket.handshake.query;

    if (!watchPartyId || !nickname) {
      socket.disconnect();
      return;
    }

    console.log(`[Socket] User ${nickname} connected to watch party ${watchPartyId}`);

    // Join the watch party room
    socket.join(watchPartyId);

    // Get or create watch party data
    if (!watchParties.has(watchPartyId)) {
      watchParties.set(watchPartyId, {
        participants: [],
        currentTime: 0,
        isPlaying: false,
        playbackSpeed: 1,
        hostSocketId: null,
        hostUserId: null,
      });
    }

    const party = watchParties.get(watchPartyId);
    const participantId = `${socket.id}`;
    const isHost = party.participants.length === 0 || userId === party.hostUserId;

    // If this is the first participant or matches the host user ID, mark as host
    if (isHost) {
      party.hostSocketId = socket.id;
      if (userId) party.hostUserId = userId;
    }

    // Add participant to the party
    const participant = {
      id: participantId,
      nickname,
      joinedAt: Date.now(),
      isHost,
    };

    // Check for duplicates before adding
    const existingIndex = party.participants.findIndex((p) => p.nickname === nickname);
    if (existingIndex !== -1) {
      // Remove the existing participant with the same nickname
      party.participants.splice(existingIndex, 1);
    }

    party.participants.push(participant);

    // Emit watch-party-joined event to the new participant
    socket.emit('watch-party-joined', {
      participants: party.participants,
      currentTime: party.currentTime,
      isPlaying: party.isPlaying,
      playbackSpeed: party.playbackSpeed,
    });

    // Notify other participants about the new join
    socket.to(watchPartyId).emit('participant-joined', {
      participant,
    });

    // Handle video sync events
    socket.on('sync-video', (data) => {
      // Only allow sync from host
      if (socket.id === party.hostSocketId) {
        party.currentTime = data.currentTime;
        party.isPlaying = data.isPlaying;
        if (data.playbackSpeed) party.playbackSpeed = data.playbackSpeed;

        // Broadcast to all other participants
        socket.to(watchPartyId).emit('video-sync', data);
      }
    });

    // Handle sync requests from members
    socket.on('request-sync', () => {
      // Forward the request to the host
      if (party.hostSocketId && party.hostSocketId !== socket.id) {
        io.to(party.hostSocketId).emit('request-sync', {
          requesterId: socket.id,
          nickname: nickname,
        });
      }
    });

    // Handle chat messages
    socket.on('send-message', (data) => {
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nickname,
        message: data.message,
        timestamp: Date.now(),
      };

      // Broadcast to all participants including sender
      io.to(watchPartyId).emit('new-message', message);
    });

    // Handle emoji reactions
    socket.on('send-reaction', (data) => {
      const reaction = {
        emoji: data.emoji,
        from: nickname,
        timestamp: Date.now(),
      };

      // Broadcast to all participants including sender
      io.to(watchPartyId).emit('new-reaction', reaction);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket] User ${nickname} disconnected from watch party ${watchPartyId}`);

      // Remove participant from the party
      if (watchParties.has(watchPartyId)) {
        const party = watchParties.get(watchPartyId);
        const index = party.participants.findIndex((p) => p.id === participantId);

        if (index !== -1) {
          const participant = party.participants[index];
          party.participants.splice(index, 1);

          // Notify other participants
          socket.to(watchPartyId).emit('participant-left', {
            participantId,
            nickname: participant.nickname,
          });

          // If the host left, assign a new host if there are other participants
          if (participant.isHost && party.participants.length > 0) {
            const newHost = party.participants[0];
            newHost.isHost = true;
            party.hostSocketId = newHost.id;

            // Notify all participants about the new host
            io.to(watchPartyId).emit('host-changed', {
              newHostId: newHost.id,
              newHostNickname: newHost.nickname,
            });
          }

          // If no participants left, remove the party
          if (party.participants.length === 0) {
            watchParties.delete(watchPartyId);
          }
        }
      }
    });
  });
};
