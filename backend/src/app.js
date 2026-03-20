import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting on sensitive endpoints
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many attempts, try again later' },
});
app.use('/api/session/otp', otpLimiter);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Upload rate limit exceeded' },
});
app.use('/api/upload', uploadLimiter);

// Health check
app.get('/healthz', async (_req, res) => {
  try {
    const { default: pool } = await import('./db/connection.js');
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

// API routes
app.use('/api', apiRoutes);

// Serve frontend static files
app.use('/upload', express.static(join(__dirname, '../../frontend/upload')));
app.use('/backoffice', express.static(join(__dirname, '../../frontend/backoffice')));

// Error handler
app.use(errorHandler);

export default app;
