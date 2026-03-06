// ============================================================
//  agents/graph.js — LangGraph Workflow Definition
//  This is the "brain" that orchestrates all agents in order.
// ============================================================
import { StateGraph, END } from '@langchain/langgraph';
import { travelStateChannels } from './state.js';
import { inputParserAgent } from './inputParser.js';
import { researchAgent } from './researcher.js';
import { discoveryAgent } from './discoverer.js';
import { generatorAgent } from './generator.js';

let compiledGraph = null;

/**
 * Builds and compiles the LangGraph agent workflow.
 * Graph is compiled once and reused for all requests.
 *
 * Flow: parse → research → discover → generate → END
 */
export function buildTravelGraph() {
  if (compiledGraph) return compiledGraph;

  console.log('🔧 Building LangGraph travel workflow...');

  const graph = new StateGraph({ channels: travelStateChannels });

  // ── Register Agent Nodes ───────────────────────────────────
  graph.addNode('parse',    inputParserAgent);
  graph.addNode('research', researchAgent);
  graph.addNode('discover', discoveryAgent);
  graph.addNode('generate', generatorAgent);

  // ── Define Execution Order ─────────────────────────────────
  graph.setEntryPoint('parse');
  graph.addEdge('parse',    'research');
  graph.addEdge('research', 'discover');
  graph.addEdge('discover', 'generate');
  graph.addEdge('generate', END);

  compiledGraph = graph.compile();
  console.log('✅ LangGraph workflow ready');

  return compiledGraph;
}

/**
 * Run the full travel planning pipeline.
 * @param {string} userMessage - Raw user input
 * @param {string} sessionId - Session identifier
 * @param {Array}  chatHistory - Previous conversation messages
 * @returns {object} Final state with itinerary
 */
export async function runTravelAgent(userMessage, sessionId, chatHistory = []) {
  const graph = buildTravelGraph();

  const initialState = {
    userMessage,
    sessionId,
    chatHistory,
  };

  console.log(`\n🗺️  Starting travel planning for session: ${sessionId}`);
  console.log(`   Input: "${userMessage.slice(0, 80)}..."`);

  try {
    const finalState = await graph.invoke(initialState);
    console.log(`✅ Itinerary generated for session: ${sessionId}`);
    return finalState;
  } catch (err) {
    console.error(`❌ Graph execution failed:`, err.message);
    return {
      userMessage,
      sessionId,
      error: err.message,
      itinerary: "Oof, something went sideways on our end 😅 Try again?",
    };
  }
}
