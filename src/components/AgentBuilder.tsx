import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Play, Square, GripVertical, X, Plus, 
  Zap, DollarSign, Terminal, Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentBuilderProps {
  walletAddress: string;
  privateKey: string;
  onDeploy?: () => void;
}

type AgentStatus = "IDLE" | "SIMULATING" | "LIVE";
type BlockType = "SIGNAL" | "FILTER" | "POSITION" | "RISK" | "EXIT" | "COPY_TRADE";
type Objective = "Market maker" | "Trend follower" | "Mean reversion" | "News / events arb";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type Model = "GROK" | "OPENAI" | "DEEPSEEK" | "GEMINI";

interface StrategyBlock {
  id: string;
  type: BlockType;
  config: Record<string, any>;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: "INFO" | "SIGNAL" | "ORDER" | "RISK" | "ERROR";
  model?: string;
  message: string;
}

interface Trade {
  id: string;
  time: string;
  market: string;
  side: "YES" | "NO";
  size: number;
  price: number;
  pnl: number;
}

interface Agent {
  id: string;
  name: string;
  model: Model;
  status: AgentStatus;
  pnl24h: number;
  winRate: number;
  markets: number;
  tags: string[];
  avatar: string;
}

export const AgentBuilder = ({ walletAddress, privateKey, onDeploy }: AgentBuilderProps) => {
  const { toast } = useToast();
  
  // Top bar state
  const [agentName, setAgentName] = useState("");
  const [status, setStatus] = useState<AgentStatus>("IDLE");
  const [pnl, setPnl] = useState(0);
  const [marketCount, setMarketCount] = useState(0);
  const [lastTrade, setLastTrade] = useState<string>("—");
  
  // Agent Blueprint state
  const [objective, setObjective] = useState<Objective>("Trend follower");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState<Model>("GROK");
  const [signalSources, setSignalSources] = useState<string[]>([]);
  const [initialCapital, setInitialCapital] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("MEDIUM");
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  
  // Strategy Canvas state
  const [blocks, setBlocks] = useState<StrategyBlock[]>([
    { id: "1", type: "SIGNAL", config: { source: "Polymarket", query: "" } },
    { id: "2", type: "POSITION", config: { aggression: "Neutral", maxPercent: 1.0 } },
    { id: "3", type: "RISK", config: { maxDrawdown: 20, maxPositions: 5, autoHedge: false } },
  ]);
  const [draggedAgent, setDraggedAgent] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Terminal state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<"LOGS" | "TRADES" | "POSITION">("LOGS");
  const [openMarkets, setOpenMarkets] = useState(3);
  const [exposure, setExposure] = useState(2.3);
  
  // Mock agents for dock
  const [agents] = useState<Agent[]>([
    { id: "1", name: "GROK-4", model: "GROK", status: "LIVE", pnl24h: 12.4, winRate: 68, markets: 139, tags: ["politics"], avatar: "/grok.png" },
    { id: "2", name: "GPT-5", model: "OPENAI", status: "LIVE", pnl24h: -8.3, winRate: 52, markets: 60, tags: ["crypto"], avatar: "/GPT.png" },
    { id: "3", name: "DEEPSEEK", model: "DEEPSEEK", status: "SIMULATING", pnl24h: 16.2, winRate: 71, markets: 23, tags: ["finance"], avatar: "/Deepseek-logo-icon.svg" },
    { id: "4", name: "GEMINI", model: "GEMINI", status: "IDLE", pnl24h: -3.1, winRate: 45, markets: 101, tags: ["sports"], avatar: "/GEMENI.png" },
  ]);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const deploymentCost = 0.1;
  
  // Generate fake logs when simulating
  useEffect(() => {
    if (status === "SIMULATING" || status === "LIVE") {
      const interval = setInterval(() => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const logTypes: Array<{ type: LogEntry["type"]; model?: string; message: string }> = [
          { type: "INFO", model: model, message: `Scanned ${Math.floor(Math.random() * 50) + 20} markets` },
          { type: "SIGNAL", model: model, message: `"ETH > $3500" probability ${Math.floor(Math.random() * 30) + 60}%` },
          { type: "ORDER", message: `BUY ${Math.floor(Math.random() * 200) + 50} YES @ $${(Math.random() * 0.3 + 0.5).toFixed(2)}` },
        ];
        
        const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
        const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: timeStr,
          type: logType.type,
          model: logType.model,
          message: logType.message,
        };
        
        setLogs(prev => [...prev.slice(-19), newLog]);
        
        if (Math.random() > 0.7) {
          const newTrade: Trade = {
            id: Date.now().toString(),
            time: timeStr,
            market: `Market ${Math.floor(Math.random() * 100)}`,
            side: Math.random() > 0.5 ? "YES" : "NO",
            size: Math.random() * 5 + 0.5,
            price: Math.random() * 0.4 + 0.5,
            pnl: (Math.random() - 0.4) * 10,
          };
          setTrades(prev => [...prev.slice(-9), newTrade]);
          setLastTrade(`${newTrade.side} @ $${newTrade.price.toFixed(2)}`);
          setMarketCount(prev => prev + 1);
        }
      }, 2000 / simulationSpeed);
      
      return () => clearInterval(interval);
    }
  }, [status, model, simulationSpeed]);
  
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);
  
  useEffect(() => {
    if (trades.length > 0) {
      setOpenMarkets(Math.min(trades.length, 10));
      setExposure(trades.reduce((sum, t) => sum + t.size, 0));
    }
  }, [trades]);
  
  const handleRunBacktest = () => {
    setStatus("SIMULATING");
    setPnl(0);
    setMarketCount(0);
    setLogs([]);
    setTrades([]);
    toast({ title: "Backtest started", description: "Simulating agent strategy..." });
  };
  
  const handleDeploy = async () => {
    if (!agentName.trim()) {
      toast({ title: "Error", description: "Please enter an agent name", variant: "destructive" });
      return;
    }
    if (!initialCapital || parseFloat(initialCapital) <= 0) {
      toast({ title: "Error", description: "Please enter valid initial capital", variant: "destructive" });
      return;
    }
    
    setStatus("LIVE");
    toast({ title: "Agent Deployed!", description: `${agentName} is now live` });
    onDeploy?.();
  };
  
  const handleStop = () => {
    setStatus("IDLE");
    toast({ title: "Stopped", description: "Agent simulation stopped" });
  };
  
  const handleAddBlock = (type: BlockType) => {
    const newBlock: StrategyBlock = {
      id: Date.now().toString(),
      type,
      config: type === "SIGNAL" ? { source: "Polymarket", query: "" } :
              type === "POSITION" ? { aggression: "Neutral", maxPercent: 1.0 } :
              type === "RISK" ? { maxDrawdown: 20, maxPositions: 5, autoHedge: false } :
              type === "FILTER" ? { condition: "", value: "" } :
              type === "EXIT" ? { condition: "", threshold: 0 } :
              { agentId: "", mirror: false },
    };
    setBlocks(prev => [...prev, newBlock]);
  };
  
  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };
  
  const handleDragStart = (agentId: string) => {
    setDraggedAgent(agentId);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (draggedAgent) {
      const agent = agents.find(a => a.id === draggedAgent);
      if (agent) {
        handleAddBlock("COPY_TRADE");
        const newBlock = blocks[blocks.length - 1];
        if (newBlock) {
          setBlocks(prev => prev.map(b => 
            b.id === newBlock.id ? { ...b, config: { ...b.config, agentId: agent.id, agentName: agent.name } } : b
          ));
        }
      }
      setDraggedAgent(null);
    }
  };
  
  const toggleSignalSource = (source: string) => {
    setSignalSources(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };
  
  const getPositionSizeText = () => {
    switch (riskLevel) {
      case "LOW": return "0.3–0.5% / trade";
      case "MEDIUM": return "0.5–1.0% / trade";
      case "HIGH": return "1.0–2.0% / trade";
    }
  };
  
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case "IDLE": return "bg-zinc-700/50 text-zinc-400 border-zinc-700/50";
      case "SIMULATING": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      case "LIVE": return "bg-trade-yes/20 text-trade-yes border-trade-yes/40";
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-[#05070a] overflow-hidden">
      {/* TOP STATUS BAR - Fixed Height */}
      <div className="h-14 px-6 border-b border-zinc-800/40 flex items-center justify-between bg-[#05070a] flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-terminal-accent font-mono tracking-wider uppercase">
            &gt; AGENT_BUILDER
          </span>
          <Input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Agent name..."
            className="h-8 w-48 text-[12px] bg-zinc-900/50 border-zinc-800/60 rounded-lg px-3 font-mono"
          />
        </div>
        
        <div className="flex items-center gap-6">
          <Badge className={`text-[9px] font-mono px-2.5 py-1 border ${getStatusColor(status)}`}>
            {status === "SIMULATING" && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1.5 inline-block animate-pulse" />}
            {status === "LIVE" && <span className="w-1.5 h-1.5 bg-trade-yes rounded-full mr-1.5 inline-block animate-pulse" />}
            {status}
          </Badge>
          
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400">
            <span>P&L: <span className={pnl >= 0 ? "text-trade-yes" : "text-trade-no"}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%</span></span>
            <span>Markets: {marketCount}</span>
            <span>Last: {lastTrade}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunBacktest}
            disabled={status !== "IDLE"}
            className="h-8 px-3 text-[10px] font-mono hover:bg-zinc-800/40"
          >
            <Play className="w-3 h-3 mr-1.5" />
            Backtest
          </Button>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={status !== "IDLE" || !agentName || !initialCapital}
            className="h-8 px-3 text-[10px] font-mono bg-terminal-accent hover:bg-terminal-accent/90 text-black"
          >
            <Zap className="w-3 h-3 mr-1.5" />
            Deploy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            disabled={status === "IDLE"}
            className="h-8 px-3 text-[10px] font-mono text-terminal-red hover:bg-terminal-red/10"
          >
            <Square className="w-3 h-3 mr-1.5" />
            Stop
          </Button>
        </div>
      </div>
      
      {/* MAIN CONTENT - No Scroll, Fixed Grid */}
      <div className="flex-1 grid grid-cols-[380px_1fr_380px] gap-4 p-4 overflow-hidden min-h-0">
        {/* LEFT: AGENT BLUEPRINT - Compact */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-4 flex flex-col gap-3 h-full">
            <h3 className="text-[10px] font-mono tracking-wider uppercase text-terminal-accent">BLUEPRINT</h3>
            
            <div className="space-y-3 flex-1 min-h-0 overflow-hidden">
              <div className="space-y-2">
                <Label className="text-[9px] font-mono uppercase text-zinc-500">Objective</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["Market maker", "Trend follower", "Mean reversion", "News / events arb"] as Objective[]).map((obj) => (
                    <Button
                      key={obj}
                      variant={objective === obj ? "default" : "outline"}
                      size="sm"
                      onClick={() => setObjective(obj)}
                      className={`text-[9px] h-7 px-2 rounded-md ${
                        objective === obj
                          ? "bg-terminal-accent text-black border-terminal-accent"
                          : "bg-zinc-900/50 border-zinc-800/60 text-zinc-400 hover:bg-zinc-800/50"
                      }`}
                    >
                      {obj}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[9px] font-mono uppercase text-zinc-500">Model</Label>
                <Select value={model} onValueChange={(v) => setModel(v as Model)}>
                  <SelectTrigger className="text-[11px] bg-zinc-900/50 border-zinc-800/60 rounded-md h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GROK">GROK</SelectItem>
                    <SelectItem value="OPENAI">OPENAI</SelectItem>
                    <SelectItem value="DEEPSEEK">DEEPSEEK</SelectItem>
                    <SelectItem value="GEMINI">GEMINI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[9px] font-mono uppercase text-zinc-500">Signals</Label>
                <div className="flex flex-wrap gap-1">
                  {["Polymarket", "Kalshi", "On-chain", "Twitter", "News"].map((source) => (
                    <Button
                      key={source}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSignalSource(source)}
                      className={`text-[9px] h-6 px-2 rounded-md ${
                        signalSources.includes(source)
                          ? "bg-terminal-accent/20 border-terminal-accent/60 text-terminal-accent"
                          : "bg-zinc-900/50 border-zinc-800/60 text-zinc-400 hover:bg-zinc-800/50"
                      }`}
                    >
                      {source}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-mono uppercase text-zinc-500">Capital (SOL)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(e.target.value)}
                      placeholder="0.00"
                      className="text-[11px] bg-zinc-900/50 border-zinc-800/60 rounded-md h-8 pr-7"
                    />
                    <DollarSign className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-mono uppercase text-zinc-500">Risk</Label>
                  <div className="flex gap-1">
                    {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((level) => (
                      <Button
                        key={level}
                        variant={riskLevel === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRiskLevel(level)}
                        className={`text-[9px] h-8 flex-1 rounded-md ${
                          riskLevel === level
                            ? "bg-terminal-accent text-black"
                            : "bg-zinc-900/50 border-zinc-800/60 text-zinc-400"
                        }`}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-zinc-800/40 space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">Deploy Fee</span>
                  <span className="text-zinc-300">{deploymentCost} SOL</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">Capital</span>
                  <span className="text-zinc-300">{initialCapital || "0.00"} SOL</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono pt-1 border-t border-zinc-800/40">
                  <span className="text-terminal-accent font-semibold">TOTAL</span>
                  <span className="text-terminal-accent font-semibold">
                    {(deploymentCost + parseFloat(initialCapital || "0")).toFixed(4)} SOL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CENTER: STRATEGY CANVAS - Fixed Height */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-mono tracking-wider uppercase text-terminal-accent">STRATEGY</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-[9px] font-mono border-zinc-800/60 bg-zinc-900/50">
                    <Plus className="w-3 h-3 mr-1" />
                    Block
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800/60">
                  <DropdownMenuItem onClick={() => handleAddBlock("SIGNAL")} className="text-[10px] font-mono">SIGNAL</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddBlock("FILTER")} className="text-[10px] font-mono">FILTER</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddBlock("POSITION")} className="text-[10px] font-mono">POSITION</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddBlock("EXIT")} className="text-[10px] font-mono">EXIT</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div
              className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDraggingOver && (
                <div className="border-2 border-dashed border-terminal-accent/40 rounded-lg p-4 text-center bg-terminal-accent/5">
                  <p className="text-[10px] font-mono text-terminal-accent">
                    Drop to copy {agents.find(a => a.id === draggedAgent)?.name || "agent"}
                  </p>
                </div>
              )}
              
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="bg-zinc-900/50 border border-zinc-800/60 rounded-lg p-3 flex items-start gap-2 group hover:border-zinc-700/60 transition-colors"
                >
                  <Badge className={`text-[8px] font-mono px-1.5 py-0.5 flex-shrink-0 ${
                    block.type === "SIGNAL" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" :
                    block.type === "POSITION" ? "bg-terminal-accent/20 text-terminal-accent border-terminal-accent/40" :
                    block.type === "RISK" ? "bg-terminal-red/20 text-terminal-red border-terminal-red/40" :
                    "bg-blue-500/20 text-blue-400 border-blue-500/40"
                  }`}>
                    {block.type}
                  </Badge>
                  
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {block.type === "SIGNAL" && (
                      <>
                        <Select value={block.config.source} onValueChange={(v) => {
                          setBlocks(prev => prev.map(b => 
                            b.id === block.id ? { ...b, config: { ...b.config, source: v } } : b
                          ));
                        }}>
                          <SelectTrigger className="text-[10px] bg-zinc-900/50 border-zinc-800/60 h-7">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Polymarket">Polymarket</SelectItem>
                            <SelectItem value="Kalshi">Kalshi</SelectItem>
                            <SelectItem value="Composite">Composite</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={block.config.query || ""}
                          onChange={(e) => {
                            setBlocks(prev => prev.map(b => 
                              b.id === block.id ? { ...b, config: { ...b.config, query: e.target.value } } : b
                            ));
                          }}
                          placeholder="Event pattern..."
                          className="text-[10px] bg-zinc-900/50 border-zinc-800/60 h-7"
                        />
                      </>
                    )}
                    
                    {block.type === "POSITION" && (
                      <div className="flex gap-1">
                        {(["Conservative", "Neutral", "Aggressive"] as const).map((agg) => (
                          <Button
                            key={agg}
                            variant={block.config.aggression === agg ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setBlocks(prev => prev.map(b => 
                                b.id === block.id ? { ...b, config: { ...b.config, aggression: agg } } : b
                              ));
                            }}
                            className={`text-[9px] h-6 px-2 rounded-md ${
                              block.config.aggression === agg
                                ? "bg-terminal-accent text-black"
                                : "bg-zinc-900/50 border-zinc-800/60 text-zinc-400"
                            }`}
                          >
                            {agg}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {block.type === "RISK" && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <Input
                            type="number"
                            value={block.config.maxDrawdown || 20}
                            onChange={(e) => {
                              setBlocks(prev => prev.map(b => 
                                b.id === block.id ? { ...b, config: { ...b.config, maxDrawdown: e.target.value } } : b
                              ));
                            }}
                            placeholder="Drawdown %"
                            className="text-[10px] bg-zinc-900/50 border-zinc-800/60 h-7"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            value={block.config.maxPositions || 5}
                            onChange={(e) => {
                              setBlocks(prev => prev.map(b => 
                                b.id === block.id ? { ...b, config: { ...b.config, maxPositions: e.target.value } } : b
                              ));
                            }}
                            placeholder="Max positions"
                            className="text-[10px] bg-zinc-900/50 border-zinc-800/60 h-7"
                          />
                        </div>
                      </div>
                    )}
                    
                    {block.type === "COPY_TRADE" && (
                      <p className="text-[10px] font-mono text-zinc-300">
                        Copy: {block.config.agentName || "Agent"}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="h-6 w-6 p-0 text-zinc-500 hover:text-terminal-red opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* RIGHT: TERMINAL - Fixed Height */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-mono tracking-wider uppercase text-terminal-accent">TERMINAL</h3>
              <Select value={simulationSpeed.toString()} onValueChange={(v) => setSimulationSpeed(parseInt(v))}>
                <SelectTrigger className="h-7 px-2 text-[9px] font-mono border-zinc-800/60 bg-zinc-900/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">x1</SelectItem>
                  <SelectItem value="5">x5</SelectItem>
                  <SelectItem value="20">x20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
              <TabsList className="bg-zinc-900/50 border-zinc-800/60 h-7 mb-2">
                <TabsTrigger value="LOGS" className="text-[9px] font-mono px-2 h-6">LOGS</TabsTrigger>
                <TabsTrigger value="TRADES" className="text-[9px] font-mono px-2 h-6">TRADES</TabsTrigger>
                <TabsTrigger value="POSITION" className="text-[9px] font-mono px-2 h-6">POS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="LOGS" className="flex-1 overflow-y-auto bg-zinc-950/50 rounded-md p-2 font-mono text-[10px] space-y-0.5 min-h-0">
                {logs.length === 0 ? (
                  <p className="text-zinc-600 text-[9px]">No logs yet</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-1.5 text-[9px]">
                      <span className="text-zinc-600">[{log.timestamp}]</span>
                      {log.model && <span className="text-cyan-400">[{log.model}]</span>}
                      <span className={`${
                        log.type === "ORDER" ? "text-terminal-accent" :
                        log.type === "ERROR" ? "text-terminal-red" :
                        log.type === "SIGNAL" ? "text-trade-yes" :
                        "text-zinc-400"
                      }`}>
                        [{log.type}]
                      </span>
                      <span className="text-zinc-300">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </TabsContent>
              
              <TabsContent value="TRADES" className="flex-1 overflow-y-auto min-h-0">
                <div className="space-y-1">
                  {trades.length === 0 ? (
                    <p className="text-zinc-600 text-[9px] font-mono">No trades</p>
                  ) : (
                    trades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-1.5 bg-zinc-900/50 rounded border border-zinc-800/40 text-[9px] font-mono">
                        <span className="text-zinc-600">{trade.time}</span>
                        <span className="text-zinc-300 truncate flex-1 mx-2">{trade.market}</span>
                        <Badge className={`text-[8px] px-1 py-0 ${
                          trade.side === "YES" ? "bg-trade-yes/20 text-trade-yes" : "bg-trade-no/20 text-trade-no"
                        }`}>
                          {trade.side}
                        </Badge>
                        <span className="text-zinc-300 mx-1.5">{trade.size.toFixed(1)}</span>
                        <span className="text-zinc-300 mx-1.5">${trade.price.toFixed(2)}</span>
                        <span className={trade.pnl >= 0 ? "text-trade-yes" : "text-trade-no"}>
                          {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(1)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="POSITION" className="flex-1 overflow-y-auto min-h-0 space-y-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">Open markets</span>
                    <span className="text-zinc-300">{openMarkets}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">Exposure</span>
                    <span className="text-zinc-300">{exposure.toFixed(2)} SOL</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                      <span>Risk</span>
                      <span>45%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800/60 rounded-full overflow-hidden">
                      <div className="h-full bg-terminal-accent/40 rounded-full" style={{ width: "45%" }} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* BOTTOM DOCK: AI AGENTS - Fixed Height */}
      <div className="h-24 border-t border-zinc-800/40 bg-[#05070a] px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[9px] font-mono tracking-wider uppercase text-terminal-accent">AGENTS</h3>
          <div className="flex gap-1">
            {["My", "Top", "Active"].map((filter) => (
              <Button
                key={filter}
                variant="outline"
                size="sm"
                className="h-5 px-2 text-[8px] font-mono border-zinc-800/60 bg-zinc-900/50 hover:bg-zinc-800/50"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto">
          {agents.map((agent) => (
            <div
              key={agent.id}
              draggable
              onDragStart={() => handleDragStart(agent.id)}
              className="min-w-[140px] bg-zinc-900/30 border border-zinc-800/40 rounded-lg p-2 cursor-move hover:border-terminal-accent/40 hover:shadow-[0_0_15px_rgba(248,204,80,.1)] transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <img src={agent.avatar} alt={agent.name} className="w-4 h-4 rounded-full object-contain" />
                  <span className="text-[9px] font-mono text-zinc-300 truncate">{agent.name}</span>
                </div>
                <Badge className={`text-[7px] font-mono px-1 py-0 border ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
                <div>
                  <span className="text-zinc-500">P&L</span>
                  <div className={agent.pnl24h >= 0 ? "text-trade-yes" : "text-trade-no"}>
                    {agent.pnl24h >= 0 ? "+" : ""}{agent.pnl24h.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500">Win</span>
                  <div className="text-zinc-300">{agent.winRate}%</div>
                </div>
                <div>
                  <span className="text-zinc-500">Mkts</span>
                  <div className="text-zinc-300">{agent.markets}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
