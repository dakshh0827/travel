# ✈️ AI Travel Companion — Setup Guide

## What Changed: Static RAG → Live Web Search

The old version had 5 hardcoded destinations in a JSON file.
The new version searches the live web for ANY destination, in real time.

```
User asks about Leh Ladakh →
  Tavily searches 4 queries in parallel →
  Results embedded into in-memory vector store →
  Agent retrieves most relevant chunks →
  Gen-Z itinerary with real, current information ✈️
```

No more hardcoded data. Works for Spiti, Meghalaya, Bali, Patagonia — anything.

---

## API Keys — What You Need

### Minimum to run (just 2 keys):

| Key | Where to get | Cost | What it does |
|-----|-------------|------|-------------|
| `GROQ_API_KEY` | console.groq.com | FREE | Powers the LLM (fast) |
| `TAVILY_API_KEY` | app.tavily.com | FREE (1000/mo) | Powers web search |

### Optional extras:

| Key | Where to get | What it adds |
|-----|-------------|-------------|
| `OPENAI_API_KEY` | platform.openai.com | Vector embeddings (better RAG retrieval) |
| `GOOGLE_PLACES_KEY` | console.cloud.google.com | Real coordinates + place ratings |
| `OPENWEATHER_API_KEY` | openweathermap.org/api | Live weather data |

---

## Setup (5 steps)

### Step 1 — Get your Groq key (2 minutes, free)
1. Go to https://console.groq.com
2. Sign up → API Keys → Create Key
3. Copy: `gsk_xxxxxxxx`

### Step 2 — Get your Tavily key (1 minute, free)
1. Go to https://app.tavily.com
2. Sign up → copy your API key
3. Copy: `tvly-xxxxxxxx`

### Step 3 — Configure environment
```bash
cd travel-companion/backend
cp ../.env.example .env
```
Edit `.env` — at minimum set these two:
```env
GROQ_API_KEY=gsk_your-key
TAVILY_API_KEY=tvly-your-key
```

### Step 4 — Start backend
```bash
cd backend
npm install
npm run dev
# → Server running at http://localhost:3001
```

### Step 5 — Start frontend
```bash
# New terminal
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm install
npm run dev
# → App running at http://localhost:3000
```

Open http://localhost:3000 and try:
> "4 days in Spiti Valley, group of 6, budget 5000/head, want snow and stargazing"

---

## How the Web Search RAG Works

```
User input: "Spiti Valley, snow, stargazing, 4 days"
          │
          ▼
InputParser extracts intent: { destination: "Spiti Valley", vibes: ["snow","stargazing"] }
          │
          ▼
prewarmKnowledgeBase() fires 4 Tavily searches IN PARALLEL:
  ├── "Spiti Valley travel guide hidden gems tips"
  ├── "Spiti Valley best homestay hostel budget"
  ├── "Spiti Valley how to reach travel route"
  └── "Spiti Valley snow stargazing travel experience"
          │
          ▼
Results (20+ web pages) → chunked into Documents
          │
          ▼ (if OpenAI key set)        (if no OpenAI key)
  OpenAI Embeddings               Keyword search fallback
  → MemoryVectorStore             → still works great!
          │
          ▼
Agent calls rag_search("hidden gems") → retrieves top 4 relevant chunks
Agent calls rag_search("accommodation options") → different 4 chunks
Agent calls hidden_gems_search, cafe_search, stay_search (more Tavily queries)
          │
          ▼
Generator writes itinerary using ALL real, sourced information
```

### Why MemoryVectorStore instead of FAISS?
- No disk I/O — perfect for dynamic per-request knowledge
- Built into LangChain — no native binary dependencies
- Rebuilt fresh each request (with 30-min cache)
- FAISS was overkill for temporary per-request knowledge

---

## How Search Results Stay Fresh

The system caches knowledge bases for 30 minutes:
- Same destination asked twice → second request is instant (uses cache)
- After 30 minutes → fresh web search runs again
- Different destinations → separate caches, never mixed

Change cache duration in `rag/dynamicRag.js`:
```js
const CACHE_TTL_MS = 30 * 60 * 1000; // Change this
```

---

## Adding More Search Sources

In `tools/webSearch.js`, each tool has an `includeDomains` list.
Add any domain you want Tavily to prioritize:

```js
includeDomains: [
  'thrillophilia.com',
  'tripoto.com',
  'your-favorite-travel-blog.com',  // Add here
]
```

---

## File Structure (New Files)

```
backend/
├── tools/
│   ├── webSearch.js          ← NEW: 6 web search tools (Tavily)
│   └── ragSearch.js          ← UPDATED: now wraps dynamic RAG
└── rag/
    ├── dynamicRag.js         ← NEW: web search → vector store → retrieve
    └── data/destinations.json ← REMOVED (no longer needed)
```

Files removed: `rag/buildIndex.js`, `rag/data/destinations.json`
No more `npm run build-index` step needed.

---

## Troubleshooting

**"TAVILY_API_KEY is not set"**
Add `TAVILY_API_KEY=tvly-your-key` to `backend/.env`

**Search returns empty results**
Tavily free tier has rate limits. Add 1-2 second delays or upgrade plan.

**Slow responses (~15-30 seconds)**
Normal — the agent runs 6-10 web searches. For production, implement streaming.

**"Cannot find module 'langchain/vectorstores/memory'"**
```bash
npm install langchain@latest --save
```
