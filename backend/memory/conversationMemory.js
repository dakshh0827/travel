// ============================================================
//  memory/conversationMemory.js — Per-Session Chat History
// ============================================================

/**
 * Simple in-memory session store.
 * In production, replace with Redis for persistence across restarts.
 */
const sessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Get or create a session for the given ID.
 */
export function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      itineraries: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    });
  }

  const session = sessions.get(sessionId);
  session.lastAccessedAt = Date.now();
  return session;
}

/**
 * Add a message to the session history.
 */
export function addMessage(sessionId, role, content) {
  const session = getSession(sessionId);
  session.messages.push({
    role,       // 'user' | 'assistant'
    content,
    timestamp: Date.now(),
  });

  // Keep last 10 messages to avoid context overflow
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-10);
  }
}

/**
 * Save a generated itinerary to the session.
 */
export function saveItinerary(sessionId, itinerary, intent) {
  const session = getSession(sessionId);
  session.itineraries.push({
    itinerary,
    intent,
    savedAt: Date.now(),
  });
}

/**
 * Get chat history formatted for LLM context.
 */
export function getChatHistory(sessionId) {
  const session = getSession(sessionId);
  return session.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
}

/**
 * Clean up expired sessions (call periodically).
 */
export function cleanupSessions() {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, session] of sessions) {
    if (now - session.lastAccessedAt > SESSION_TTL_MS) {
      sessions.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
}

// Auto cleanup every 30 minutes
setInterval(cleanupSessions, 30 * 60 * 1000);
