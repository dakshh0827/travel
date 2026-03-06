// ============================================================
//  tools/ragSearch.js — Dynamic Web-Powered RAG Search Tool
//
//  REPLACED: Old static FAISS index from hardcoded JSON
//  NEW: Live web search → dynamic in-memory vector store → retrieve
//
//  This tool now works for ANY destination, not just hardcoded ones.
// ============================================================
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { buildKnowledgeBase } from '../rag/dynamicRag.js';

// Per-request KB cache (avoids rebuilding for same destination in one pipeline)
const activeKBs = new Map();

export const ragSearchTool = tool(
  async ({ destination, query, vibes }) => {
    console.log(`📚 [RAGSearch] Query: "${query}" for destination: "${destination}"`);

    try {
      const cacheKey = destination.toLowerCase().trim();

      if (!activeKBs.has(cacheKey)) {
        const kb = await buildKnowledgeBase(destination, vibes || []);
        activeKBs.set(cacheKey, kb);
      }

      const kb = activeKBs.get(cacheKey);
      const results = await kb.retrieve(query, 4);

      console.log(`✅ [RAGSearch] Retrieved ${results.length} chars of content`);
      return results;

    } catch (err) {
      console.error('❌ [RAGSearch] Error:', err.message);
      return `Could not retrieve information for ${destination}. Error: ${err.message}`;
    }
  },
  {
    name: 'rag_search',
    description: 'Search a dynamically built knowledge base about a travel destination. Retrieves relevant tips, hidden gems, local info, accommodation, food, and travel logistics from web sources.',
    schema: z.object({
      destination: z.string().describe('The destination to search knowledge for (e.g. "Spiti Valley Himachal")'),
      query:       z.string().describe('Specific question or topic to retrieve (e.g. "hidden gems offbeat places" or "homestay options budget")'),
      vibes:       z.array(z.string()).optional().describe('Travel vibes to focus search (e.g. ["snow", "stargazing", "adventure"])'),
    }),
  }
);

export async function prewarmKnowledgeBase(destination, vibes = []) {
  const cacheKey = destination.toLowerCase().trim();
  if (activeKBs.has(cacheKey)) return;

  console.log(`🔥 [RAGSearch] Pre-warming KB for: "${destination}"`);
  try {
    const kb = await buildKnowledgeBase(destination, vibes);
    activeKBs.set(cacheKey, kb);
    console.log(`✅ [RAGSearch] KB pre-warmed with ${kb.documentCount} docs`);
  } catch (err) {
    console.error('❌ [RAGSearch] Pre-warm failed:', err.message);
  }
}

export function clearActiveKBs() {
  activeKBs.clear();
}
