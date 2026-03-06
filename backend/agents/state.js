// ============================================================
//  agents/state.js — Shared State Schema for LangGraph
// ============================================================

/**
 * Channel definitions for LangGraph StateGraph.
 * Each channel defines how values are merged when an agent
 * returns partial state updates.
 *
 * (x, y) => y ?? x  means: use new value if provided, else keep old
 */
export const travelStateChannels = {
  // ── Input ──────────────────────────────────────────────────
  userMessage: {
    value: (x, y) => y ?? x,
    default: () => '',
  },
  sessionId: {
    value: (x, y) => y ?? x,
    default: () => '',
  },
  chatHistory: {
    value: (x, y) => y ?? x,
    default: () => [],
  },

  // ── Parsed Intent (set by InputParser agent) ───────────────
  intent: {
    value: (x, y) => y ?? x,
    default: () => ({}),
  },

  // ── Research Results (set by Researcher agent) ─────────────
  destinations: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  ragContext: {
    value: (x, y) => y ?? x,
    default: () => '',
  },

  // ── Discovery Results (set by Discoverer agent) ────────────
  hiddenGems: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  cafes: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  stays: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  weatherInfo: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  travelTime: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  // ── Final Output (set by Generator agent) ──────────────────
  itinerary: {
    value: (x, y) => y ?? x,
    default: () => '',
  },

  // ── Error Handling ─────────────────────────────────────────
  error: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
};

/**
 * Example of a fully-populated state object (for reference).
 * This is what flows through the entire agent pipeline.
 */
export const exampleState = {
  userMessage: 'I want to go to Himachal for 4 days with 6 friends, budget 5000/head, want snow and stargazing',
  sessionId: 'session-abc123',
  chatHistory: [],

  intent: {
    destination: 'Himachal Pradesh',
    duration: 4,
    groupSize: 6,
    budget: 5000,
    vibes: ['snow', 'stargazing', 'offbeat', 'group'],
    constraints: ['wooden homestay', '7-8 hour travel'],
    travelFrom: 'Delhi',
    season: 'winter',
  },

  destinations: [
    { name: 'Spiti Valley', why: 'High altitude, stunning snow, stargazing paradise', coords: { lat: 32.2, lng: 78.0 } },
    { name: 'Chitkul', why: 'Last village on Indo-Tibet border, incredibly underrated', coords: { lat: 31.3, lng: 78.4 } },
  ],
  ragContext: 'Spiti Valley is accessible from Delhi in 14-16 hours...',

  hiddenGems: [
    { name: 'Langza Village', type: 'village', vibe: 'Buddha statue + fossil hunting', tip: 'Go at sunrise' },
    { name: 'Hikkim Post Office', type: 'landmark', vibe: 'World highest post office', tip: 'Send a postcard home' },
  ],
  cafes: [
    { name: 'Milkmaid Cafe Kaza', specialty: 'Local thukpa and momos', priceLevel: 1 },
  ],
  stays: [
    { name: 'Zostel Kaza', type: 'hostel', pricePerNight: 400, vibe: 'Social, dorm beds, rooftop' },
    { name: 'Spiti Homestay Network', type: 'homestay', pricePerNight: 800, vibe: 'Wooden rooms, local food included' },
  ],
  weatherInfo: { temp: -2, condition: 'Snow expected', wind: 'Moderate' },
  travelTime: { duration: '14-16 hours', distance: '700 km', mode: 'Road' },

  itinerary: '# Your Spiti Escape 🏔️\n\n...',
  error: null,
};
