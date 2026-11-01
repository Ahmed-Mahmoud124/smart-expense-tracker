'use strict';

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const dotenv      = require('dotenv');

const { testConnection } = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes    = require('./routes/categoryRoutes');
const budgetRoutes      = require('./routes/budgetRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const profileRoutes     = require('./routes/profileRoutes');

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── HTTP request logging (dev only) ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs : parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max      : parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ── Stricter limiter for auth endpoints ───────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  message : { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Expense Tracker API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories',   categoryRoutes);
app.use('/api/budgets',      budgetRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/profile',      profileRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
  await testConnection();                          // verify DB before accepting traffic
  app.listen(PORT, () => {
    console.log(`🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡  API base URL: http://localhost:${PORT}/api`);
  });
};

start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  process.exit(0);
});

require('events').setMaxListeners(20); //OPTIONAL to silence warnings

module.exports = app; // exported for supertest

