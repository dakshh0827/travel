// ============================================================
//  routes/health.js — Health Check Endpoint
// ============================================================
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Travel Companion',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    llmProvider: process.env.LLM_PROVIDER || 'groq',
    environment: process.env.NODE_ENV || 'development',
  });
});
