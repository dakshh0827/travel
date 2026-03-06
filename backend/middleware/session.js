// ============================================================
//  middleware/session.js — Request Session Middleware
// ============================================================
import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a sessionId to every request.
 * Uses existing header if present, otherwise generates a new one.
 */
export function sessionMiddleware(req, res, next) {
  const sessionId = req.headers['x-session-id'] || uuidv4();
  req.sessionId = sessionId;
  res.setHeader('x-session-id', sessionId);
  next();
}
