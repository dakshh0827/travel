// ============================================================
//  agents/inputParser.js — Intent Extraction Agent
//
//  Responsibility: Turn messy user text into a clean, structured
//  intent object that other agents can work with.
// ============================================================
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { createExtractorLLM } from '../config/llm.js';

const PARSE_PROMPT = PromptTemplate.fromTemplate(`
You are a travel intent extraction specialist. Your job is to parse the user's
travel request and return ONLY a valid JSON object — no markdown, no explanation.

User Message: {userMessage}

Extract these fields (use null for anything not mentioned):
{{
  "destination": "the region, state, or place they want to visit",
  "duration": <number of days as integer, or null>,
  "groupSize": <number of people as integer, or null>,
  "budget": <budget per person in INR as integer, or null>,
  "travelFrom": "their origin city if mentioned, else null",
  "vibes": ["array", "of", "mood/vibe", "keywords from their message"],
  "constraints": ["any specific requirements like accommodation type, travel time, etc"],
  "season": "summer | winter | monsoon | spring | null",
  "activities": ["list of activities they explicitly mentioned"]
}}

Rules:
- vibes should capture emotional keywords: "chill", "adventure", "snow", "stargazing", etc.
- constraints should capture hard requirements: "7-8 hours travel", "wooden homestay", "no flights"
- If budget is mentioned as "5000 per head", set budget to 5000
- Return ONLY the JSON object, nothing else
`);

/**
 * InputParser Agent
 * Takes raw user message → returns structured intent
 */
export async function inputParserAgent(state) {
  console.log('🔍 [InputParser] Extracting intent from user message...');

  try {
    const llm = createExtractorLLM();
    const chain = PARSE_PROMPT.pipe(llm).pipe(new JsonOutputParser());

    const intent = await chain.invoke({
      userMessage: state.userMessage,
    });

    console.log('✅ [InputParser] Intent extracted:', JSON.stringify(intent, null, 2));
    return { intent };

  } catch (err) {
    console.error('❌ [InputParser] Failed:', err.message);

    // Fallback: return minimal intent so the pipeline can continue
    return {
      intent: {
        destination: 'India',
        duration: 3,
        groupSize: 2,
        budget: 5000,
        vibes: ['adventure'],
        constraints: [],
        activities: [],
      },
      error: `Intent parsing failed: ${err.message}`,
    };
  }
}
