process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err.name, err.message, err.stack);
  process.exit(1);
});

require('dotenv').config();
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
