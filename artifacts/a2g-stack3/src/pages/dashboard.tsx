import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AGENTS, getAgentColorClass } from "@/lib/agents";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Shield } from "lucide-react";

export default function Dashboard() {
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] A2G STACK3 Initialized.",
    "[NETWORK] Connection established to Ethereum Mainnet.",
    "[AGENTS] 23 agents loaded and ready.",
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        "[EVENT] Tokenomics Design updated vesting schedule.",
        "[EVENT] Dune query completed by Research Market.",
        "[ALERT] Gas fees high, waiting to deploy.",
        "[SYSTEM] Routine health check passed.",
        "[EVENT] GTM Strategist posted new tweet draft.",
      ];
      setLogs(prev => {
        const newLogs = [...prev, messages[Math.floor(Math.random() * messages.length)]];
        if (newLogs.length > 5) newLogs.shift();
        return newLogs;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = AGENTS.filter(a => a.status === 'ONLINE').length;

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500">
      
      {/* Quick Stats Header */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">ACTIVE AGENTS</p>
              <p className="text-2xl font-display font-bold text-primary">{onlineCount}<span className="text-sm text-muted-foreground ml-1">/ {AGENTS.length}</span></p>
            </div>
            <div className="p-2 bg-primary/10 rounded-md"><Activity className="text-primary w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">NETWORK STATUS</p>
              <p className="text-xl font-display font-bold text-emerald-400">OPTIMAL</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-md"><Server className="text-emerald-400 w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">DB LATENCY</p>
              <p className="text-xl font-display font-bold text-amber-400">12ms</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-md"><Database className="text-amber-400 w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">SECURITY</p>
              <p className="text-xl font-display font-bold text-blue-400">VERIFIED</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-md"><Shield className="text-blue-400 w-5 h-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="flex-1">
        <h2 className="font-display text-xl mb-4 text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          AGENT DEPLOYMENT GRID
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AGENTS.map((agent) => (
            <Link key={agent.id} href={`/agent/${agent.id}`}>
              <Card className={`agent-card cursor-pointer h-full bg-card/40 backdrop-blur border ${agent.status === 'OFFLINE' ? 'opacity-50 grayscale border-border/50' : getAgentColorClass(agent.color)}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-md bg-background/50 border border-border/30">
                      <agent.icon className="w-5 h-5" />
                    </div>
                    <Badge variant={agent.status === 'ONLINE' ? 'default' : 'secondary'} className={`font-mono text-[10px] ${agent.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : ''}`}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm truncate">{agent.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground truncate">{agent.role}</p>
                  </div>
                  <p className="text-xs text-muted-foreground/80 line-clamp-2">
                    {agent.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Terminal Log */}
      <div className="h-32 bg-[#05080A] rounded-md border border-border/50 overflow-hidden flex flex-col">
        <div className="h-6 bg-muted/30 border-b border-border/50 flex items-center px-3">
          <p className="text-[10px] font-mono text-muted-foreground">TERMINAL / DEV / TTY1</p>
        </div>
        <div className="p-3 font-mono text-xs space-y-1 overflow-y-auto text-muted-foreground">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-primary/70">{">"}</span>
              <span className={log.includes("ALERT") ? "text-amber-400" : log.includes("SYSTEM") ? "text-primary" : ""}>{log}</span>
            </div>
          ))}
          <div className="flex gap-2 animate-pulse">
            <span className="text-primary/70">{">"}</span>
            <span>_</span>
          </div>
        </div>
      </div>
    </div>
  );
}
