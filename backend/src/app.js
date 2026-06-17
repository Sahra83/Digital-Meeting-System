const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { recordUserLog } = require('./services/auditService');

const app = express();
const path = require('path');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://www.digitalmeeting24.com', 'https://digitalmeeting24.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const path = req.originalUrl || '';
  const hasDetailedLog =
    /\/api(\/v1)?\/auth\/(login|logout)/.test(path) ||
    /\/api(\/v1)?\/users(\/|$)/.test(path);

  if (shouldAudit && !hasDetailedLog) {
    res.on('finish', () => {
      if (req.user && res.statusCode < 400) {
        recordUserLog({
          actor: req.user,
          action: `api_${method.toLowerCase()}`,
          entityType: 'api_request',
          details: `${method} ${path}`,
          metadata: { statusCode: res.statusCode },
          req,
        });
      }
    });
  }

  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Digital Meeting API' });
});

// Explicitly register API routes
console.log(' Initializing API Routes...');
app.use('/api', routes);
app.use('/api/v1', routes);

app.use((req, res, next) => {
  // Attach socket.io instance (set in index.js) to each request for controllers
  if (app.get('io')) {
    req.io = app.get('io');
  }
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
