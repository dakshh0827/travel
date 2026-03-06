// ============================================================
//  config/llm.js — LLM Provider Configuration
//  Supports OpenAI and Groq (free tier!)
// ============================================================
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';

/**
 * Creates an LLM instance based on LLM_PROVIDER env var.
 * @param {object} opts - temperature, streaming, etc.
 * @returns ChatOpenAI | ChatGroq
 */
export function createLLM(opts = {}) {
  const provider = process.env.LLM_PROVIDER || 'groq';

  if (provider === 'groq') {
    return new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: opts.model || 'llama-3.3-70b-versatile', // Fast + free
      temperature: opts.temperature ?? 0.7,
      streaming: opts.streaming ?? false,
      ...opts,
    });
  }

  // Default: OpenAI
  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: opts.model || 'gpt-4o-mini',
    temperature: opts.temperature ?? 0.7,
    streaming: opts.streaming ?? false,
    ...opts,
  });
}

/**
 * Creates a low-temperature LLM for structured extraction tasks.
 */
export function createExtractorLLM() {
  return createLLM({ temperature: 0, streaming: false });
}

/**
 * Creates a creative LLM for itinerary generation.
 */
export function createGeneratorLLM(streaming = false) {
  return createLLM({ temperature: 0.8, streaming });
}
