// ============================================================
//  routes/chat.js — Main Chat Endpoint
//
//  POST /api/chat      - Generate travel itinerary
//  GET  /api/chat/ping - Test the route
// ============================================================
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runTravelAgent } from '../agents/graph.js';
import { getSession, addMessage, getChatHistory, saveItinerary } from '../memory/conversationMemory.js';

export const chatRouter = Router();

/**
 * POST /api/chat
 * Body: { message: string, sessionId?: string }
 * Returns: { itinerary, sessionId, intent }
 */
chatRouter.post('/', async (req, res) => {
  const { message, sessionId: existingSessionId } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return res.status(400).json({ error: 'Message is too short. Tell me more about your trip!' });
  }

  const sessionId = existingSessionId || uuidv4();
  const chatHistory = getChatHistory(sessionId);

  try {
    // Save user message to memory
    addMessage(sessionId, 'user', message);

    console.log(`\n📨 New chat request | Session: ${sessionId}`);

    // Run the full agent pipeline
    const finalState = await runTravelAgent(message, sessionId, chatHistory);

    if (finalState.error && !finalState.itinerary) {
      return res.status(500).json({
        error: 'Trip planning failed',
        message: finalState.error,
        sessionId,
      });
    }

    // Save assistant response to memory
    addMessage(sessionId, 'assistant', finalState.itinerary);
    saveItinerary(sessionId, finalState.itinerary, finalState.intent);

    res.json({
      sessionId,
      itinerary: finalState.itinerary,
      intent: finalState.intent,
      destinations: finalState.destinations,
      meta: {
        hiddenGems: finalState.hiddenGems?.length || 0,
        cafes: finalState.cafes?.length || 0,
        stays: finalState.stays?.length || 0,
      },
    });

  } catch (err) {
    console.error('❌ Chat route error:', err);
    res.status(500).json({
      error: 'Something broke on our end',
      sessionId,
    });
  }
});

/**
 * GET /api/chat/history/:sessionId
 * Returns the chat history for a session
 */
chatRouter.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  res.json({
    sessionId,
    messages: session.messages,
    itineraryCount: session.itineraries.length,
  });
});

/**
 * GET /api/chat/ping
 */
chatRouter.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Chat route is alive ✈️' });
});
