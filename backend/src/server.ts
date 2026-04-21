import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables FIRST — before any other module imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });


import { connectDB } from './config/database';
import { initializeFirebase } from './config/firebase';

import { initializeGroq } from './config/groq';
import { initializeStripe } from './config/stripe';
import routes from './routes';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { morganStream } from './utils/logger';

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: morganStream }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(apiRateLimiter);

// API routes
app.use(routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize services and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize Firebase
    initializeFirebase();


    // Initialize Groq AI
    initializeGroq();

    // Initialize Stripe (optional)
    try {
      initializeStripe();
    } catch (error) {
      console.warn('Stripe initialization failed. Payment features will be disabled.');
    }

    // Start server
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀CareerPilot AI Backend Server                          ║
║                                                            ║
║   Status: Running                                          ║
║   Port: ${PORT}                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
║   API URL: http://0.0.0.0:${PORT}/api/v1                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections — log but don't crash the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Do NOT call process.exit(1) — let the server keep running
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
