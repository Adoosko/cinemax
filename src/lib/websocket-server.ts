import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL : 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  // ✅ Add connection stability settings
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Store seat reservations in memory (in production, use Redis)
const seatReservations = new Map<
  string,
  {
    seatId: string;
    userId: string;
    showtimeId: string;
    reservedAt: number;
    expiresAt: number;
  }
>();

// ✅ Fix user tracking - track by userId, not socketId
const connectedUsers = new Map<string, Map<string, string>>(); // showtimeId -> userId -> socketId
const userSockets = new Map<string, string>(); // socketId -> userId

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  const { showtimeId, userId } = socket.handshake.query;

  if (!showtimeId || !userId) {
    console.log('❌ Missing showtimeId or userId, disconnecting');
    socket.disconnect();
    return;
  }

  const showtimeIdStr = showtimeId as string;
  const userIdStr = userId as string;

  // ✅ Track user by userId, not socketId
  userSockets.set(socket.id, userIdStr);

  // Add user to showtime room
  socket.join(showtimeIdStr);

  // ✅ Proper user tracking - prevent duplicate counting
  if (!connectedUsers.has(showtimeIdStr)) {
    connectedUsers.set(showtimeIdStr, new Map());
  }

  const showtimeUsers = connectedUsers.get(showtimeIdStr)!;
  const previousSocketId = showtimeUsers.get(userIdStr);

  // If user already connected from another tab/device, remove old connection
  if (previousSocketId && previousSocketId !== socket.id) {
    console.log(`🔄 User ${userIdStr} reconnecting, removing old connection ${previousSocketId}`);
    const oldSocket = io.sockets.sockets.get(previousSocketId);
    if (oldSocket) {
      oldSocket.disconnect();
    }
  }

  showtimeUsers.set(userIdStr, socket.id);

  // ✅ Send accurate user count (unique users, not socket connections)
  const uniqueUserCount = showtimeUsers.size;
  console.log(`📊 Showtime ${showtimeIdStr} now has ${uniqueUserCount} unique users`);
  io.to(showtimeIdStr).emit('users-count', uniqueUserCount);

  // Send current seat reservations for this showtime
  const showtimeReservations = Array.from(seatReservations.values()).filter(
    (reservation) => reservation.showtimeId === showtimeIdStr && reservation.expiresAt > Date.now()
  );

  socket.emit('initial-reservations', showtimeReservations);

  // Handle seat reservation
  socket.on('reserve-seat', ({ seatId, showtimeId: currentShowtimeId, userId: currentUserId }) => {
    console.log(`🪑 User ${currentUserId} reserving seat ${seatId}`);

    const reservationKey = `${currentShowtimeId}-${seatId}`;
    const existingReservation = seatReservations.get(reservationKey);

    // Check if seat is already reserved by someone else
    if (
      existingReservation &&
      existingReservation.userId !== currentUserId &&
      existingReservation.expiresAt > Date.now()
    ) {
      console.log(`❌ Seat ${seatId} already reserved by ${existingReservation.userId}`);
      socket.emit('seat-reservation-failed', { seatId, reason: 'Already reserved' });
      return;
    }

    // Create new reservation
    const reservation = {
      seatId,
      userId: currentUserId as string,
      showtimeId: currentShowtimeId,
      reservedAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    seatReservations.set(reservationKey, reservation);
    console.log(`✅ Seat ${seatId} reserved by ${currentUserId}`);

    // Notify all users in the showtime
    io.to(currentShowtimeId).emit('seat-updated', {
      seatId,
      status: 'reserved',
      userId: currentUserId,
      timestamp: Date.now(),
      isMySelection: false, // Will be handled on client side
    });
  });

  // Handle seat release
  socket.on('release-seat', ({ seatId, showtimeId: currentShowtimeId, userId: currentUserId }) => {
    console.log(`🪑 User ${currentUserId} releasing seat ${seatId}`);

    const reservationKey = `${currentShowtimeId}-${seatId}`;
    const existingReservation = seatReservations.get(reservationKey);

    // Only allow user to release their own seats
    if (existingReservation && existingReservation.userId === currentUserId) {
      seatReservations.delete(reservationKey);
      console.log(`✅ Seat ${seatId} released by ${currentUserId}`);

      // Notify all users
      io.to(currentShowtimeId).emit('seat-updated', {
        seatId,
        status: 'available',
        userId: null,
        timestamp: Date.now(),
      });
    }
  });

  // ✅ Handle disconnect properly
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User disconnected: ${socket.id}, reason: ${reason}`);

    const disconnectedUserId = userSockets.get(socket.id);
    if (!disconnectedUserId) return;

    userSockets.delete(socket.id);

    // Remove user from showtime tracking only if this was their active socket
    const showtimeUsers = connectedUsers.get(showtimeIdStr);
    if (showtimeUsers && showtimeUsers.get(disconnectedUserId) === socket.id) {
      showtimeUsers.delete(disconnectedUserId);

      // Update user count
      const uniqueUserCount = showtimeUsers.size;
      console.log(
        `📊 Showtime ${showtimeIdStr} now has ${uniqueUserCount} unique users after disconnect`
      );
      io.to(showtimeIdStr).emit('users-count', uniqueUserCount);

      // ✅ Release seats after a delay (user might reconnect)
      setTimeout(() => {
        // Double-check user hasn't reconnected
        const currentUsers = connectedUsers.get(showtimeIdStr);
        if (currentUsers && !currentUsers.has(disconnectedUserId)) {
          console.log(`🧹 Releasing seats for disconnected user ${disconnectedUserId}`);

          const userReservations = Array.from(seatReservations.entries()).filter(
            ([_, reservation]) =>
              reservation.userId === disconnectedUserId && reservation.showtimeId === showtimeIdStr
          );

          userReservations.forEach(([key, reservation]) => {
            seatReservations.delete(key);
            io.to(reservation.showtimeId).emit('seat-updated', {
              seatId: reservation.seatId,
              status: 'available',
              userId: null,
              timestamp: Date.now(),
            });
          });
        }
      }, 30000); // 30 second grace period
    }
  });
});

// ✅ Clean up expired reservations every 30 seconds
setInterval(() => {
  const now = Date.now();
  const expiredReservations: string[] = [];

  seatReservations.forEach((reservation, key) => {
    if (reservation.expiresAt <= now) {
      expiredReservations.push(key);
    }
  });

  if (expiredReservations.length > 0) {
    console.log(`🧹 Cleaning up ${expiredReservations.length} expired reservations`);

    expiredReservations.forEach((key) => {
      const reservation = seatReservations.get(key);
      if (reservation) {
        seatReservations.delete(key);
        io.to(reservation.showtimeId).emit('seat-updated', {
          seatId: reservation.seatId,
          status: 'available',
          userId: null,
          timestamp: Date.now(),
        });
        console.log(`⏰ Released expired seat ${reservation.seatId}`);
      }
    });
  }
}, 30000); // Check every 30 seconds

const PORT = process.env.WEBSOCKET_PORT || 3001;

server.listen(PORT, () => {
  console.log(`🔌 WebSocket server running on port ${PORT}`);
  console.log(`📊 Server ready for real-time seat bookings`);
});

export { io };
