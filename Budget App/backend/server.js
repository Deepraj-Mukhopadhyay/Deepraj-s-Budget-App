const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route files
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const appDataRoutes = require('./routes/appDataRoutes');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow loading inline styles & scripts of existing frontend
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Budget App API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/app-data', appDataRoutes);

// Serve static frontend files from project root
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// Fallback to index.html for root or page navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Unmatched API routes fall into 404 handler
app.use('/api/*', notFound);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

// Start server after connecting to database
const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();
  } catch (err) {
    console.error(`[Server Warning] Database connection failed: ${err.message}`);
    console.error(`[Server Warning] Starting server anyway in fallback mode. APIs requiring MongoDB will return errors until database is reachable.`);
  }

  server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  Budget App Backend running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Frontend: http://localhost:${PORT}`);
    console.log(`  API Base: http://localhost:${PORT}/api`);
    console.log(`  Health:   http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  }
});

// If file is run directly, start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
