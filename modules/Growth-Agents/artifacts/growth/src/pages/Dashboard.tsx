import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetAgentPerformance,
} from "@workspace/api-client-react";
import { Bot, CheckSquare, Lightbulb, FolderKanban, TrendingUp, Activity } from "lucide-react";
import { Link } from "wouter";

const agentTypeColors: Record<string, string> = {
  community: "text-cyan-400",
  tokenomics: "text-violet-400",
  marketing: "text-pink-400",
  traction: "text-emerald-400",
  analytics: "text-amber-400",
  partnership: "text-blue-400",
};

const statusColors: Record<string, string> = {
  active: "text-emerald-400",
  idle: "text-amber-400",
  paused: "text-muted-foreground",
};

const activityTypeLabels: Record<string, string> = {
  task_created: "Task created",
  task_completed: "Task completed",
  insight_generated: "Insight generated",
  agent_activated: "Agent activated",
  project_created: "Project created",
};

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-card border border-card-border rounded p-4 flex items-start gap-4" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className={`mt-0.5 p-2 rounded bg-muted ${accent ?? "text-primary"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-2xl font-bold font-mono">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const summary = useGetDashboardSummary();
  const activity = useGetRecentActivity();
  const performance = useGetAgentPerformance();

  if (summary.isLoading) {
    return (
      <div className="p-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const s = summary.data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono tracking-widest">GROWTH. SCALE. IMPACT.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Activity className="w-3 h-3 text-emerald-400" />
          Live
        </div>
      </div>

      {/* Stats grid */}
      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Projects" value={s.totalProjects} icon={FolderKanban} accent="text-primary" />
          <StatCard label="Total Agents" value={s.totalAgents} icon={Bot} accent="text-primary" />
          <StatCard label="Active Agents" value={s.activeAgents} icon={TrendingUp} accent="text-emerald-400" />
          <StatCard label="Total Tasks" value={s.totalTasks} icon={CheckSquare} accent="text-primary" />
          <StatCard label="Completed Tasks" value={s.completedTasks} icon={CheckSquare} accent="text-emerald-400" />
          <StatCard label="In Progress" value={s.inProgressTasks} icon={CheckSquare} accent="text-cyan-400" />
          <StatCard label="Pending Tasks" value={s.pendingTasks} icon={CheckSquare} accent="text-amber-400" />
          <StatCard label="High Impact Insights" value={s.highImpactInsights} icon={Lightbulb} accent="text-primary" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <div className="bg-card border border-card-border rounded">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <h2 className="text-sm font-medium">Agent Performance</h2>
            <Link href="/agents" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {performance.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                  </div>
                ))
              : performance.data?.map((agent) => (
                  <div key={agent.agentId} className="px-4 py-3 flex items-center gap-3" data-testid={`perf-agent-${agent.agentId}`}>
                    <Link href={`/agents/${agent.agentId}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
                      <Bot className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-mono truncate">{agent.agentName}</span>
                      <span className={`text-xs ${agentTypeColors[agent.agentType] ?? "text-muted-foreground"} capitalize flex-shrink-0`}>
                        {agent.agentType}
                      </span>
                    </Link>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs font-mono text-muted-foreground">
                      <span className={statusColors[agent.status] ?? "text-muted-foreground"}>{agent.status}</span>
                      <span className="text-emerald-400">{agent.tasksCompleted} done</span>
                      <span className="text-amber-400">{agent.tasksPending} pending</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-card-border rounded">
          <div className="px-4 py-3 border-b border-card-border">
            <h2 className="text-sm font-medium">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-auto">
            {activity.isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="h-3 w-48 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  </div>
                ))
              : activity.data?.length === 0
              ? <div className="px-4 py-8 text-center text-sm text-muted-foreground">No recent activity</div>
              : activity.data?.map((item) => (
                  <div key={item.id} className="px-4 py-3" data-testid={`activity-${item.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">{activityTypeLabels[item.type] ?? item.type}</div>
                        <div className="text-sm truncate mt-0.5">{item.title}</div>
                        {item.agentName && (
                          <div className="text-xs text-muted-foreground mt-0.5">by {item.agentName}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
