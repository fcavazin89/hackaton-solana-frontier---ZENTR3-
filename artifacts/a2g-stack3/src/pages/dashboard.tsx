import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { AGENTS, getAgentColorClass } from "@/lib/agents";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity, Server, Database, Shield, Zap, Download, Loader2,
  ChevronDown, ChevronUp, FileText, MessageSquare, CheckCircle2, Rocket,
} from "lucide-react";
import { useProject } from "@/context/project-context";
import { exportAgentPdf, exportExecutiveReport } from "@/lib/export-pdf";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OnboardingWizard } from "@/components/onboarding-wizard";

const WIZARD_KEY = "a2g_wizard_dismissed";

const KEY_AGENT_IDS = ["1", "2", "3", "4", "5", "6", "7", "9", "10", "13", "14", "21"];

const PLAN_SECTION_MAP: Record<string, "research" | "tokenomics" | "compliance" | "architecture" | "gtm"> = {
  "1": "research",
  "2": "tokenomics",
  "3": "compliance",
  "4": "architecture",
  "5": "gtm",
};

const AGENT_PROMPTS: Record<string, string> = {
  "6": "As Contract Forge, provide: 1) Smart contract specifications, 2) Core function signatures, 3) Security patterns, 4) Deployment strategy. Be technical and specific.",
  "7": "As Strategy Architect, provide: 1) High-level protocol architecture, 2) Component breakdown, 3) Integration touchpoints, 4) Scalability roadmap.",
  "9": "As CRM & Marketing, provide: 1) Launch campaign strategy, 2) Community building approach, 3) Social media plan, 4) KOL/partnership targets.",
  "10": "As Web3 PM, provide: 1) Product roadmap (Q1-Q4), 2) Feature prioritization, 3) Sprint plan, 4) KPIs and success metrics.",
  "13": "As Token Analyst, provide: 1) Viability assessment, 2) ROI projections, 3) Market positioning, 4) Risk/reward matrix.",
  "14": "As Risk Architect, provide: 1) Key risk vectors, 2) Mitigation strategies, 3) ECDM analysis, 4) Contingency playbooks.",
  "21": "As Investor Relations, provide: 1) Investment thesis, 2) Valuation framework, 3) Fundraise strategy, 4) Key investor talking points.",
};

export default function Dashboard() {
  const { businessPlan, agentOutputs, setAgentOutput, setAgentActive, activationState, setActivationState } = useProject();
  const { toast } = useToast();

  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [exportingAgentId, setExportingAgentId] = useState<string | null>(null);
  const [exportingReport, setExportingReport] = useState(false);
  const [showWizard, setShowWizard] = useState(() => {
    return activationState === "idle" && !localStorage.getItem(WIZARD_KEY);
  });
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Spr1nt3 Initialized.",
    "[NETWORK] Connection established to Ethereum Mainnet.",
    "[AGENTS] 23 agents loaded and ready.",
  ]);

  function dismissWizard() {
    localStorage.setItem(WIZARD_KEY, "1");
    setShowWizard(false);
  }

  const onlineCount = AGENTS.filter(a => a.status === "ONLINE").length;
  const doneCount = KEY_AGENT_IDS.filter(id => agentOutputs[id]?.status === "done").length;
  const isActive = activationState === "active";
  const isActivating = activationState === "activating";

  useEffect(() => {
    if (isActive || isActivating) return;
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
        if (newLogs.length > 6) newLogs.shift();
        return newLogs;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isActive, isActivating]);

  const streamAgent = useCallback(async (agentId: string) => {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent || !businessPlan) return;

    setAgentOutput(agentId, { agentId, content: "", status: "generating" });

    const extraPrompt = AGENT_PROMPTS[agentId] || `As ${agent.name}, provide your key analysis and deliverables for this project.`;

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          agentRole: agent.role,
          systemPrompt: `You are ${agent.name}, a specialized Web3 AI agent. Role: ${agent.role}. ${agent.description}`,
          message: `Project: ${businessPlan.projectName}\n\nCore thesis: ${businessPlan.description}\n\n${extraPrompt}\n\nFormat with bold headers using ** and bullet points. Keep focused and under 400 words.`,
          history: [],
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setAgentOutput(agentId, { agentId, content: fullContent, status: "generating" });
              }
            } catch {}
          }
        }
      }

      setAgentOutput(agentId, { agentId, content: fullContent || "Analysis complete.", status: "done" });
      setLogs(prev => {
        const a = AGENTS.find(x => x.id === agentId);
        return [...prev.slice(-5), `[AGENT:${a?.role}] Output generated — ${fullContent.length} tokens`];
      });
    } catch {
      setAgentOutput(agentId, { agentId, content: "Generation error. Please retry.", status: "error" });
    }
  }, [businessPlan, setAgentOutput]);

  const activateAllAgents = useCallback(async () => {
    if (!businessPlan) return;
    setActivationState("activating");

    setLogs(prev => [...prev, `[SYSTEM] Activating all agents for: ${businessPlan.projectName}`]);

    // Immediately map plan sections to core agents
    const coreIds = Object.keys(PLAN_SECTION_MAP);
    for (const id of coreIds) {
      const section = PLAN_SECTION_MAP[id];
      const content = businessPlan[section] || "";
      setAgentOutput(id, { agentId: id, content, status: "done" });
    }

    // Call API for remaining agents concurrently
    const apiIds = KEY_AGENT_IDS.filter(id => !coreIds.includes(id));
    await Promise.all(apiIds.map(id => streamAgent(id)));

    setActivationState("active");
    setLogs(prev => [...prev, "[SYSTEM] All agents active. Executive report available."]);
    toast({ title: "Command Center Active", description: `${KEY_AGENT_IDS.length} agents online for ${businessPlan.projectName}` });
  }, [businessPlan, setActivationState, setAgentOutput, streamAgent, toast]);

  async function handleExportAgent(agentId: string) {
    const agent = AGENTS.find(a => a.id === agentId);
    const output = agentOutputs[agentId];
    if (!agent || !output || !businessPlan) return;
    setExportingAgentId(agentId);
    try {
      await exportAgentPdf(agent, output, businessPlan.projectName);
    } finally {
      setExportingAgentId(null);
    }
  }

  async function handleExportReport() {
    if (!businessPlan) return;
    setExportingReport(true);
    try {
      await exportExecutiveReport(businessPlan, agentOutputs, AGENTS);
    } finally {
      setExportingReport(false);
    }
  }

  const keyAgents = AGENTS.filter(a => KEY_AGENT_IDS.includes(a.id));
  const standbyAgents = AGENTS.filter(a => !KEY_AGENT_IDS.includes(a.id));
  const maturityScore = KEY_AGENT_IDS.reduce((score, id) => {
    const output = agentOutputs[id];
    if (!output) return score;
    if (output.status === "done") return score + 2;
    if (output.status === "generating") return score + 1;
    if (output.status === "error") return score;
    return score;
  }, 0);
  const maturityBlocks = Math.max(6, KEY_AGENT_IDS.length);
  const maturityFilled = Math.min(maturityBlocks, Math.round((maturityScore / (KEY_AGENT_IDS.length * 2)) * maturityBlocks));
  const maturityLabel = maturityFilled >= 5 ? "MATURE" : maturityFilled >= 3 ? "EVOLVING" : "EARLY";

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500">

      {/* Onboarding Wizard overlay */}
      {showWizard && <OnboardingWizard onDismiss={dismissWizard} />}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* LEGO maturity map */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-sm text-muted-foreground">PROJECT MATURITY MAP</p>
              <p className="text-xs font-mono text-muted-foreground">Baseado no estado dos agentes e resultados gerados</p>
            </div>
            <Badge className="font-mono bg-primary/20 text-primary border border-primary/40">{maturityLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: maturityBlocks }).map((_, i) => (
              <div
                key={i}
                className={`h-6 w-10 rounded-md border ${i < maturityFilled ? "bg-primary border-primary/60 shadow-[0_0_18px_rgba(0,209,255,0.18)]" : "bg-muted/20 border-border/60"}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-muted-foreground">
            <div>DONE: {doneCount}</div>
            <div>GENERATING: {Object.values(agentOutputs).filter(o => o.status === "generating").length}</div>
            <div>PENDING: {KEY_AGENT_IDS.length - doneCount - Object.values(agentOutputs).filter(o => o.status === "generating").length}</div>
            <div>SCORE: {Math.round((maturityFilled / maturityBlocks) * 100)}%</div>
          </div>
        </CardContent>
      </Card>

      {/* READY state: activation CTA */}
      {activationState === "ready" && businessPlan && (
        <div className="relative overflow-hidden rounded-lg border border-primary/50 bg-primary/5 p-5">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-display font-bold text-primary text-lg tracking-wider">PLAN LOADED — {businessPlan.projectName.toUpperCase()}</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">
                12 key agents ready to generate domain-specific analysis. All outputs exportable individually or as a full executive report.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider shrink-0 text-base px-8"
              onClick={activateAllAgents}
            >
              <Zap className="w-5 h-5 mr-2" />
              ACTIVATE ALL AGENTS
            </Button>
          </div>
        </div>
      )}

      {/* ACTIVATING state: progress bar */}
      {isActivating && (
        <div className="rounded-lg border border-primary/40 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="font-mono text-sm text-primary">GENERATING AGENT OUTPUTS...</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{doneCount} / {KEY_AGENT_IDS.length}</span>
          </div>
          <Progress value={(doneCount / KEY_AGENT_IDS.length) * 100} className="h-1.5" />
        </div>
      )}

      {/* ACTIVE state: header + export buttons */}
      {isActive && businessPlan && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-display font-bold text-emerald-400">{businessPlan.projectName.toUpperCase()} — COMMAND CENTER ACTIVE</p>
              <p className="text-xs font-mono text-muted-foreground">{doneCount} agents processed · All outputs ready for export</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10"
              onClick={handleExportReport}
              disabled={exportingReport}
            >
              {exportingReport
                ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />GENERATING...</>
                : <><FileText className="w-3 h-3 mr-2" />EXECUTIVE REPORT</>
              }
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => KEY_AGENT_IDS.forEach(id => {
                const agent = AGENTS.find(a => a.id === id);
                const output = agentOutputs[id];
                if (agent && output?.status === "done") exportAgentPdf(agent, output, businessPlan.projectName);
              })}
            >
              <Download className="w-3 h-3 mr-2" />
              ALL PDFs
            </Button>
          </div>
        </div>
      )}

      {/* Key Agents Grid — shown during activating or active */}
      {(isActivating || isActive) && (
        <div>
          <h2 className="font-display text-lg mb-4 text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            KEY AGENT OUTPUTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keyAgents.map(agent => {
              const output = agentOutputs[agent.id];
              const isGenerating = output?.status === "generating";
              const isDone = output?.status === "done";
              const isExpanded = expandedAgentId === agent.id;
              const isExportingThis = exportingAgentId === agent.id;

              return (
                <Card
                  key={agent.id}
                  className={`bg-card/40 backdrop-blur border transition-all duration-300 ${
                    isDone
                      ? getAgentColorClass(agent.color)
                      : isGenerating
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/30 opacity-50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-background/50 border border-border/30">
                          <agent.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-sm">{agent.name}</h3>
                          <p className="text-[10px] font-mono text-muted-foreground">{agent.role}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[9px] shrink-0 ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                            : isGenerating
                            ? "bg-primary/20 text-primary border-primary/50 animate-pulse"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isDone ? "ACTIVE" : isGenerating ? "GENERATING" : "PENDING"}
                      </Badge>
                    </div>

                    {isGenerating && (
                      <div className="space-y-1.5 mb-3">
                        <div className="h-2 bg-primary/20 rounded animate-pulse w-full"></div>
                        <div className="h-2 bg-primary/15 rounded animate-pulse w-4/5"></div>
                        <div className="h-2 bg-primary/10 rounded animate-pulse w-3/5"></div>
                        {output?.content && (
                          <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 font-mono">
                            {output.content.slice(0, 100)}...
                          </p>
                        )}
                      </div>
                    )}

                    {isDone && output?.content && (
                      <>
                        {!isExpanded && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-3 mb-3">
                            {output.content.slice(0, 140).replace(/[#*_]/g, "")}...
                          </p>
                        )}
                        {isExpanded && (
                          <ScrollArea className="h-56 mb-3 pr-2">
                            <div className="prose prose-invert prose-xs max-w-none text-[12px]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {output.content}
                              </ReactMarkdown>
                            </div>
                          </ScrollArea>
                        )}
                        <div className="flex gap-1.5 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-mono flex-1 text-muted-foreground hover:text-foreground"
                            onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                          >
                            {isExpanded ? <><ChevronUp className="w-3 h-3 mr-1" />COLLAPSE</> : <><ChevronDown className="w-3 h-3 mr-1" />EXPAND</>}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-mono text-primary hover:bg-primary/10"
                            onClick={() => handleExportAgent(agent.id)}
                            disabled={isExportingThis}
                          >
                            {isExportingThis
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <><Download className="w-3 h-3 mr-1" />PDF</>
                            }
                          </Button>
                          <Link href={`/agent/${agent.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-mono text-muted-foreground hover:text-foreground">
                              <MessageSquare className="w-3 h-3 mr-1" />CHAT
                            </Button>
                          </Link>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard Agent Grid — idle/ready or standby agents */}
      <div className="flex-1">
        <h2 className="font-display text-xl mb-4 text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          {isActive ? "STANDBY AGENTS" : "AGENT DEPLOYMENT GRID"}
        </h2>
        <p className="mb-3 text-xs font-mono text-muted-foreground">
          ONLINE = disponível · OFFLINE = standby/inativo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(isActive ? standbyAgents : AGENTS).map((agent) => (
            <Link key={agent.id} href={`/agent/${agent.id}`}>
              <Card className={`agent-card cursor-pointer h-full bg-card/40 backdrop-blur border ${agent.status === "OFFLINE" ? "opacity-50 grayscale border-border/50" : getAgentColorClass(agent.color)}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-md bg-background/50 border border-border/30">
                      <agent.icon className="w-5 h-5" />
                    </div>
                    <Badge variant={agent.status === "ONLINE" ? "default" : "secondary"} className={`font-mono text-[10px] ${agent.status === "ONLINE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : ""}`}>
                      {isActive ? "STANDBY" : agent.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm truncate">{agent.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground truncate">{agent.role}</p>
                  </div>
                  <p className="text-xs text-muted-foreground/80 line-clamp-2">{agent.description}</p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-mono flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAgentActive(agent.id, true);
                      }}
                    >
                      LIGAR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-mono flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAgentActive(agent.id, false);
                      }}
                    >
                      DESLIGAR
                    </Button>
                  </div>
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
              <span className={
                log.includes("ALERT") ? "text-amber-400" :
                log.includes("SYSTEM") ? "text-primary" :
                log.includes("AGENT:") ? "text-violet-400" : ""
              }>{log}</span>
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
