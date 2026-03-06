// ============================================================
//  agents/researcher.js — Travel Research Agent (Web Search Powered)
//
//  Now uses 6 live web search tools instead of a static knowledge base.
//  Searches run in parallel to minimize latency.
// ============================================================
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createLLM } from '../config/llm.js';
import { ragSearchTool, prewarmKnowledgeBase } from '../tools/ragSearch.js';
import { travelSearchTool, currentConditionsSearchTool, travelLogisticsSearchTool } from '../tools/webSearch.js';
import { destinationFinderTool } from '../tools/destinationFinder.js';
import { weatherCheckerTool } from '../tools/weatherChecker.js';

const SYSTEM_PROMPT = `You are a travel research specialist. Your job is to gather comprehensive, 
CURRENT information about the user's destination using web search tools.

RESEARCH STRATEGY — call tools in this order:
1. Call rag_search FIRST with topic "general overview hidden gems tips" to get comprehensive destination info
2. Call travel_search for specific destination highlights and experiences  
3. Call current_conditions_search to get seasonal/current travel conditions
4. Call travel_logistics_search to understand how to reach the destination
5. Call destination_finder for real places coordinates if needed
6. Call weather_checker for current weather

After ALL research is complete, synthesize into this exact JSON:
{
  "destinations": [
    {
      "name": "Specific place name",
      "region": "State/Region",
      "why": "Specific reason why this fits the user's vibe (mention actual unique things you found)",
      "altitude": "if relevant",
      "bestFor": ["specific", "vibes", "from", "research"],
      "coords": { "lat": 0.0, "lng": 0.0 },
      "openSeason": "months when accessible",
      "travelTime": "from user origin"
    }
  ],
  "ragContext": "Rich summary of ALL relevant info found — be specific, include actual place names, prices, tips from research",
  "topPick": "Single best destination name",
  "conditions": "Current travel conditions and seasonal notes"
}

CRITICAL: Be SPECIFIC. Don't say there are cafes here — name them. Don't say it is beautiful — describe HOW.`;

const tools = [
  ragSearchTool,
  travelSearchTool,
  currentConditionsSearchTool,
  travelLogisticsSearchTool,
  destinationFinderTool,
  weatherCheckerTool,
];

export async function researchAgent(state) {
  console.log('\n🔭 [Researcher] Starting web research...');

  if (!state.intent?.destination) {
    return { destinations: [], ragContext: '' };
  }

  const prewarmPromise = prewarmKnowledgeBase(
    state.intent.destination,
    state.intent.vibes || []
  );

  try {
    const llm = createLLM({ temperature: 0.1 });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', `Research this travel request using all available search tools:

DESTINATION: {destination}
VIBES/MOOD:  {vibes}
DURATION:    {duration} days
GROUP:       {groupSize} people
BUDGET:      Rs {budget} per head
TRAVEL FROM: {travelFrom}
CONSTRAINTS: {constraints}
SEASON:      {season}

Search for specific, real information. Find hidden gems, actual cafes and stays, real travel routes, and current conditions.`],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const agent = createToolCallingAgent({ llm, tools, prompt });
    const executor = new AgentExecutor({
      agent,
      tools,
      verbose:             process.env.NODE_ENV === 'development',
      maxIterations:       10,
      handleParsingErrors: true,
    });

    await prewarmPromise;

    const result = await executor.invoke({
      destination:  state.intent.destination,
      vibes:        (state.intent.vibes || []).join(', '),
      duration:     state.intent.duration || 3,
      groupSize:    state.intent.groupSize || 2,
      budget:       state.intent.budget || 5000,
      travelFrom:   state.intent.travelFrom || 'Delhi',
      constraints:  (state.intent.constraints || []).join(', '),
      season:       state.intent.season || 'current season',
    });

    let parsed = {};
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed.ragContext = result.output;
      parsed.destinations = [{
        name: state.intent.destination, region: state.intent.destination,
        why: 'Based on web research', bestFor: state.intent.vibes || [],
      }];
    }

    console.log(`✅ [Researcher] Found ${parsed.destinations?.length || 0} destinations`);
    return {
      destinations: parsed.destinations || [],
      ragContext:   parsed.ragContext || result.output,
    };

  } catch (err) {
    console.error('❌ [Researcher] Failed:', err.message);
    return {
      destinations: [{ name: state.intent.destination, region: state.intent.destination, why: 'Based on your request', bestFor: state.intent.vibes || [] }],
      ragContext:   `Destination: ${state.intent.destination}`,
    };
  }
}
