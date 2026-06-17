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

function getAuditAction(method, originalUrl) {
  const cleanPath = (originalUrl || '').split('?')[0].replace(/^\/api(?:\/v1)?/, '') || '/';
  const route = cleanPath.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id',
  );

  const actions = {
    'POST /meetings': ['meeting_created', 'Meeting created', 'meeting'],
    'PUT /meetings/:id': ['meeting_updated', 'Meeting updated', 'meeting'],
    'DELETE /meetings/:id': ['meeting_deleted', 'Meeting deleted', 'meeting'],
    'POST /meetings/:id/minutes': ['minutes_created', 'Meeting minutes created', 'meeting_minutes'],
    'PUT /meetings/:id/minutes': ['minutes_updated', 'Meeting minutes updated', 'meeting_minutes'],
    'POST /meetings/:id/minutes/notify': ['minutes_sent', 'Meeting minutes sent', 'meeting_minutes'],
    'POST /meetings/:id/minutes/versions/:id/restore': ['minutes_restored', 'Meeting minutes restored', 'meeting_minutes'],
    'POST /participant/tasks/:id/submit': ['task_submitted', 'Task submitted', 'task'],
    'PATCH /participant/tasks/:id/start': ['task_started', 'Task started', 'task'],
    'PATCH /organizer/tasks/:id/approve': ['task_approved', 'Task approved', 'task'],
    'PATCH /organizer/tasks/:id/reject': ['task_rejected', 'Task rejected', 'task'],
    'POST /tasks/:id/resend-email': ['task_email_resent', 'Task email resent', 'task'],
    'POST /collaboration/comments': ['comment_added', 'Comment added', 'comment'],
    'PUT /collaboration/comments/:id': ['comment_updated', 'Comment updated', 'comment'],
    'DELETE /collaboration/comments/:id': ['comment_deleted', 'Comment deleted', 'comment'],
  };

  const fallbackVerb = {
    POST: 'Created',
    PUT: 'Updated',
    PATCH: 'Updated',
    DELETE: 'Deleted',
  };
  const fallbackAction = `${method.toLowerCase()}_${route.split('/')[1] || 'record'}`;
  const fallbackDetails = `${fallbackVerb[method] || method} ${(route.split('/')[1] || 'record').replace(/-/g, ' ')}`;
  const [action, details, entityType] = actions[`${method} ${route}`] || [fallbackAction, fallbackDetails, 'api_request'];

  return { action, details, entityType, path: cleanPath };
}

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
        const auditAction = getAuditAction(method, path);
        recordUserLog({
          actor: req.user,
          action: auditAction.action,
          entityType: auditAction.entityType,
          details: auditAction.details,
          metadata: { method, path: auditAction.path, statusCode: res.statusCode },
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
