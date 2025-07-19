const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://secret-404e.onrender.com'],
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: ['http://localhost:3000', 'https://secret-404e.onrender.com'],
  methods: ['GET', 'POST']
}));

// Serve static files
app.use('/client-app', express.static(path.join(__dirname, '..', 'client-app'), { index: 'index.html' }));
app.use('/admin-panel', express.static(path.join(__dirname, '..', 'admin-panel'), { index: 'admin.html' }));

// Logging setup
const logDir = '/tmp/logs';
async function ensureLogDir() {
  try {
    await fs.mkdir(logDir, { recursive: true });
    console.log(`Logs directory created at: ${logDir}`);
  } catch (err) {
    console.error('Error creating logs directory:', err);
  }
}
ensureLogDir();

async function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    await fs.appendFile(path.join(logDir, 'app.log'), logMessage);
    console.log(logMessage.trim());
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
}

// Store client sessions
const clientSessions = new Map(); // clientId -> { socketId, offer }

let adminSocket = null;

io.on('connection', (socket) => {
  socket.on('register', (type, clientId) => {
    if (type === 'client' && clientId) {
      clientSessions.set(clientId, { socketId: socket.id, offer: null });
      logEvent(`Client registered: ${clientId} with socket ${socket.id}`);
    } else if (type === 'admin') {
      adminSocket = socket;
      logEvent(`Admin connected: ${socket.id}`);
      // Send existing client offers to admin
      clientSessions.forEach((session, clientId) => {
        if (session.offer) {
          adminSocket.emit('offer', session.offer, clientId);
        }
      });
    }
  });

  socket.on('offer', (offer, clientId) => {
    if (clientId && clientSessions.has(clientId)) {
      clientSessions.get(clientId).offer = offer;
      logEvent(`Offer received from client ${clientId}`);
      if (adminSocket) {
        adminSocket.emit('offer', offer, clientId);
        logEvent(`Offer sent to admin from client ${clientId}`);
      }
    }
  });

  socket.on('answer', (answer, clientId) => {
    if (clientSessions.has(clientId)) {
      const clientSocketId = clientSessions.get(clientId).socketId;
      io.to(clientSocketId).emit('answer', answer);
      logEvent(`Answer sent to client ${clientId}`);
    }
  });

  socket.on('ice-candidate', (candidate, clientId) => {
    if (clientId) {
      if (clientSessions.has(clientId)) {
        if (adminSocket) {
          adminSocket.emit('ice-candidate', candidate, clientId);
          logEvent(`ICE candidate sent to admin from client ${clientId}`);
        }
      } else if (adminSocket && socket.id === adminSocket.id) {
        const clientSocketId = clientSessions.get(clientId)?.socketId;
        if (clientSocketId) {
          io.to(clientSocketId).emit('ice-candidate', candidate);
          logEvent(`ICE candidate sent to client ${clientId}`);
        }
      }
    }
  });

  socket.on('start-camera', (clientId) => {
    if (clientSessions.has(clientId)) {
      const clientSocketId = clientSessions.get(clientId).socketId;
      io.to(clientSocketId).emit('start-camera');
      logEvent(`Start camera command sent to client ${clientId}`);
    }
  });

  socket.on('stop-camera', (clientId) => {
    if (clientSessions.has(clientId)) {
      const clientSocketId = clientSessions.get(clientId).socketId;
      io.to(clientSocketId).emit('stop-camera');
      clientSessions.delete(clientId); // Remove session on stop
      logEvent(`Stop camera command sent to client ${clientId}, session removed`);
    }
  });

  socket.on('snapshot', (data, clientId) => {
    if (adminSocket) {
      adminSocket.emit('snapshot', data, clientId);
      logEvent(`Snapshot sent from client ${clientId}`);
    }
  });

  socket.on('disconnect', () => {
    if (socket.id === adminSocket?.id) {
      adminSocket = null;
      logEvent(`Admin disconnected: ${socket.id}`);
    } else {
      let disconnectedClientId = null;
      clientSessions.forEach((session, clientId) => {
        if (session.socketId === socket.id) {
          disconnectedClientId = clientId;
        }
      });
      if (disconnectedClientId) {
        logEvent(`Client ${disconnectedClientId} disconnected, keeping session`);
        // Keep session in clientSessions until stop-camera
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
