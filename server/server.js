// Simple signaling server using Express + Socket.IO
// Run: npm install && npm start

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

// Basic health endpoint
app.get('/', (req, res) => res.send('WebRTC signaling server running'));

// Rooms model: socket joins rooms by name
io.on('connection', socket => {
  console.log('conn:', socket.id);

  // Join room
  socket.on('join-room', (room, meta) => {
    socket.join(room);
    socket.data.meta = meta || {};
    // Inform others
    const peers = Array.from(io.sockets.adapter.rooms.get(room) || [])
      .filter(id => id !== socket.id)
      .map(id => ({ id, meta: io.sockets.sockets.get(id)?.data?.meta || {} }));
    // Give new client the list of peers (id + meta)
    socket.emit('peers', peers);
    // Broadcast that this client joined
    socket.to(room).emit('peer-joined', { id: socket.id, meta: socket.data.meta });
    socket.data.room = room;
    console.log(`${socket.id} joined ${room}`);
  });

  // Relay SDP / ICE for signaling
  socket.on('signal', ({ to, payload }) => {
    if (!to) return;
    const target = io.sockets.sockets.get(to);
    if (target) target.emit('signal', { from: socket.id, payload });
  });

  // Leaving / disconnect
  socket.on('disconnect', () => {
    const room = socket.data.room;
    if (room) {
      socket.to(room).emit('peer-left', { id: socket.id });
      console.log(`${socket.id} left ${room}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Signaling server listening on :${PORT}`));
