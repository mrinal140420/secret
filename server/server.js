
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Added for Express CORS

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://secret-404e.onrender.com'],
    methods: ['GET', 'POST']
  }
});

// Add Express CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://secret-404e.onrender.com'],
  methods: ['GET', 'POST']
}));

// Serve static files
app.use('/client-app', express.static(path.join(__dirname, '..', 'client-app'), {
  index: 'index.html'
}));
app.use('/admin-panel', express.static(path.join(__dirname, '..', 'admin-panel'), {
  index: 'admin.html'
}));

// Debug route for /client-app/
app.get('/client-app/', async (req, res) => {
  const filePath = path.join(__dirname, '..', 'client-app', 'index.html');
  console.log(`Attempting to serve index.html from: ${filePath}`);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (err) {
    console.error(`Error serving index.html: ${err.message}`);
    res.status(404).send('Client app not found');
  }
});

// Debug route for /admin-panel/
app.get('/admin-panel/', async (req, res) => {
  const filePath = path.join(__dirname, '..', 'admin-panel', 'admin.html');
  console.log(`Attempting to serve admin.html from: ${filePath}`);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (err) {
    console.error(`Error serving admin.html: ${err.message}`);
    res.status(404).send('Admin panel not found');
  }
});

// Ensure logs directory exists
const logDir = process.env.NODE_ENV === 'production' ? '/tmp/logs' : path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'access.log');

async function initializeLogs() {
  try {
    await fs.mkdir(logDir, { recursive: true });
    console.log(`Logs directory created at: ${logDir}`);
    // Ensure log file exists
    await fs.writeFile(logFile, '', { flag: 'a' });
  } catch (err) {
    console.error('Error creating logs directory or file:', err);
  }
}

// Log events to file
async function logEvent(event) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${event}\n`;
  try {
    await fs.appendFile(logFile, logEntry);
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
}

// Initialize logs and wait for completion
(async () => {
  await initializeLogs();
})();

// Serve a basic endpoint
app.get('/', (req, res) => {
  res.send('Remote Camera Control Server');
});

// Track client and admin
let clientSocket = null;
let adminSocket = null;

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  logEvent(`Client connected: ${socket.id}`);

  socket.on('connect_error', (err) => {
    console.error('Socket.IO connection error:', err.message);
    logEvent(`Socket.IO connection error: ${err.message}`);
  });

  // Register client or admin
  socket.on('register', (role) => {
    if (role === 'client') {
      clientSocket = socket;
      logEvent(`Client registered: ${socket.id}`);
    } else if (role === 'admin') {
      adminSocket = socket;
      logEvent(`Admin registered: ${socket.id}`);
    }
  });

  // Handle WebRTC signaling
  socket.on('offer', (offer) => {
    if (adminSocket) {
      adminSocket.emit('offer', offer);
      logEvent(`Offer sent from client ${socket.id} to admin`);
    }
  });

  socket.on('answer', (answer) => {
    if (clientSocket) {
      clientSocket.emit('answer', answer);
      logEvent(`Answer sent from admin to client ${clientSocket.id}`);
    }
  });

  socket.on('ice-candidate', (candidate) => {
    if (socket === clientSocket && adminSocket) {
      adminSocket.emit('ice-candidate', candidate);
      logEvent(`ICE candidate sent from client ${socket.id} to admin`);
    } else if (socket === adminSocket && clientSocket) {
      clientSocket.emit('ice-candidate', candidate);
      logEvent(`ICE candidate sent from admin to client ${clientSocket.id}`);
    }
  });

  // Handle admin commands
  socket.on('admin-command', (command) => {
    if (clientSocket) {
      clientSocket.emit(command);
      logEvent(`Admin sent: ${command}`);
    }
  });

  socket.on('disconnect', () => {
    if (socket === clientSocket) {
      clientSocket = null;
      logEvent(`Client disconnected: ${socket.id}`);
    } else if (socket === adminSocket) {
      adminSocket = null;
      logEvent(`Admin disconnected: ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logEvent(`Server started on port ${PORT}`);
});
