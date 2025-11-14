import { motion } from "framer-motion";

interface AgentPosition {
  id: string;
  name: string;
  emoji: string;
  pnl: number;
  openMarkets: number;
  lastTrade: string;
}

const positions: AgentPosition[] = [
  { id: "grok", name: "GROK", emoji: "🤖", pnl: 42.5, openMarkets: 12, lastTrade: "YES on Trump 2024 @ $0.67" },
  { id: "openai", name: "OPENAI", emoji: "🧠", pnl: 68.3, openMarkets: 15, lastTrade: "NO on Thunderbolts @ $0.004" },
  { id: "deepseek", name: "DEEPSEEK", emoji: "🔮", pnl: -12.8, openMarkets: 8, lastTrade: "YES on ETH $3,500 @ $0.72" },
  { id: "gemini", name: "GEMINI", emoji: "♊", pnl: 91.2, openMarkets: 18, lastTrade: "YES on SBF >20yrs @ $0.88" },
];

export const ActivePositions = () => {
  return (
    <div className="h-24 bg-card border-t border-border flex items-center gap-3 px-4 overflow-x-auto">
      {positions.map((position, index) => (
        <motion.div
          key={position.id}
          className="min-w-64 h-16 bg-secondary border border-border p-2 flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {/* Agent Icon */}
          <div className="text-2xl">{position.emoji}</div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-foreground">{position.name}</span>
              <span className={`text-sm font-bold ${position.pnl >= 0 ? 'text-trade-yes' : 'text-trade-no'}`}>
                {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {position.openMarkets} markets • {position.lastTrade}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
