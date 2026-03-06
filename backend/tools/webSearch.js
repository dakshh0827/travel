// ============================================================
//  tools/webSearch.js — Live Web Search Tool (Tavily)
//
//  Tavily is purpose-built for AI agents — it returns clean,
//  summarized results instead of raw HTML.
//
//  Get a FREE key at: https://app.tavily.com (1000 searches/month free)
// ============================================================
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

const TAVILY_API_URL = 'https://api.tavily.com/search';

/**
 * Core Tavily search function.
 * Returns clean, summarized results ideal for LLM consumption.
 */
async function tavilySearch({ query, maxResults = 5, searchDepth = 'advanced', includeDomains = [] }) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey.includes('your-')) {
    throw new Error('TAVILY_API_KEY is not set. Get a free key at https://app.tavily.com');
  }

  const payload = {
    api_key:       apiKey,
    query,
    max_results:   maxResults,
    search_depth:  searchDepth,     // "basic" (faster) | "advanced" (better quality)
    include_answer: true,           // Get a synthesized answer, not just links
    include_raw_content: false,     // Keep responses lean
    include_domains: includeDomains.length > 0 ? includeDomains : undefined,
  };

  const response = await axios.post(TAVILY_API_URL, payload, {
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data;
}

/**
 * Format Tavily results into clean text for LLM consumption
 */
function formatResults(data) {
  const lines = [];

  // Tavily's synthesized answer (best part)
  if (data.answer) {
    lines.push(`SUMMARY: ${data.answer}\n`);
  }

  // Individual search results
  data.results?.forEach((r, i) => {
    lines.push(`--- Source ${i + 1}: ${r.title} ---`);
    lines.push(`URL: ${r.url}`);
    lines.push(`Content: ${r.content}`);
    if (r.score) lines.push(`Relevance: ${(r.score * 100).toFixed(0)}%`);
    lines.push('');
  });

  return lines.join('\n');
}

// ── Tool 1: General Travel Search ─────────────────────────────
export const travelSearchTool = tool(
  async ({ query, maxResults }) => {
    console.log(`🔍 [WebSearch] Searching: "${query}"`);
    try {
      const data = await tavilySearch({
        query: `${query} travel guide tips India`,
        maxResults: maxResults || 5,
        searchDepth: 'advanced',
        // Prioritize high-quality travel sources
        includeDomains: [
          'thrillophilia.com', 'tripoto.com', 'lonelyplanet.com',
          'holidify.com', 'holidaymonk.com', 'travelogyindia.com',
          'indiahikes.com', 'himachalwatcher.com', 'spitivalley.in',
          'incredibleindia.org', 'makemytrip.com', 'goibibo.com',
        ],
      });
      return formatResults(data);
    } catch (err) {
      console.error('❌ [WebSearch] Error:', err.message);
      return `Search failed: ${err.message}`;
    }
  },
  {
    name: 'travel_search',
    description: 'Search the web for travel information about a destination — tips, things to do, local culture, best time to visit, travel routes',
    schema: z.object({
      query:      z.string().describe('Specific search query (e.g. "Spiti Valley snow trip tips hidden places")'),
      maxResults: z.number().optional().describe('Number of results (default 5)'),
    }),
  }
);

// ── Tool 2: Hidden Gems & Offbeat Places Search ────────────────
export const hiddenGemsSearchTool = tool(
  async ({ destination, vibe }) => {
    const query = `${destination} hidden gems offbeat places ${vibe} underrated spots local secrets 2024`;
    console.log(`💎 [HiddenGems] Searching: "${query}"`);
    try {
      const data = await tavilySearch({
        query,
        maxResults: 6,
        searchDepth: 'advanced',
        includeDomains: [
          'tripoto.com', 'thrillophilia.com', 'wanderon.in',
          'backpackingwithak.com', 'hillstravel.in', 'indiamike.com',
          'reddit.com', 'quora.com',
        ],
      });
      return formatResults(data);
    } catch (err) {
      console.error('❌ [HiddenGems] Error:', err.message);
      return `Search failed: ${err.message}`;
    }
  },
  {
    name: 'hidden_gems_search',
    description: 'Search for underrated, offbeat, and hidden places at a destination that most tourists miss',
    schema: z.object({
      destination: z.string().describe('Destination to search for hidden gems'),
      vibe:        z.string().describe('Travel vibe (e.g. "adventure", "peaceful", "photography")'),
    }),
  }
);

// ── Tool 3: Cafe & Food Search ─────────────────────────────────
export const cafeSearchTool = tool(
  async ({ location, foodType }) => {
    const query = `best cafes restaurants local food ${location} ${foodType || ''} must try 2024`;
    console.log(`☕ [CafeSearch] Searching: "${query}"`);
    try {
      const data = await tavilySearch({
        query,
        maxResults: 5,
        searchDepth: 'basic',
        includeDomains: [
          'zomato.com', 'tripadvisor.com', 'tripoto.com',
          'thrillophilia.com', 'holidify.com',
        ],
      });
      return formatResults(data);
    } catch (err) {
      console.error('❌ [CafeSearch] Error:', err.message);
      return `Search failed: ${err.message}`;
    }
  },
  {
    name: 'cafe_search',
    description: 'Search for cafes, restaurants, and local food spots at a destination',
    schema: z.object({
      location: z.string().describe('Location to search (e.g. "Kaza Spiti Valley")'),
      foodType: z.string().optional().describe('Type of food or vibe (e.g. "local himachali", "cozy cafe", "street food")'),
    }),
  }
);

// ── Tool 4: Accommodation Search ──────────────────────────────
export const staySearchTool = tool(
  async ({ location, stayType, budget }) => {
    const query = `best ${stayType || 'homestay hostel guesthouse'} ${location} budget ₹${budget || '500-2000'} per night review`;
    console.log(`🏠 [StaySearch] Searching: "${query}"`);
    try {
      const data = await tavilySearch({
        query,
        maxResults: 5,
        searchDepth: 'advanced',
        includeDomains: [
          'zostel.com', 'hostelworld.com', 'booking.com',
          'tripoto.com', 'thrillophilia.com', 'airbnb.com',
          'makemytrip.com', 'goibibo.com',
        ],
      });
      return formatResults(data);
    } catch (err) {
      console.error('❌ [StaySearch] Error:', err.message);
      return `Search failed: ${err.message}`;
    }
  },
  {
    name: 'stay_search',
    description: 'Search for accommodation options at a destination — homestays, hostels, camps, guesthouses',
    schema: z.object({
      location: z.string().describe('Location to search stays in'),
      stayType: z.string().optional().describe('Type of accommodation (homestay, hostel, camp, hotel)'),
      budget:   z.number().optional().describe('Max budget per night per person in INR'),
    }),
  }
);

// ── Tool 5: Travel Logistics Search ───────────────────────────
export const travelLogisticsSearchTool = tool(
  async ({ from, to, mode }) => {
    const query = `how to reach ${to} from ${from} ${mode || 'road train bus'} travel time route best way 2024`;
    console.log(`🚌 [Logistics] Searching: "${query}"`);
    try {
      const data = await tavilySearch({
        query,
        maxResults: 4,
        searchDepth: 'basic',
        includeDomains: [
          'thrillophilia.com', 'holidify.com', 'tripoto.com',
          'cleartrip.com', 'ixigo.com', 'makemytrip.com',
        ],
      });
      return formatResults(data);
    } catch (err) {
      console.error('❌ [Logistics] Error:', err.message);
      return `Search failed: ${err.message}`;
    }
  },
  {
    name: 'travel_logistics_search',
    description: 'Search for how to get from one place to another — routes, transport options, travel time, tips',
    schema: z.object({
      from: z.string().describe('Origin city or location'),
      to:   z.string().describe('Destination city or location'),
      mode: z.string().optional().describe('Preferred mode (road, train, flight, bus)'),
    }),
  }
);

// ── Tool 6: Current Conditions Search ─────────────────────────
export const currentConditionsSearchTool = tool(
  async ({ destination, month }) => {
    const currentMonth = month || new Date().toLocaleString('en', { month: 'long' });
    const query = `${destination} travel conditions ${currentMonth} 2024 road open weather tips precautions`;
    console.log(`🌤️  [Conditions] Searching: "${query}"`);
    try {
      const data = await tavilySearch({
        query,
        maxResults: 4,
        searchDepth: 'basic',
      });
      return formatResults(data);
    } catch (err) {
      console.error('❌ [Conditions] Error:', err.message);
      return `Search failed: ${err.message}`;
    }
  },
  {
    name: 'current_conditions_search',
    description: 'Search for current travel conditions at a destination — road status, weather, seasonal tips, what to pack',
    schema: z.object({
      destination: z.string().describe('Destination to check conditions for'),
      month:       z.string().optional().describe('Month of travel (defaults to current month)'),
    }),
  }
);
