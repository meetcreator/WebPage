// WebRTC signaling server with automatic network discovery
// All devices on the same network automatically discover each other
// Run: npm install && npm start

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// Basic health endpoint
app.get('/', (req, res) => res.send('WebRTC signaling server running'));

// All connected devices (local network discovery)
const connectedDevices = new Map(); // socket.id -> device info

io.on('connection', socket => {
  console.log('Device connected:', socket.id);

  // Register device on network
  socket.on('register-device', (deviceInfo) => {
    socket.data.deviceInfo = deviceInfo || {};
    socket.data.deviceInfo.id = socket.id;
    socket.data.deviceInfo.timestamp = Date.now();
    
    connectedDevices.set(socket.id, socket.data.deviceInfo);
    
    // Broadcast updated device list to all clients
    io.emit('devices-update', Array.from(connectedDevices.values()));
    console.log(`Registered: ${deviceInfo?.name || socket.id} on network`);
  });

  // Get current device list
  socket.on('get-devices', () => {
    const devices = Array.from(connectedDevices.values())
      .filter(d => d.id !== socket.id); // exclude self
    socket.emit('devices-update', devices);
  });

  // Relay SDP / ICE for signaling
  socket.on('signal', ({ to, payload }) => {
    if (!to) return;
    const target = io.sockets.sockets.get(to);
    if (target) target.emit('signal', { from: socket.id, payload });
  });

  // Leaving / disconnect
  socket.on('disconnect', () => {
    connectedDevices.delete(socket.id);
    // Broadcast updated device list
    io.emit('devices-update', Array.from(connectedDevices.values())
      .filter(d => d.id !== socket.id));
    console.log(`Device disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✓ Signaling server listening on http://${localIP}:${PORT}`);
  console.log(`✓ Devices on ${localIP} network will auto-discover each other\n`);
});
