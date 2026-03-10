// ============================================================
//  server.js — Express App Entry Point
// ============================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat.js';
import { itineraryRouter } from './routes/itinerary.js';
import { healthRouter } from './routes/health.js';
import { sessionMiddleware } from './middleware/session.js';
import { rateLimiter } from './middleware/rateLimit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://travel-dusky-three.vercel.app'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(sessionMiddleware);
app.use(rateLimiter);

// ── Routes ───────────────────────────────────────────────────
app.use('/api/health',    healthRouter);
app.use('/api/chat',      chatRouter);
app.use('/api/itinerary', itineraryRouter);

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Something went wrong on our end.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
🚀 Travel Companion Backend running!
   URL:  http://localhost:${PORT}
   Mode: ${process.env.NODE_ENV}
   LLM:  ${process.env.LLM_PROVIDER || 'groq'}
  `);
});
