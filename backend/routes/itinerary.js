// ============================================================
//  routes/itinerary.js — Saved Itineraries Endpoint
// ============================================================
import { Router } from 'express';
import { getSession } from '../memory/conversationMemory.js';

export const itineraryRouter = Router();

/**
 * GET /api/itinerary/:sessionId
 * Returns all saved itineraries for a session
 */
itineraryRouter.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  res.json({
    sessionId,
    itineraries: session.itineraries,
  });
});
