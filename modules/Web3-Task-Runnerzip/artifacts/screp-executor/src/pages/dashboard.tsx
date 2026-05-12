import { useGetDashboardSummary, useGetRecentActivity, useGetAgentConfig } from "@workspace/api-client-react";
import { Activity, CheckCircle2, TerminalSquare, Rocket, Network, ShieldAlert, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Scr3pTerminal } from "@/components/scr3p-terminal";
import mascotSrc from "@assets/ChatGPT_Image_25_de_abr._de_2026,_04_03_08_1777807724911.png";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({ query: { refetchInterval: 3000 } });
  const { data: activity, isLoading: isActivityLoading } = useGetRecentActivity({ query: { refetchInterval: 3000 } });
  const { data: config } = useGetAgentConfig();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase border-b border-primary/30 pb-2 inline-block">Mission Control</h1>
              <p className="text-muted-foreground mt-2 font-mono text-sm">Real-time telemetry — execute the future</p>
            </div>
            {config && (
              <div className="flex items-center gap-2 bg-card border border-border p-2 rounded-sm px-4">
                <Bot className={`h-4 w-4 ${config.isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs uppercase font-mono text-muted-foreground mr-2">Mode:</span>
                <Badge variant="outline" className={`font-mono text-[10px] uppercase bg-background rounded-sm ${config.autonomyLevel === "full_auto" ? "text-destructive border-destructive/50" : config.autonomyLevel === "semi_auto" ? "text-primary border-primary/50" : config.autonomyLevel === "supervised" ? "text-blue-500 border-blue-500/50" : "text-muted-foreground border-border"}`}>{config.autonomyLevel.replace(/_/g, " ")}</Badge>
              </div>
            )}
          </div>

          {isSummaryLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => <Card key={i} className="bg-card border-border animate-pulse h-28" />)}
            </div>
          ) : summary ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Active Tasks" value={summary.runningTasks} sub={<><span className="text-primary font-mono">{summary.totalTasks}</span> total registered</>} icon={<TerminalSquare className="h-4 w-4 text-primary" />} glow="primary" />
              <StatCard label="Awaiting Approval" value={summary.awaitingApprovalTasks} sub="manual intervention required" icon={<ShieldAlert className={`h-4 w-4 ${summary.awaitingApprovalTasks > 0 ? "text-yellow-400 animate-pulse" : "text-yellow-500/40"}`} />} glow={summary.awaitingApprovalTasks > 0 ? "yellow" : "none"} valueColor={summary.awaitingApprovalTasks > 0 ? "text-yellow-400" : undefined} labelColor={summary.awaitingApprovalTasks > 0 ? "text-yellow-400 font-bold" : undefined} />
              <StatCard label="Done / Failed" value={<><span className="text-green-400">{summary.doneTasks}</span><span className="text-muted-foreground mx-1 text-xl">/</span><span className="text-destructive text-xl">{summary.failedTasks}</span></>} sub="task completion metrics" icon={<CheckCircle2 className="h-4 w-4 text-green-400" />} glow="green" />
              <StatCard label="Deployments" value={summary.successDeployments} sub={<><span className="text-blue-400 font-mono">{summary.totalDeployments}</span> total attempts</>} icon={<Rocket className="h-4 w-4 text-blue-400" />} glow="blue" valueColor="text-blue-400" />
              <StatCard label="Integrations" value={summary.activeIntegrations} sub={<><span className="text-purple-400 font-mono">{summary.totalIntegrations}</span> total configured</>} icon={<Network className="h-4 w-4 text-purple-400" />} glow="purple" valueColor="text-purple-400" />
            </div>
          ) : null}
        </div>

        <Card className="bg-card border-border overflow-hidden relative min-h-[320px] group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,106,0,0.18),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(120,0,247,0.12),transparent_45%)] opacity-80 pointer-events-none" />
          <div className="absolute inset-0 animate-pulse opacity-20 bg-[linear-gradient(120deg,transparent,rgba(255,203,87,0.22),transparent)] [background-size:200%_100%] mascot-sweep pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle className="uppercase tracking-widest text-xs flex items-center gap-2"><TerminalSquare className="h-3.5 w-3.5 text-primary" />SCR3P MASCOT</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 h-[260px] flex items-center justify-center p-0 bg-black overflow-hidden">
            <img src={mascotSrc} alt="SCR3P mascot" className="w-full h-full object-contain mascot-float mascot-glow" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7 h-[420px]">
        <Card className="lg:col-span-4 bg-card border-border relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          <CardHeader className="shrink-0 pb-3"><CardTitle className="uppercase tracking-widest text-xs flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-primary" />Telemetry Feed</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isActivityLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="flex gap-3 items-start"><div className="h-1.5 w-1.5 mt-2 rounded-full bg-muted animate-pulse shrink-0" /><div className="space-y-1.5 flex-1"><div className="h-3 bg-muted animate-pulse rounded w-3/4" /><div className="h-2.5 bg-muted animate-pulse rounded w-1/4" /></div></div>)}</div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">{activity.map((item, i) => <div key={item.id} className="relative flex gap-3 items-start group">{i !== activity.length - 1 && <div className="absolute left-[3px] top-4 bottom-[-16px] w-px bg-border group-hover:bg-primary/20 transition-colors" />}<div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 z-10 ${item.type.includes("failed") || item.type.includes("error") ? "bg-destructive shadow-[0_0_4px_rgba(220,38,38,0.6)]" : item.type.includes("success") || item.type.includes("done") || item.type.includes("completed") ? "bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" : item.type.includes("executed") || item.type.includes("started") || item.type.includes("running") ? "bg-primary shadow-[0_0_4px_rgba(255,106,0,0.6)]" : "bg-muted-foreground/40"}`} /><div className="flex-1 min-w-0"><p className="text-xs font-medium text-foreground leading-snug">{item.message}</p><div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 font-mono mt-0.5"><span>{format(new Date(item.createdAt), "HH:mm:ss.SSS")}</span><span className="opacity-40">|</span><span className="uppercase text-primary/50">{item.entityType}</span></div></div></div>)}</div>
            ) : (
              <div className="py-8 text-center text-muted-foreground/40 text-xs font-mono border border-dashed border-border/50 rounded-sm bg-background/30">AWAITING_TELEMETRY</div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col">
          <Scr3pTerminal />
        </div>
      </div>
    </div>
  );
}

type GlowColor = "primary" | "yellow" | "green" | "blue" | "purple" | "none";
const GLOW_CLASSES: Record<GlowColor, string> = { primary: "border-primary/20 shadow-[0_0_12px_rgba(255,106,0,0.06)]", yellow: "border-yellow-500/40 shadow-[0_0_12px_rgba(234,179,8,0.12)]", green: "border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.06)]", blue: "border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.06)]", purple: "border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.06)]", none: "border-border" };
const GRADIENT_CLASSES: Record<GlowColor, string> = { primary: "from-primary/8", yellow: "from-yellow-500/8", green: "from-green-500/8", blue: "from-blue-500/8", purple: "from-purple-500/8", none: "from-transparent" };
function StatCard({ label, value, sub, icon, glow = "none", valueColor, labelColor }: { label: string; value: React.ReactNode; sub: React.ReactNode; icon: React.ReactNode; glow?: GlowColor; valueColor?: string; labelColor?: string; }) { return <Card className={`bg-card ${GLOW_CLASSES[glow]} relative overflow-hidden group rounded-sm`}><div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_CLASSES[glow]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} /><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4 relative z-10"><CardTitle className={`text-[10px] font-mono font-medium uppercase tracking-widest ${labelColor ?? "text-muted-foreground"}`}>{label}</CardTitle>{icon}</CardHeader><CardContent className="relative z-10 px-4 pb-4"><div className={`text-3xl font-bold ${valueColor ?? "text-foreground"}`}>{value}</div><p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{sub}</p></CardContent></Card>; }
