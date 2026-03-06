// ============================================================
//  agents/generator.js — Itinerary Generation Agent
//
//  Responsibility: Synthesize everything into a Gen-Z flavored,
//  conversational travel itinerary that feels like a friend wrote it.
// ============================================================
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createGeneratorLLM } from '../config/llm.js';

const ITINERARY_PROMPT = PromptTemplate.fromTemplate(`
You're that one friend who has done every trip and knows ALL the hidden spots.
Write a travel plan that feels like a voice note — not a Wikipedia article.
Your tone is Gen-Z: casual, excited, specific, and genuinely helpful.

━━━━━━━━━━━━━━━━ TRIP DATA ━━━━━━━━━━━━━━━━
Destination: {destination}
Duration: {duration} days
Group: {groupSize} people  
Budget: ₹{budget}/head
Travel From: {travelFrom}
Vibes: {vibes}
Constraints: {constraints}

Top Destinations Found: {destinations}

Local Knowledge (RAG): {ragContext}

Hidden Gems: {hiddenGems}

Cafes & Food: {cafes}

Where to Stay: {stays}

Travel Info: {travelTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WRITING STYLE RULES (follow these or i'll cry):
✦ Use casual Gen-Z language naturally — "okay so", "ngl", "lowkey", "the vibes are immaculate", "no cap"
✦ Give SPECIFIC tips only a local would know (not generic stuff)
✦ Never write rigid hourly schedules — say "morningish" or "after lunch" not "9:00 AM"
✦ Include at least 2 underrated spots most tourists skip
✦ Be honest about what's hard or inconvenient about the trip
✦ Use emojis sparingly but strategically 🏔️ 
✦ Mention actual prices wherever you can
✦ No corporate travel-agent energy WHATSOEVER

━━━━━━━━━━━━━━━━ OUTPUT FORMAT ━━━━━━━━━━━━━━━━
Write in this exact structure using markdown:

## ✈️ [Destination Name]: [Catchy one-liner about the trip]

### The Pitch
[2-3 sentences on why this trip is going to hit different]

### Getting There
[How to actually get there — honest about time, options, cost]

### The Rough Plan (Day by Day)
[Flexible day-wise suggestions — NOT a rigid schedule]
**Day 1:** ...
**Day 2:** ...
etc.

### Hidden Gems 💎
[2-3 underrated spots with specific insider tips]

### Food & Cafe Stops ☕
[Specific places to eat, what to order]

### Where to Crash 🏠
[Stay options with price range and vibe]

### Budget Breakdown 💰
[Rough per-person cost breakdown]

### Pro Tips 🧠
[Things they genuinely won't find on a travel blog]

### The Vibe Check ✨
[One line that captures the soul of this trip]
`);

/**
 * Generator Agent
 * Takes all collected data → produces final Gen-Z itinerary
 */
export async function generatorAgent(state) {
  console.log('✍️  [Generator] Writing the itinerary...');

  try {
    const llm = createGeneratorLLM(false);
    const chain = ITINERARY_PROMPT.pipe(llm).pipe(new StringOutputParser());

    const destination = state.destinations?.[0]?.name || state.intent?.destination || 'your destination';

    const itinerary = await chain.invoke({
      destination,
      duration: state.intent?.duration || 3,
      groupSize: state.intent?.groupSize || 2,
      budget: state.intent?.budget || 5000,
      travelFrom: state.intent?.travelFrom || 'your city',
      vibes: (state.intent?.vibes || []).join(', '),
      constraints: (state.intent?.constraints || []).join(', '),
      destinations: JSON.stringify(state.destinations || [], null, 2),
      ragContext: state.ragContext || 'No specific knowledge found',
      hiddenGems: JSON.stringify(state.hiddenGems || [], null, 2),
      cafes: JSON.stringify(state.cafes || [], null, 2),
      stays: JSON.stringify(state.stays || [], null, 2),
      travelTime: JSON.stringify(state.travelTime || {}, null, 2),
    });

    console.log(`✅ [Generator] Itinerary written (${itinerary.length} chars)`);
    return { itinerary };

  } catch (err) {
    console.error('❌ [Generator] Failed:', err.message);
    return {
      itinerary: `## Oops 😅\n\nSomething went wrong while writing your itinerary. Try asking again!\n\nError: ${err.message}`,
      error: err.message,
    };
  }
}
