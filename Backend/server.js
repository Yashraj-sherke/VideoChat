import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"]
  }
});

// Store room information
const rooms = new Map();

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Generate unique room ID
function generateRoomId() {
  return Math.random().toString(36).substr(2, 9);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create room
  socket.on('create-room', (callback) => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      id: roomId,
      users: [],
      createdAt: new Date()
    });
    
    console.log('Room created:', roomId);
    callback({ roomId });
  });

  // Join room
  socket.on('join-room', ({ roomId, userName }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if user is already in room (prevent duplicates)
    const existingUser = room.users.find(user => user.id === socket.id);
    if (existingUser) {
      console.log(`User ${socket.id} already in room ${roomId}`);
      socket.emit('room-joined', {
        roomId,
        users: room.users,
        isInitiator: room.users[0].id === socket.id
      });
      return;
    }

    if (room.users.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    // Add user to room
    const user = {
      id: socket.id,
      name: userName || `User ${room.users.length + 1}`,
      joinedAt: new Date()
    };

    room.users.push(user);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = user.name;

    console.log(`${user.name} joined room ${roomId}`);

    // Notify others in room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: user.name,
      usersCount: room.users.length
    });

    // Send current room info to new user
    socket.emit('room-joined', {
      roomId,
      users: room.users,
      isInitiator: room.users.length === 1
    });
  });

  // Handle WebRTC signaling
  socket.on('offer', ({ offer, targetId }) => {
    socket.to(targetId).emit('offer', {
      offer,
      senderId: socket.id
    });
  });

  socket.on('answer', ({ answer, targetId }) => {
    socket.to(targetId).emit('answer', {
      answer,
      senderId: socket.id
    });
  });

  socket.on('ice-candidate', ({ candidate, targetId }) => {
    socket.to(targetId).emit('ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  // Handle user status updates
  socket.on('user-status', ({ status }) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-status-update', {
        userId: socket.id,
        status
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        // Remove user from room
        room.users = room.users.filter(user => user.id !== socket.id);
        
        // Notify others
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.id,
          userName: socket.userName,
          usersCount: room.users.length
        });

        // Clean up empty rooms
        if (room.users.length === 0) {
          rooms.delete(socket.roomId);
          console.log('Room deleted:', socket.roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});