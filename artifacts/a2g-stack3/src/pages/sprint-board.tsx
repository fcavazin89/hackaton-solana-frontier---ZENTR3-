import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import {
  Flame, Zap, ChevronRight, CheckCircle2, Clock, Activity,
  AlertCircle, Bot, Loader2, TrendingDown, Users, Target,
  MessageSquare, RefreshCw,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { useProject, Sprint, createSprintsFromPlan, createRoadmapFromPlan } from "@/context/project-context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TYPE_COLORS: Record<string, string> = {
  EPIC:  "bg-violet-500/20 text-violet-400 border-violet-500/50",
  STORY: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  BUG:   "bg-rose-500/20 text-rose-400 border-rose-500/50",
  SPIKE: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  TASK:  "bg-slate-500/20 text-slate-400 border-slate-500/50",
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-rose-400", MEDIUM: "bg-amber-400", LOW: "bg-emerald-400",
};

function generateBurndown(totalPoints: number, completedPoints: number, days = 14) {
  const ideal: number[] = Array.from({ length: days + 1 }, (_, i) =>
    Math.round(totalPoints - (totalPoints / days) * i)
  );
  const actual: number[] = [totalPoints];
  let rem = totalPoints;
  const halfDays = Math.ceil(days / 2);
  for (let i = 1; i <= halfDays; i++) {
    const burnRate = (completedPoints / halfDays) * (0.8 + Math.random() * 0.4);
    rem = Math.max(0, rem - burnRate);
    actual.push(Math.round(rem));
  }
  return Array.from({ length: days + 1 }, (_, i) => ({
    day: `D${i}`,
    ideal: ideal[i],
    actual: i < actual.length ? actual[i] : undefined,
  }));
}

function generateVelocity(sprints: Sprint[]) {
  return sprints.map(s => ({
    name: `S${s.id}`,
    planned: s.capacity,
    completed: s.status === "COMPLETED" ? Math.round(s.capacity * 0.85) :
               s.status === "ACTIVE"    ? Math.round(s.capacity * 0.45) : 0,
  }));
}

const SCRUM_SYSTEM = `You are a Web3 Scrum Master. You facilitate agile ceremonies, remove blockers, and keep the team on track. 
Speak concisely, use sprint terminology. Focus on: sprint health, blockers, velocity, team dynamics, and Web3-specific challenges.
Format your response with clear sections using ** bold headers **.`;

export default function SprintBoard() {
  const {
    tasks: contextTasks, businessPlan, sprints: contextSprints,
    setSprints, setRoadmapPhases,
  } = useProject();

  const [activeSprint, setActiveSprint] = useState(1);
  const [smOutput, setSmOutput] = useState("");
  const [smLoading, setSmLoading] = useState(false);
  const [smInput, setSmInput] = useState("");
  const [smHistory, setSmHistory] = useState<Array<{ role: string; content: string }>>([]);

  const sprints = contextSprints.length > 0
    ? contextSprints
    : businessPlan ? createSprintsFromPlan(businessPlan) : [
        { id: 1, name: "Sprint 1 — Foundation", goal: "Bootstrap core architecture and research", startDate: "2025-01-01", endDate: "2025-01-14", capacity: 26, status: "ACTIVE" as const },
        { id: 2, name: "Sprint 2 — Build", goal: "Contract deployment and compliance", startDate: "2025-01-15", endDate: "2025-01-28", capacity: 31, status: "PLANNING" as const },
        { id: 3, name: "Sprint 3 — Validate", goal: "Audit, stress test, community", startDate: "2025-01-29", endDate: "2025-02-11", capacity: 32, status: "PLANNING" as const },
      ];

  const mockTasks = [
    { id: "m1", title: "Smart Contract Core", description: "ERC-20 + governance contracts", status: "IN_PROGRESS" as const, priority: "HIGH" as const, progress: 60, assignedTo: "6", storyPoints: 13, sprint: 1, type: "EPIC" as const },
    { id: "m2", title: "Market Research Report", description: "DeFi competitor analysis", status: "COMPLETED" as const, priority: "HIGH" as const, progress: 100, assignedTo: "1", storyPoints: 5, sprint: 1, type: "STORY" as const },
    { id: "m3", title: "Tokenomics v1 Doc", description: "Vesting + emission model", status: "IN_PROGRESS" as const, priority: "HIGH" as const, progress: 70, assignedTo: "2", storyPoints: 8, sprint: 1, type: "STORY" as const },
    { id: "m4", title: "Legal Jurisdictions Memo", description: "EU, US, SG regulatory map", status: "PENDING" as const, priority: "HIGH" as const, progress: 0, assignedTo: "3", storyPoints: 8, sprint: 2, type: "STORY" as const },
    { id: "m5", title: "GTM 90-day Plan", description: "Multi-channel strategy", status: "PENDING" as const, priority: "MEDIUM" as const, progress: 0, assignedTo: "5", storyPoints: 5, sprint: 2, type: "STORY" as const },
  ];

  const allTasks = contextTasks.length > 0 ? contextTasks : mockTasks;
  const sprintTasks = allTasks.filter(t => (t.sprint ?? 1) === activeSprint);
  const sprint = sprints.find(s => s.id === activeSprint) || sprints[0];

  const sprintSP = sprintTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
  const doneSP   = sprintTasks.filter(t => t.status === "COMPLETED").reduce((s, t) => s + (t.storyPoints || 0), 0);
  const inProgSP = sprintTasks.filter(t => t.status === "IN_PROGRESS").reduce((s, t) => s + (t.storyPoints || 0), 0);

  const burndownData = generateBurndown(sprint?.capacity || 26, doneSP);
  const velocityData = generateVelocity(sprints);

  const askScrum = useCallback(async (msg: string) => {
    if (!msg.trim() || smLoading) return;
    setSmLoading(true);
    const userMsg = { role: "user", content: msg };
    const newHistory = [...smHistory, userMsg];
    setSmHistory(newHistory);
    setSmInput("");
    setSmOutput("");

    const context = businessPlan
      ? `Project: ${businessPlan.projectName}. Sprint: ${sprint?.name}. Sprint goal: ${sprint?.goal}. Story points: ${doneSP}/${sprintSP} done. Tasks in progress: ${sprintTasks.filter(t => t.status === "IN_PROGRESS").map(t => t.title).join(", ")}.`
      : "No project loaded yet.";

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "11",
          agentRole: "SCRUM",
          systemPrompt: SCRUM_SYSTEM,
          message: `${context}\n\n${msg}`,
          history: smHistory,
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
            try { const d = JSON.parse(line.slice(6)); if (d.content) { full += d.content; setSmOutput(full); } } catch {}
          }
        }
      }
      setSmHistory(prev => [...prev, { role: "model", content: full || "Sprint analysis complete." }]);
      setSmOutput("");
    } catch { setSmOutput(""); }
    finally { setSmLoading(false); }
  }, [smHistory, smLoading, businessPlan, sprint, doneSP, sprintSP, sprintTasks]);

  const initSprints = useCallback(() => {
    if (!businessPlan) return;
    setSprints(createSprintsFromPlan(businessPlan));
    setRoadmapPhases(createRoadmapFromPlan(businessPlan));
  }, [businessPlan, setSprints, setRoadmapPhases]);

  const STATUS_COLS = [
    { id: "PENDING",     label: "BACKLOG",      color: "text-muted-foreground", bg: "bg-muted/20" },
    { id: "IN_PROGRESS", label: "IN_PROGRESS",  color: "text-primary",          bg: "bg-primary/5" },
    { id: "COMPLETED",   label: "DONE",         color: "text-emerald-400",      bg: "bg-emerald-500/5" },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            SPRINT BOARD
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            {businessPlan ? `${businessPlan.projectName} · Agile Web3 Execution Layer` : "Agile Web3 Execution Layer"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {contextSprints.length === 0 && businessPlan && (
            <Button size="sm" variant="outline" className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10" onClick={initSprints}>
              <Zap className="w-3 h-3 mr-1" />GENERATE SPRINTS
            </Button>
          )}
          <div className="flex gap-1 border border-border/50 rounded-md p-1">
            {sprints.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSprint(s.id)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${activeSprint === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                S{s.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sprint Goal Banner */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <Target className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-muted-foreground mb-0.5">SPRINT GOAL — {sprint?.name}</p>
          <p className="text-sm font-medium text-foreground truncate">{sprint?.goal}</p>
        </div>
        <div className="flex gap-4 text-center shrink-0">
          <div><p className="text-lg font-display font-bold text-primary">{doneSP}</p><p className="text-[10px] font-mono text-muted-foreground">DONE SP</p></div>
          <div><p className="text-lg font-display font-bold text-amber-400">{inProgSP}</p><p className="text-[10px] font-mono text-muted-foreground">IN_PROG</p></div>
          <div><p className="text-lg font-display font-bold text-muted-foreground">{sprintSP}</p><p className="text-[10px] font-mono text-muted-foreground">TOTAL SP</p></div>
          <div><p className="text-lg font-display font-bold text-emerald-400">{sprintSP > 0 ? Math.round((doneSP / sprintSP) * 100) : 0}%</p><p className="text-[10px] font-mono text-muted-foreground">COMPLETE</p></div>
        </div>
      </div>

      <Tabs defaultValue="board">
        <TabsList className="font-mono text-xs bg-muted/30 border border-border/50">
          <TabsTrigger value="board">KANBAN BOARD</TabsTrigger>
          <TabsTrigger value="burndown">BURNDOWN</TabsTrigger>
          <TabsTrigger value="velocity">VELOCITY</TabsTrigger>
          <TabsTrigger value="scrum">SCRUM MASTER AI</TabsTrigger>
        </TabsList>

        {/* ── KANBAN ────────────────────────────────────────────── */}
        <TabsContent value="board" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUS_COLS.map(col => {
              const colTasks = sprintTasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className={`flex flex-col rounded-lg border border-border/50 p-3 ${col.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-mono text-xs font-bold ${col.color}`}>{col.label}</span>
                    <Badge variant="outline" className="font-mono text-[9px]">
                      {colTasks.reduce((s, t) => s + (t.storyPoints || 0), 0)} SP
                    </Badge>
                  </div>
                  <div className="space-y-2 flex-1">
                    {colTasks.map(task => {
                      const agent = AGENTS.find(a => a.id === task.assignedTo);
                      return (
                        <Card key={task.id} className="bg-card border-border/50 hover:border-primary/40 transition-colors">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${TYPE_COLORS[task.type || "TASK"]}`}>{task.type || "TASK"}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                                <span className="text-[10px] font-mono font-bold text-primary">{task.storyPoints || 1} SP</span>
                              </div>
                            </div>
                            <p className="text-xs font-medium leading-tight">{task.title}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>
                            {task.status === "IN_PROGRESS" && (
                              <Progress value={task.progress} className="h-1" />
                            )}
                            {agent && (
                              <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                                <div className="p-0.5 rounded bg-muted"><agent.icon className="w-3 h-3 text-muted-foreground" /></div>
                                <span className="text-[10px] font-mono text-muted-foreground truncate">{agent.name}</span>
                              </div>
                            )}
                            {task.acceptanceCriteria && (
                              <p className="text-[10px] text-muted-foreground/70 italic border-t border-border/30 pt-1">AC: {task.acceptanceCriteria}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="h-20 flex items-center justify-center border-2 border-dashed border-border/40 rounded-lg">
                        <span className="text-[10px] font-mono text-muted-foreground/40">EMPTY</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── BURNDOWN ──────────────────────────────────────────── */}
        <TabsContent value="burndown" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  BURNDOWN CHART — {sprint?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={burndownData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#5A6470" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5A6470" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00D1FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D1FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2730" />
                    <XAxis dataKey="day" tick={{ fill: "#5A6470", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis tick={{ fill: "#5A6470", fontSize: 10, fontFamily: "monospace" }} label={{ value: "SP", angle: -90, position: "insideLeft", fill: "#5A6470", fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0A121A", border: "1px solid #1E2730", fontFamily: "monospace", fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 10 }} />
                    <Area type="monotone" dataKey="ideal" name="Ideal" stroke="#5A6470" fill="url(#idealGrad)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="actual" name="Actual" stroke="#00D1FF" fill="url(#actualGrad)" strokeWidth={2} dot={{ r: 3, fill: "#00D1FF" }} connectNulls={false} />
                    <ReferenceLine y={0} stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-mono text-muted-foreground">SPRINT HEALTH</p>
                  {[
                    { label: "Capacity", value: `${sprint?.capacity || 0} SP`, color: "text-foreground" },
                    { label: "Completed", value: `${doneSP} SP`, color: "text-emerald-400" },
                    { label: "In Progress", value: `${inProgSP} SP`, color: "text-amber-400" },
                    { label: "Remaining", value: `${Math.max(0, (sprint?.capacity || 0) - doneSP - inProgSP)} SP`, color: "text-rose-400" },
                    { label: "Velocity", value: `${sprintSP > 0 ? Math.round((doneSP / sprintSP) * 100) : 0}%`, color: "text-primary" },
                  ].map(stat => (
                    <div key={stat.label} className="flex justify-between items-center py-1 border-b border-border/30">
                      <span className="text-[11px] font-mono text-muted-foreground">{stat.label}</span>
                      <span className={`text-[11px] font-mono font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-mono text-muted-foreground mb-3">STORIES BY TYPE</p>
                  {["EPIC","STORY","SPIKE","TASK","BUG"].map(type => {
                    const count = sprintTasks.filter(t => (t.type || "TASK") === type).length;
                    const sp = sprintTasks.filter(t => (t.type || "TASK") === type).reduce((s, t) => s + (t.storyPoints || 0), 0);
                    if (count === 0) return null;
                    return (
                      <div key={type} className="flex items-center justify-between py-1.5">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${TYPE_COLORS[type]}`}>{type}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{count}× · {sp} SP</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── VELOCITY ──────────────────────────────────────────── */}
        <TabsContent value="velocity" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  VELOCITY CHART — SPRINTS OVERVIEW
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={velocityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2730" />
                    <XAxis dataKey="name" tick={{ fill: "#5A6470", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis tick={{ fill: "#5A6470", fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0A121A", border: "1px solid #1E2730", fontFamily: "monospace", fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 10 }} />
                    <Bar dataKey="planned"   name="Planned SP"   fill="#1E2730" radius={[2,2,0,0]} />
                    <Bar dataKey="completed" name="Completed SP" fill="#00D1FF" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground">SPRINT COMPARISON</p>
              {sprints.map(s => {
                const completed = s.status === "COMPLETED" ? Math.round(s.capacity * 0.85) :
                                  s.status === "ACTIVE"    ? Math.round(s.capacity * 0.45) : 0;
                const pct = Math.round((completed / s.capacity) * 100);
                return (
                  <Card key={s.id} className={`bg-card/50 border-border/50 ${s.id === activeSprint ? "border-primary/40" : ""}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono font-bold truncate">{s.name}</span>
                        <Badge variant="outline" className={`font-mono text-[9px] ${s.status === "ACTIVE" ? "border-emerald-500/50 text-emerald-400" : s.status === "COMPLETED" ? "border-primary/50 text-primary" : "text-muted-foreground"}`}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                          <span>{completed} / {s.capacity} SP</span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 mt-2 line-clamp-1">{s.goal}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── SCRUM MASTER AI ───────────────────────────────────── */}
        <TabsContent value="scrum" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="font-mono text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    SCRUM MASTER — AI FACILITATION
                  </CardTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-mono text-[9px]">ONLINE</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-64 pr-2">
                    {smHistory.length === 0 && !smLoading && (
                      <div className="space-y-2">
                        {["Analyze this sprint's health and risk", "What's blocking the team?", "Suggest sprint retrospective points", "How is our velocity trending?"].map(q => (
                          <button key={q} onClick={() => askScrum(q)} className="w-full text-left text-[11px] font-mono text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 rounded px-3 py-2 transition-colors">
                            <ChevronRight className="w-3 h-3 inline mr-1" />{q}
                          </button>
                        ))}
                      </div>
                    )}
                    {smHistory.map((msg, i) => (
                      <div key={i} className={`mb-3 ${msg.role === "user" ? "pl-2 border-l-2 border-primary/40" : "pl-2 border-l-2 border-emerald-500/40"}`}>
                        <p className={`text-[9px] font-mono mb-1 ${msg.role === "user" ? "text-primary" : "text-emerald-400"}`}>
                          {msg.role === "user" ? "YOU" : "SCRUM_MASTER"}
                        </p>
                        <div className="prose prose-invert prose-xs max-w-none text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {(smLoading || smOutput) && (
                      <div className="pl-2 border-l-2 border-emerald-500/40 mb-3">
                        <p className="text-[9px] font-mono text-emerald-400 mb-1">SCRUM_MASTER</p>
                        {smOutput
                          ? <div className="prose prose-invert prose-xs max-w-none text-xs"><ReactMarkdown remarkPlugins={[remarkGfm]}>{smOutput}</ReactMarkdown></div>
                          : <div className="flex gap-1 items-center"><Loader2 className="w-3 h-3 animate-spin text-emerald-400" /><span className="text-[10px] font-mono text-muted-foreground">analyzing sprint…</span></div>
                        }
                      </div>
                    )}
                  </ScrollArea>

                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <input
                      value={smInput}
                      onChange={e => setSmInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") askScrum(smInput); }}
                      placeholder="Ask the Scrum Master…"
                      className="flex-1 bg-input/50 border border-border/50 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/50"
                    />
                    <Button size="sm" onClick={() => askScrum(smInput)} disabled={smLoading || !smInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      {smLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    </Button>
                    {smHistory.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => { setSmHistory([]); setSmOutput(""); }}>
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
                  <p className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2"><Users className="w-3 h-3" />TEAM ASSIGNMENTS</p>
                  <div className="space-y-2">
                    {sprintTasks.filter(t => t.status !== "COMPLETED").slice(0, 6).map(t => {
                      const a = AGENTS.find(ag => ag.id === t.assignedTo);
                      return a ? (
                        <div key={t.id} className="flex items-center gap-2 py-1 border-b border-border/30">
                          <div className="p-1 rounded bg-muted shrink-0"><a.icon className="w-3 h-3 text-muted-foreground" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-foreground truncate">{t.title}</p>
                            <p className="text-[9px] text-muted-foreground">{a.name}</p>
                          </div>
                          <span className="text-[9px] font-mono text-primary shrink-0">{t.storyPoints}SP</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2"><AlertCircle className="w-3 h-3 text-amber-400" />SPRINT RISKS</p>
                  <div className="space-y-2">
                    {[
                      { label: "Scope creep", level: "MEDIUM", color: "text-amber-400" },
                      { label: "Audit dependency", level: "HIGH", color: "text-rose-400" },
                      { label: "Gas cost spikes", level: "LOW", color: "text-emerald-400" },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center py-1 border-b border-border/30">
                        <span className="text-[10px] font-mono">{r.label}</span>
                        <span className={`text-[9px] font-mono font-bold ${r.color}`}>{r.level}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
