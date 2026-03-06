// ============================================================
//  middleware/rateLimit.js — API Rate Limiting
// ============================================================
import rateLimit from 'express-rate-limit';

/**
 * Allow 20 requests per minute per IP.
 * Adjust for production based on expected traffic.
 */
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute window
  max: 20,                   // Max requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests — slow down! ✋',
    retryAfter: 60,
  },
  skip: (req) => req.path === '/api/health', // Don't limit health checks
});
