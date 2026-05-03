import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Map, Layers, Bot, Loader2, ChevronRight,
  CheckCircle2, Clock, Zap, MessageSquare, RefreshCw, Milestone, Flag,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";
import {
  useProject, RoadmapPhase,
  createSprintsFromPlan, createRoadmapFromPlan,
} from "@/context/project-context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PHASE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  DISCOVERY:    { bg: "bg-violet-500/20",  text: "text-violet-400",  bar: "#8B5CF6" },
  DESIGN:       { bg: "bg-blue-500/20",    text: "text-blue-400",    bar: "#3B82F6" },
  ARCHITECTURE: { bg: "bg-cyan-500/20",    text: "text-cyan-400",    bar: "#00D1FF" },
  DEVELOPMENT:  { bg: "bg-amber-500/20",   text: "text-amber-400",   bar: "#F59E0B" },
  TESTING:      { bg: "bg-rose-500/20",    text: "text-rose-400",    bar: "#F43F5E" },
  LAUNCH:       { bg: "bg-emerald-500/20", text: "text-emerald-400", bar: "#10B981" },
};

const STATUS_BADGE: Record<string, string> = {
  DONE:        "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  IN_PROGRESS: "bg-primary/20 text-primary border-primary/40",
  PLANNED:     "bg-muted/20 text-muted-foreground border-border/50",
};

const TOTAL_WEEKS = 12;

const PO_SYSTEM = `You are a Web3 Product Owner. You drive product vision, manage backlog priorities, and ensure maximum value delivery.
Speak clearly about user stories, acceptance criteria, roadmap trade-offs, and Web3 product strategy.
Format responses with ** bold headers ** and bullet points.`;

const DEFAULT_PHASES: RoadmapPhase[] = [
  { id: "ph1", name: "Discovery", phase: "DISCOVERY", startWeek: 0, durationWeeks: 2, storyPoints: 13, status: "DONE", milestone: "Market Validated", agentIds: ["1","10","12"], deliverables: ["Competitor matrix","User personas","Problem statement"] },
  { id: "ph2", name: "Design & Architecture", phase: "DESIGN", startWeek: 1, durationWeeks: 3, storyPoints: 21, status: "IN_PROGRESS", milestone: "Design Approved", agentIds: ["4","7","12","11"], deliverables: ["System design","Tokenomics v1","Wireframes"] },
  { id: "ph3", name: "Smart Contract Dev", phase: "ARCHITECTURE", startWeek: 3, durationWeeks: 4, storyPoints: 34, status: "IN_PROGRESS", milestone: "Contracts Deployed", agentIds: ["6","4","3","11"], deliverables: ["Core contracts","ERC-20 token","Vesting contract"] },
  { id: "ph4", name: "Backend & APIs", phase: "DEVELOPMENT", startWeek: 4, durationWeeks: 4, storyPoints: 34, status: "PLANNED", milestone: "API Live", agentIds: ["4","7","10","11"], deliverables: ["REST API","Indexer","SDK"] },
  { id: "ph5", name: "Security & Testing", phase: "TESTING", startWeek: 7, durationWeeks: 3, storyPoints: 21, status: "PLANNED", milestone: "Audit Passed", agentIds: ["audit","14","17"], deliverables: ["Audit report","Pentest","QA sign-off"] },
  { id: "ph6", name: "Launch & Growth", phase: "LAUNCH", startWeek: 9, durationWeeks: 3, storyPoints: 13, status: "PLANNED", milestone: "Mainnet Live", agentIds: ["5","9","20","21"], deliverables: ["Mainnet deploy","Token launch","Community live"] },
];

export default function Roadmap() {
  const {
    businessPlan, roadmapPhases: contextPhases,
    setRoadmapPhases, sprints, setSprints,
  } = useProject();

  const phases = contextPhases.length > 0 ? contextPhases : DEFAULT_PHASES;
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [poHistory, setPoHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [poOutput, setPoOutput] = useState("");
  const [poLoading, setPoLoading] = useState(false);
  const [poInput, setPoInput] = useState("");

  const totalSP = phases.reduce((s, p) => s + p.storyPoints, 0);
  const doneSP  = phases.filter(p => p.status === "DONE").reduce((s, p) => s + p.storyPoints, 0);
  const inProgSP = phases.filter(p => p.status === "IN_PROGRESS").reduce((s, p) => s + p.storyPoints, 0);

  const spBarData = phases.map(p => ({
    name: p.name.split(" ")[0],
    points: p.storyPoints,
    color: PHASE_COLORS[p.phase]?.bar || "#5A6470",
    phase: p.phase,
  }));

  const initRoadmap = useCallback(() => {
    if (!businessPlan) return;
    setRoadmapPhases(createRoadmapFromPlan(businessPlan));
    if (sprints.length === 0) setSprints(createSprintsFromPlan(businessPlan));
  }, [businessPlan, setRoadmapPhases, sprints.length, setSprints]);

  const askPO = useCallback(async (msg: string) => {
    if (!msg.trim() || poLoading) return;
    setPoLoading(true);
    const userMsg = { role: "user", content: msg };
    const newHistory = [...poHistory, userMsg];
    setPoHistory(newHistory);
    setPoInput("");
    setPoOutput("");

    const context = businessPlan
      ? `Project: ${businessPlan.projectName}. Total roadmap: ${totalSP} story points across ${phases.length} phases. Done: ${doneSP} SP. In progress: ${inProgSP} SP. Phases: ${phases.map(p => `${p.name}(${p.status})`).join(", ")}.`
      : "No project loaded yet.";

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "12",
          agentRole: "PO",
          systemPrompt: PO_SYSTEM,
          message: `${context}\n\n${msg}`,
          history: poHistory,
        }),
      });
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = ""; let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try { const d = JSON.parse(line.slice(6)); if (d.content) { full += d.content; setPoOutput(full); } } catch {}
          }
        }
      }
      setPoHistory(prev => [...prev, { role: "model", content: full || "Product analysis complete." }]);
      setPoOutput("");
    } catch { setPoOutput(""); }
    finally { setPoLoading(false); }
  }, [poHistory, poLoading, businessPlan, totalSP, doneSP, inProgSP, phases]);

  const selected = phases.find(p => p.id === selectedPhase);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Map className="w-6 h-6 text-primary" />
            PRODUCT ROADMAP
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            {businessPlan ? `${businessPlan.projectName} · Discovery → Prototype` : "Discovery → Prototype · Full lifecycle map"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {contextPhases.length === 0 && businessPlan && (
            <Button size="sm" variant="outline" className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10" onClick={initRoadmap}>
              <Zap className="w-3 h-3 mr-1" />GENERATE ROADMAP
            </Button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "TOTAL SP", value: totalSP, color: "text-foreground" },
          { label: "COMPLETED", value: `${doneSP} SP`, color: "text-emerald-400" },
          { label: "IN_PROGRESS", value: `${inProgSP} SP`, color: "text-primary" },
          { label: "PHASES", value: `${phases.filter(p => p.status === "DONE").length} / ${phases.length}`, color: "text-amber-400" },
        ].map(k => (
          <Card key={k.label} className="bg-card/50 border-border/50">
            <CardContent className="p-3">
              <p className="text-[10px] font-mono text-muted-foreground">{k.label}</p>
              <p className={`text-xl font-display font-bold ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="gantt">
        <TabsList className="font-mono text-xs bg-muted/30 border border-border/50">
          <TabsTrigger value="gantt">GANTT CHART</TabsTrigger>
          <TabsTrigger value="storypoints">STORY POINTS</TabsTrigger>
          <TabsTrigger value="po">PRODUCT OWNER AI</TabsTrigger>
        </TabsList>

        {/* ── GANTT ─────────────────────────────────────────────── */}
        <TabsContent value="gantt" className="mt-4 space-y-4">
          {/* Week ruler */}
          <Card className="bg-card/50 border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="mb-3">
                <div className="flex text-[9px] font-mono text-muted-foreground mb-1 ml-[180px]">
                  {Array.from({ length: TOTAL_WEEKS + 1 }, (_, i) => (
                    <div key={i} style={{ width: `${100 / TOTAL_WEEKS}%` }} className="text-center shrink-0">{i > 0 ? `W${i}` : ""}</div>
                  ))}
                </div>
                {/* Week grid lines */}
                <div className="relative ml-[180px]">
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                      <div key={i} style={{ width: `${100 / TOTAL_WEEKS}%` }} className="border-l border-border/30 h-full" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {phases.map(phase => {
                  const colors = PHASE_COLORS[phase.phase];
                  const leftPct = (phase.startWeek / TOTAL_WEEKS) * 100;
                  const widthPct = (phase.durationWeeks / TOTAL_WEEKS) * 100;
                  const isSelected = selectedPhase === phase.id;

                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center gap-2 cursor-pointer group rounded transition-all ${isSelected ? "bg-muted/20" : "hover:bg-muted/10"}`}
                      onClick={() => setSelectedPhase(isSelected ? null : phase.id)}
                    >
                      {/* Phase label */}
                      <div className="w-[180px] shrink-0 flex items-center gap-2 pr-3">
                        <div className={`w-2 h-2 rounded-sm shrink-0 ${colors.bg}`} style={{ backgroundColor: colors.bar }} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono font-bold truncate">{phase.name}</p>
                          <p className={`text-[9px] font-mono ${colors.text}`}>{phase.storyPoints} SP</p>
                        </div>
                      </div>

                      {/* Bar area */}
                      <div className="flex-1 relative h-8">
                        <div className="absolute inset-0 flex">
                          {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                            <div key={i} style={{ width: `${100 / TOTAL_WEEKS}%` }} className="border-l border-border/20 h-full" />
                          ))}
                        </div>
                        <div
                          className={`absolute h-6 top-1 rounded flex items-center px-2 transition-all ${isSelected ? "ring-1 ring-white/30" : ""}`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: colors.bar + "33",
                            borderLeft: `3px solid ${colors.bar}`,
                          }}
                        >
                          <span className="text-[9px] font-mono font-bold truncate" style={{ color: colors.bar }}>
                            {phase.name}
                          </span>
                        </div>
                        {/* Milestone marker */}
                        {phase.milestone && (
                          <div
                            className="absolute top-0 bottom-0 flex flex-col items-center"
                            style={{ left: `${leftPct + widthPct}%` }}
                          >
                            <div className="w-0.5 h-full bg-white/20" />
                            <Flag className="w-3 h-3 absolute -top-0.5" style={{ color: colors.bar }} />
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="w-[90px] shrink-0">
                        <Badge variant="outline" className={`font-mono text-[8px] py-0 ${STATUS_BADGE[phase.status]}`}>
                          {phase.status === "IN_PROGRESS" ? "IN_PROG" : phase.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Phase Detail Panel */}
          {selected && (
            <Card className={`border-border/50 ${PHASE_COLORS[selected.phase].bg} bg-card/70`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-background/50 border border-border/30">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`font-display font-bold ${PHASE_COLORS[selected.phase].text}`}>{selected.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{selected.phase} · {selected.storyPoints} SP · {selected.durationWeeks} weeks</p>
                      </div>
                      {selected.milestone && (
                        <div className="flex items-center gap-1 border border-border/50 rounded px-2 py-1 ml-auto">
                          <Milestone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-mono">{selected.milestone}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-mono text-muted-foreground mb-2">DELIVERABLES</p>
                        <div className="space-y-1">
                          {selected.deliverables.map(d => (
                            <div key={d} className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-mono text-muted-foreground mb-2">AGENTS ASSIGNED</p>
                        <div className="space-y-1">
                          {selected.agentIds.map(id => {
                            const a = AGENTS.find(ag => ag.id === id);
                            return a ? (
                              <div key={id} className="flex items-center gap-2 text-xs">
                                <div className="p-0.5 rounded bg-muted"><a.icon className="w-3 h-3 text-muted-foreground" /></div>
                                <span className="font-mono">{a.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Milestones timeline */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm flex items-center gap-2">
                <Flag className="w-4 h-4 text-primary" />MILESTONES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {phases.filter(p => p.milestone).map((p, i, arr) => {
                  const colors = PHASE_COLORS[p.phase];
                  return (
                    <div key={p.id} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[100px] text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${p.status === "DONE" ? "border-emerald-500 bg-emerald-500/20" : p.status === "IN_PROGRESS" ? "border-primary bg-primary/20" : "border-border bg-muted/20"}`}
                          style={{ borderColor: p.status === "DONE" ? undefined : colors.bar }}>
                          {p.status === "DONE" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <p className="text-[9px] font-mono font-bold mt-1" style={{ color: colors.bar }}>{p.milestone}</p>
                        <p className="text-[8px] text-muted-foreground">W{p.startWeek + p.durationWeeks}</p>
                      </div>
                      {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-border/40 min-w-[40px]" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STORY POINTS ─────────────────────────────────────── */}
        <TabsContent value="storypoints" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm">SP PER PHASE</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={spBarData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2730" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#5A6470", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "#BDB7C3", fontSize: 10, fontFamily: "monospace" }} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: "#0A121A", border: "1px solid #1E2730", fontFamily: "monospace", fontSize: 11 }} formatter={(v) => [`${v} SP`, "Story Points"]} />
                    <Bar dataKey="points" radius={[0, 3, 3, 0]}>
                      {spBarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {phases.map(p => {
                const colors = PHASE_COLORS[p.phase];
                const pct = Math.round((p.storyPoints / totalSP) * 100);
                return (
                  <Card key={p.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedPhase(p.id === selectedPhase ? null : p.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bar }} />
                          <span className="text-xs font-mono font-bold">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`font-mono text-[8px] py-0 ${STATUS_BADGE[p.status]}`}>{p.status}</Badge>
                          <span className={`text-xs font-mono font-bold ${colors.text}`}>{p.storyPoints} SP</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors.bar }} />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.deliverables.map(d => (
                          <span key={d} className="text-[8px] font-mono bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">{d}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── PRODUCT OWNER AI ─────────────────────────────────── */}
        <TabsContent value="po" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="font-mono text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    PRODUCT OWNER — AI COUNSEL
                  </CardTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-mono text-[9px]">ONLINE</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-72 pr-2">
                    {poHistory.length === 0 && !poLoading && (
                      <div className="space-y-2">
                        {["Prioritize our backlog for maximum value", "What should we cut from the MVP?", "How should we sequence the roadmap?", "What are the highest-risk deliverables?"].map(q => (
                          <button key={q} onClick={() => askPO(q)} className="w-full text-left text-[11px] font-mono text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 rounded px-3 py-2 transition-colors">
                            <ChevronRight className="w-3 h-3 inline mr-1" />{q}
                          </button>
                        ))}
                      </div>
                    )}
                    {poHistory.map((msg, i) => (
                      <div key={i} className={`mb-3 ${msg.role === "user" ? "pl-2 border-l-2 border-primary/40" : "pl-2 border-l-2 border-violet-500/40"}`}>
                        <p className={`text-[9px] font-mono mb-1 ${msg.role === "user" ? "text-primary" : "text-violet-400"}`}>
                          {msg.role === "user" ? "YOU" : "PRODUCT_OWNER"}
                        </p>
                        <div className="prose prose-invert prose-xs max-w-none text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {(poLoading || poOutput) && (
                      <div className="pl-2 border-l-2 border-violet-500/40 mb-3">
                        <p className="text-[9px] font-mono text-violet-400 mb-1">PRODUCT_OWNER</p>
                        {poOutput
                          ? <div className="prose prose-invert prose-xs max-w-none text-xs"><ReactMarkdown remarkPlugins={[remarkGfm]}>{poOutput}</ReactMarkdown></div>
                          : <div className="flex gap-1 items-center"><Loader2 className="w-3 h-3 animate-spin text-violet-400" /><span className="text-[10px] font-mono text-muted-foreground">analyzing roadmap…</span></div>
                        }
                      </div>
                    )}
                  </ScrollArea>

                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <input
                      value={poInput}
                      onChange={e => setPoInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") askPO(poInput); }}
                      placeholder="Ask the Product Owner…"
                      className="flex-1 bg-input/50 border border-border/50 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/50"
                    />
                    <Button size="sm" onClick={() => askPO(poInput)} disabled={poLoading || !poInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      {poLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    </Button>
                    {poHistory.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => { setPoHistory([]); setPoOutput(""); }}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-mono text-muted-foreground mb-3">ROADMAP HEALTH</p>
                  {[
                    { label: "Total Duration", value: `${TOTAL_WEEKS} weeks` },
                    { label: "Total SP", value: `${totalSP} points` },
                    { label: "Phases Done", value: `${phases.filter(p => p.status === "DONE").length}/${phases.length}` },
                    { label: "SP Done", value: `${doneSP} / ${totalSP}` },
                    { label: "Progress", value: `${Math.round((doneSP / totalSP) * 100)}%` },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between py-1.5 border-b border-border/30">
                      <span className="text-[10px] font-mono text-muted-foreground">{r.label}</span>
                      <span className="text-[10px] font-mono font-bold text-foreground">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-mono text-muted-foreground mb-3">FIBONACCI SCALE</p>
                  {[1, 2, 3, 5, 8, 13, 21, 34].map(sp => {
                    const count = phases.filter(p => p.storyPoints === sp).length + (sp === 5 ? 2 : sp === 8 ? 1 : 0);
                    return (
                      <div key={sp} className="flex items-center gap-2 py-0.5">
                        <span className="text-[10px] font-mono text-primary w-4 text-right">{sp}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: count }, (_, i) => (
                            <div key={i} className="w-2 h-2 rounded-sm bg-primary/30" />
                          ))}
                        </div>
                        {count === 0 && <span className="text-[9px] text-muted-foreground/40">—</span>}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
