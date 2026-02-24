// backend/src/app.js
// Express application entry point

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const fileRoutes = require('./routes/files');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ───── Global Middleware ─────
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ───── Health Check (public) ─────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ───── API Routes ─────
app.use('/api/files', fileRoutes);

// ───── 404 handler ─────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', statusCode: 404 });
});

// ───── Global Error Handler (must be last) ─────
app.use(errorHandler);

// ───── Start Server ─────
app.listen(PORT, () => {
  console.log(`\n🚀  CloudVault API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   CORS origin: ${FRONTEND_URL}\n`);
});

module.exports = app;
