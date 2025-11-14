import { motion } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  isActive: boolean;
}

interface AgentStatusListProps {
  agents: Agent[];
  selectedAgent: string | null;
  onAgentClick: (agentId: string) => void;
}

export const AgentStatusList = ({ agents, selectedAgent, onAgentClick }: AgentStatusListProps) => {
  return (
    <div className="absolute bottom-28 left-4 bg-card border border-border p-3 w-48">
      <div className="text-xs text-terminal-accent font-mono mb-3">&gt; AGENTS</div>
      
      <div className="space-y-2">
        {agents.map((agent) => (
          <motion.button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className={`w-full flex items-center gap-2 p-2 border transition-colors ${
              selectedAgent === agent.id
                ? 'border-terminal-accent bg-muted'
                : 'border-border hover:bg-muted'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg">{agent.emoji}</span>
            <div className="flex-1 text-left">
              <div className="text-xs font-mono text-foreground">{agent.name}</div>
              <div className={`text-xs ${agent.isActive ? 'text-trade-yes' : 'text-muted-foreground'}`}>
                {agent.isActive ? 'ACTIVE' : 'IDLE'}
              </div>
            </div>
            {agent.isActive && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-trade-yes"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border text-xs text-trade-yes font-mono">
        ● NEURAL NETWORK ACTIVE
      </div>
    </div>
  );
};
