process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err.name, err.message, err.stack);
  process.exit(1);
});

const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (dotenvResult.error) {
  console.error('⚠️  Failed to load .env file:', dotenvResult.error.message);
} else {
  console.log('✅ .env loaded from:', path.resolve(__dirname, '../.env'));
}
const app = require('./app');

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
// Attach io to app for controllers
app.set('io', io);

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected', socket.id);
  socket.on('join_meeting', (meetingId) => {
    socket.join(`meeting_${meetingId}`);
    console.log(`Socket ${socket.id} joined meeting_${meetingId}`);
  });
  socket.on('leave_meeting', (meetingId) => {
    socket.leave(`meeting_${meetingId}`);
    console.log(`Socket ${socket.id} left meeting_${meetingId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
