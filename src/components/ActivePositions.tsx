import { motion } from "framer-motion";

interface AgentPosition {
  id: string;
  name: string;
  emoji: string;
  pnl: number;
  openMarkets: number;
  lastTrade: string;
  isActive: boolean;
}

interface ActivePositionsProps {
  agents: AgentPosition[];
  selectedAgent: string | null;
  onAgentClick: (agentId: string) => void;
}

export const ActivePositions = ({ agents, selectedAgent, onAgentClick }: ActivePositionsProps) => {
  return (
    <div className="h-24 bg-bg-card border-t border-border">
      <div className="flex items-center gap-3 px-4 h-full overflow-x-auto">
        {agents.map((agent, index) => (
          <motion.button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className={`min-w-64 h-16 p-3 flex items-center gap-3 border transition-colors ${
              selectedAgent === agent.id
                ? 'border-terminal-accent bg-muted'
                : 'border-border bg-bg-elevated hover:bg-muted'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Agent Icon with Status */}
            <div className="relative">
              <div className="text-2xl">{agent.emoji}</div>
              {agent.isActive && (
                <motion.div
                  className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-trade-yes"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-foreground" style={{ fontWeight: 500 }}>{agent.name}</span>
                  <span className={`text-[11px] ${agent.isActive ? 'text-trade-yes' : 'text-text-muted'}`} style={{ fontWeight: 400 }}>
                    {agent.isActive ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
                <span className={`text-sm ${agent.pnl >= 0 ? 'text-trade-yes' : 'text-trade-no'}`} style={{ fontWeight: 600 }}>
                  {agent.pnl >= 0 ? '+' : ''}{agent.pnl.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-text-secondary truncate" style={{ fontWeight: 400 }}>
                {agent.openMarkets} markets • {agent.lastTrade}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
