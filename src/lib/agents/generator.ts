/**
 * Agent trade generator
 * 
 * Main entry point for generating trades for an agent.
 * Orchestrates market fetching, news aggregation, scoring, and trade generation.
 */

import type { AgentId, AgentTrade, Market, NewsArticle } from './domain';
import { getAgentProfile } from './domain';
// Use the same market fetching as bubble maps
// The trading engine will use markets from the server's /api/predictions endpoint
// This ensures we use the SAME API keys and data source
import { fetchAllMarkets } from '../markets/polymarket';
import { fetchLatestNews } from '../news/aggregator';
import { filterCandidateMarkets, scoreMarketForAgent, computeNewsRelevance } from './scoring';
import { generateTradeForMarket } from './engine';
import { getCachedAgentTrades, setCachedAgentTrades } from './cache';

/**
 * Generate trades for a specific agent
 * 
 * Pipeline:
 * 1. Fetch all markets (cached 60s)
 * 2. Fetch all news (cached 5min)
 * 3. Filter candidate markets for agent
 * 4. Score each candidate
 * 5. Sort by score and take top N
 * 6. Generate trades
 * 7. Cache results
 * 
 * @param agentId - Agent identifier
 * @returns Array of agent trades
 */
export async function generateAgentTrades(agentId: AgentId): Promise<AgentTrade[]> {
  const startTime = Date.now();
  console.log(`[Agent:${agentId}] 🚀 Starting trade generation`);
  
  const agent = getAgentProfile(agentId);
  console.log(`[Agent:${agentId}] Profile: ${agent.displayName}, maxTrades: ${agent.maxTrades}, risk: ${agent.risk}`);
  
  // Fetch data sources
  console.log(`[Agent:${agentId}] 📊 Fetching markets and news...`);
  const [markets, newsArticles] = await Promise.all([
    fetchAllMarkets(),
    fetchLatestNews(),
  ]);
  
  console.log(`[Agent:${agentId}] ✅ Fetched ${markets.length} markets, ${newsArticles.length} news articles`);
  
  // Check cache before computing
  const currentMarketIds = markets.map(m => m.id).sort();
  const cached = getCachedAgentTrades(agentId, currentMarketIds);
  if (cached !== null) {
    console.log(`[Agent:${agentId}] 💾 Cache hit - returning ${cached.length} cached trades`);
    return cached;
  }
  console.log(`[Agent:${agentId}] 💾 Cache miss - generating new trades`);
  
  // Filter candidate markets
  console.log(`[Agent:${agentId}] 🔍 Filtering candidate markets (minVolume: $${agent.minVolume}, minLiquidity: $${agent.minLiquidity})...`);
  const candidates = filterCandidateMarkets(agent, markets);
  console.log(`[Agent:${agentId}] ✅ Found ${candidates.length} candidate markets`);
  
  if (candidates.length === 0) {
    console.warn(`[Agent:${agentId}] ⚠️ No candidate markets found - returning empty array`);
    return [];
  }
  
  // Score all candidates with agent-specific weights and recency-aware news
  console.log(`[Agent:${agentId}] 📈 Scoring ${candidates.length} candidate markets...`);
  const now = new Date();
  const scoredMarkets = candidates.map(market => {
    // Use agent-specific weighted scoring with recency-aware news
    return scoreMarketForAgent(market, newsArticles, agent, now);
  });
  
  // Sort by weighted score descending
  scoredMarkets.sort((a, b) => b.score - a.score);
  console.log(`[Agent:${agentId}] ✅ Scoring complete. Top score: ${scoredMarkets[0]?.score.toFixed(1) || 'N/A'}`);
  
  // Take top markets (2x maxTrades for safety, then filter)
  const topMarkets = scoredMarkets.slice(0, agent.maxTrades * 2);
  console.log(`[Agent:${agentId}] 🎯 Selected top ${topMarkets.length} markets for trade generation`);
  
  // Generate trades (now async due to AI API calls)
  const nowMs = Date.now();
  const trades: AgentTrade[] = [];
  
  console.log(`[Agent:${agentId}] 🤖 Generating trades for ${topMarkets.length} markets...`);
  for (let i = 0; i < topMarkets.length; i++) {
    const scored = topMarkets[i];
    console.log(`[Agent:${agentId}] 📝 Processing market ${i + 1}/${topMarkets.length}: "${scored.question.substring(0, 50)}..." (score: ${scored.score.toFixed(1)})`);
    
    // News relevance still computed for reasoning (legacy compatibility)
    const newsRelevance = computeNewsRelevance(scored, newsArticles);
    
    try {
      const trade = await generateTradeForMarket(
        agent,
        scored,
        newsRelevance,
        newsArticles,
        i,
        nowMs
      );
      
      if (trade) {
        trades.push(trade);
        console.log(`[Agent:${agentId}] ✅ Generated trade ${trades.length}: ${trade.side} @ ${(trade.confidence * 100).toFixed(0)}% confidence`);
      } else {
        console.log(`[Agent:${agentId}] ⏭️ Skipped market (score too low or other reason)`);
      }
    } catch (error) {
      console.error(`[Agent:${agentId}] ❌ Failed to generate trade for market ${scored.id}:`, error);
      // Continue to next market
    }
    
    // Stop once we have enough trades
    if (trades.length >= agent.maxTrades) {
      console.log(`[Agent:${agentId}] 🎯 Reached max trades (${agent.maxTrades}) - stopping`);
      break;
    }
  }
  
  const duration = Date.now() - startTime;
  console.log(`[Agent:${agentId}] ✅ Trade generation complete: ${trades.length} trades generated in ${duration}ms`);
  
  // Cache results
  setCachedAgentTrades(agentId, trades, currentMarketIds);
  
  return trades;
}





