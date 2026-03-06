// ============================================================
//  agents/discoverer.js — Destination Discovery Agent (Web Search Powered)
// ============================================================
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createLLM } from '../config/llm.js';
import { ragSearchTool } from '../tools/ragSearch.js';
import { hiddenGemsSearchTool, cafeSearchTool, staySearchTool, travelLogisticsSearchTool } from '../tools/webSearch.js';
import { distanceCheckerTool } from '../tools/distanceChecker.js';

const SYSTEM_PROMPT = `You are a local travel insider who knows every hidden corner of India.
Find non-touristy, authentic experiences using live web search tools.

DISCOVERY STRATEGY:
1. rag_search: query "hidden gems underrated spots local secrets"
2. hidden_gems_search: find offbeat and underrated places
3. cafe_search: authentic local cafes and food spots
4. stay_search: accommodation matching the budget
5. travel_logistics_search: how to get there
6. distance_checker: exact travel time

After all searches respond with ONLY this JSON:
{
  "hiddenGems": [{"name":"","type":"","vibe":"","tip":"","bestTime":"","source":""}],
  "cafes": [{"name":"","specialty":"","priceLevel":1,"vibe":"","location":""}],
  "stays": [{"name":"","type":"","pricePerNight":0,"vibe":"","bookingTip":""}],
  "travelTime": {"duration":"","distance":"","mode":"","tip":"","stops":[]}
}

Use ONLY real information from web searches. Do not invent places.`;

const tools = [ragSearchTool, hiddenGemsSearchTool, cafeSearchTool, staySearchTool, travelLogisticsSearchTool, distanceCheckerTool];

export async function discoveryAgent(state) {
  console.log('\n🗺️  [Discoverer] Searching for hidden gems, cafes, stays...');

  const topDestination = state.destinations?.[0]?.name || state.intent?.destination;
  if (!topDestination) return { hiddenGems: [], cafes: [], stays: [], travelTime: null };

  try {
    const llm = createLLM({ temperature: 0.2 });
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', `Find hidden gems, cafes, stays for:
DESTINATION: {destination}
VIBES: {vibes}
BUDGET: Rs {budget} per night
GROUP: {groupSize}
FROM: {travelFrom}
PREFERENCES: {constraints}

Use all search tools. Only use real places from search results.`],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const agent = createToolCallingAgent({ llm, tools, prompt });
    const executor = new AgentExecutor({ agent, tools, verbose: process.env.NODE_ENV === 'development', maxIterations: 12, handleParsingErrors: true });

    const result = await executor.invoke({
      destination: topDestination,
      vibes:       (state.intent?.vibes || []).join(', '),
      budget:      Math.floor((state.intent?.budget || 3000) * 0.3),
      groupSize:   state.intent?.groupSize || 2,
      travelFrom:  state.intent?.travelFrom || 'Delhi',
      constraints: (state.intent?.constraints || []).join(', '),
    });

    let parsed = {};
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { parsed = {}; }

    console.log(`✅ [Discoverer] Found: ${parsed.hiddenGems?.length || 0} gems, ${parsed.cafes?.length || 0} cafes, ${parsed.stays?.length || 0} stays`);
    return { hiddenGems: parsed.hiddenGems || [], cafes: parsed.cafes || [], stays: parsed.stays || [], travelTime: parsed.travelTime || null };

  } catch (err) {
    console.error('❌ [Discoverer] Failed:', err.message);
    return { hiddenGems: [], cafes: [], stays: [], travelTime: null };
  }
}
