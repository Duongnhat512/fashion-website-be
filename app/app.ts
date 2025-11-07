import express, { Application, Response } from 'express';
import { initPg } from './config/pg.config';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import userRouter from './routers/user.router';
import { AppDataSource } from './config/data_source';
import categoryRouter from './routers/category.route';
import productRouter from './routers/product.route';
import authRouter from './routers/auth.route';
import { initRedis } from './config/redis.config';
import { initializeProductSearch } from './utils/initialize_search';
import orderRouter from './routers/order.route';
import { warehouseRouter } from './routers/warehouse.route';
import stockEntryRouter from './routers/stock_entry.route';
import paymentRouter from './routers/payment.route';
import cartRouter from './routers/cart.route';
// Security imports
import {
  helmetConfig,
  rateLimiter,
  authRateLimiter,
  speedLimiter,
  sanitizeRequest,
  securityHeaders,
  requestSizeLimiter,
} from './middlewares/security.middleware';
import { securityConfig } from './config/security.config';
import logger from './utils/logger';
import inventoryRouter from './routers/inventory.route';

const app: Application = express();

const apiVersion = '/api/v1';

async function initializeApp() {
  try {
    await initPg();
    await AppDataSource.initialize();
    await initRedis();
    await initializeProductSearch();
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

initializeApp();

// Security middleware (order matters!)
app.use(helmetConfig);
app.use(securityHeaders);
app.use(compression());
app.use(requestSizeLimiter);

// CORS configuration
app.use(cors(securityConfig.cors));

// Rate limiting
app.use(rateLimiter);
app.use(speedLimiter);

// Body parsing with size limits
app.use(
  bodyParser.json({
    limit: securityConfig.requestLimits.json,
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        (res as Response).status(400).json({
          success: false,
          message: 'Invalid JSON format',
        });
        throw new Error('Invalid JSON');
      }
    },
  }),
);

app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: securityConfig.requestLimits.urlencoded,
  }),
);

// Request sanitization
app.use(sanitizeRequest);

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }),
);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes with security
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fashion Website API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Auth routes with strict rate limiting
app.use(`${apiVersion}/auth`, authRateLimiter, authRouter);

// Protected routes
app.use(`${apiVersion}/users`, userRouter);
app.use(`${apiVersion}/categories`, categoryRouter);
app.use(`${apiVersion}/products`, productRouter);
app.use(`${apiVersion}/orders`, orderRouter);
app.use(`${apiVersion}/warehouses`, warehouseRouter);
app.use(`${apiVersion}/stock-entries`, stockEntryRouter);
app.use(`${apiVersion}/payments`, paymentRouter);
app.use(`${apiVersion}/carts`, cartRouter);
app.use(`${apiVersion}/inventories`, inventoryRouter);

// 404 handler
app.use('*', (req, res) => {
  (res as Response).status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)

export default app;
