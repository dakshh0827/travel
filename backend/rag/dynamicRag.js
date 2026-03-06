// ============================================================
//  rag/dynamicRag.js — Dynamic Knowledge Builder
//
//  Instead of static JSON, this system:
//  1. Searches the web for the specific destination
//  2. Processes and chunks the results
//  3. Embeds them into a temporary in-memory FAISS store
//  4. Retrieves the most relevant chunks for the agent
//
//  Result: RAG that knows about ANY destination, not just 5 hardcoded ones.
// ============================================================
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import axios from 'axios';

// Cache to avoid re-searching the same destination in the same session
const searchCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Search Tavily for travel content about a destination.
 * Returns raw search results.
 */
async function searchTavilyForDestination(destination, vibes = []) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey.includes('your-')) {
    console.warn('⚠️  [DynamicRAG] No Tavily key — using keyword fallback');
    return null;
  }

  const queries = [
    `${destination} travel guide hidden gems offbeat places tips`,
    `${destination} best homestay hostel cafe food local experience budget`,
    `${destination} how to reach travel route road condition best time visit`,
    vibes.length > 0
      ? `${destination} ${vibes.slice(0, 3).join(' ')} travel experience`
      : `${destination} trekking adventure things to do`,
  ];

  console.log(`🌐 [DynamicRAG] Running ${queries.length} searches for: "${destination}"`);

  const allResults = [];

  for (const query of queries) {
    try {
      const response = await axios.post(
        'https://api.tavily.com/search',
        {
          api_key:             apiKey,
          query,
          max_results:         5,
          search_depth:        'advanced',
          include_answer:      true,
          include_raw_content: false,
        },
        { timeout: 12000 }
      );

      if (response.data.answer) {
        allResults.push({
          content: response.data.answer,
          source:  'tavily_answer',
          query,
        });
      }

      response.data.results?.forEach(r => {
        if (r.content && r.content.length > 100) {
          allResults.push({
            content: r.content,
            source:  r.url,
            title:   r.title,
            score:   r.score,
            query,
          });
        }
      });

    } catch (err) {
      console.error(`❌ [DynamicRAG] Search failed for query "${query}":`, err.message);
    }
  }

  console.log(`✅ [DynamicRAG] Collected ${allResults.length} pieces of content`);
  return allResults;
}

/**
 * Convert search results into LangChain Documents with rich metadata.
 */
function buildDocuments(results, destination) {
  return results.map((r, i) => new Document({
    pageContent: `[Source: ${r.title || r.source}]\n${r.content}`,
    metadata: {
      destination,
      source:    r.source,
      title:     r.title || 'Web Result',
      score:     r.score || 1.0,
      query:     r.query,
      index:     i,
    },
  }));
}

/**
 * Build an in-memory vector store from web search results.
 * Uses MemoryVectorStore (no disk I/O needed — perfect for dynamic use).
 */
async function buildDynamicVectorStore(documents) {
  // Use OpenAI embeddings if available, otherwise fall back to keyword search
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-')) {
    console.warn('⚠️  [DynamicRAG] No OpenAI key for embeddings — using full-text mode');
    return null;  // Will use keyword fallback
  }

  const embeddings = new OpenAIEmbeddings({
    apiKey:    process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
    batchSize: 10,
  });

  const store = await MemoryVectorStore.fromDocuments(documents, embeddings);
  return store;
}

/**
 * Simple keyword-based retrieval fallback (no embeddings needed).
 * Used when OpenAI embeddings aren't available.
 */
function keywordSearch(documents, query, k = 4) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const scored = documents.map(doc => {
    const text = doc.pageContent.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      const count = (text.match(new RegExp(word, 'g')) || []).length;
      return acc + count;
    }, 0);
    return { doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ doc }) => doc);
}

// ── Main Export: buildKnowledgeBase ───────────────────────────────
/**
 * The core function — searches the web for a destination and
 * returns a retriever that can answer questions about it.
 *
 * @param {string} destination - The destination to research
 * @param {string[]} vibes - Travel vibes to focus search on
 * @returns {object} - { retrieve(query): Promise<string>, sources: string[] }
 */
export async function buildKnowledgeBase(destination, vibes = []) {
  // Check cache first
  const cacheKey = `${destination}_${vibes.join('_')}`.toLowerCase().replace(/\s+/g, '_');
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`📦 [DynamicRAG] Using cached knowledge for: "${destination}"`);
    return cached.kb;
  }

  // Search the web
  const searchResults = await searchTavilyForDestination(destination, vibes);

  if (!searchResults || searchResults.length === 0) {
    console.warn(`⚠️  [DynamicRAG] No results for "${destination}" — using empty KB`);
    return createEmptyKB(destination);
  }

  const documents = buildDocuments(searchResults, destination);
  const vectorStore = await buildDynamicVectorStore(documents);

  const kb = {
    destination,
    documentCount: documents.length,
    sources: [...new Set(searchResults.map(r => r.source).filter(s => s !== 'tavily_answer'))],

    /**
     * Retrieve the most relevant content for a query.
     * @param {string} query
     * @param {number} k - Number of results
     * @returns {string} Concatenated relevant content
     */
    async retrieve(query, k = 4) {
      let docs;

      if (vectorStore) {
        // Vector similarity search
        const results = await vectorStore.similaritySearchWithScore(query, k);
        docs = results
          .filter(([_, score]) => score > 0.3)
          .map(([doc]) => doc);
      } else {
        // Keyword fallback
        docs = keywordSearch(documents, query, k);
      }

      if (docs.length === 0) return `No specific information found for: ${query}`;

      return docs.map(d => d.pageContent).join('\n\n---\n\n');
    },

    /**
     * Get ALL content as one string (for full context injection).
     */
    getAllContent() {
      return documents.map(d => d.pageContent).join('\n\n---\n\n');
    },
  };

  // Cache it
  searchCache.set(cacheKey, { kb, timestamp: Date.now() });

  console.log(`✅ [DynamicRAG] Knowledge base ready for "${destination}" (${documents.length} docs)`);
  return kb;
}

function createEmptyKB(destination) {
  return {
    destination,
    documentCount: 0,
    sources: [],
    async retrieve() { return `No web content available for ${destination}. Use your training knowledge.`; },
    getAllContent() { return ''; },
  };
}

/**
 * Clear the knowledge base cache (e.g. for testing).
 */
export function clearKBCache() {
  searchCache.clear();
  console.log('🧹 [DynamicRAG] Cache cleared');
}
