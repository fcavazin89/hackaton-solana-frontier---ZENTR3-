import { useGetProject, useListAgents, useListTasks, useListInsights, getGetProjectQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Bot, CheckSquare, Lightbulb, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const stageColors: Record<string, string> = {
  idea: "text-muted-foreground border-muted-foreground/30",
  mvp: "text-cyan-400 border-cyan-400/30",
  launch: "text-violet-400 border-violet-400/30",
  growth: "text-emerald-400 border-emerald-400/30",
  scale: "text-amber-400 border-amber-400/30",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-cyan-400",
  high: "text-amber-400",
  critical: "text-red-400",
};

const impactColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-400",
  high: "text-emerald-400",
};

const agentTypeColors: Record<string, string> = {
  community: "text-cyan-400",
  tokenomics: "text-violet-400",
  marketing: "text-pink-400",
  traction: "text-emerald-400",
  analytics: "text-amber-400",
  partnership: "text-blue-400",
};

const statusDot: Record<string, string> = {
  active: "bg-emerald-400",
  idle: "bg-amber-400",
  paused: "bg-muted-foreground",
};

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const project = useGetProject(id, { query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) } });
  const allAgents = useListAgents();
  const tasks = useListTasks({ projectId: id });
  const insights = useListInsights({ projectId: id });

  const projectAgents = allAgents.data?.filter((a) => a.projectId === id);

  if (project.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!project.data) {
    return <div className="p-6 text-muted-foreground">Project not found</div>;
  }

  const p = project.data;

  return (
    <div className="p-6 space-y-6">
      <Link href="/projects" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to projects
      </Link>

      <div className="bg-card border border-card-border rounded p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold">{p.name}</h1>
              <span className={`text-xs font-mono capitalize px-1.5 py-0.5 rounded border ${stageColors[p.stage] ?? ""}`}>{p.stage}</span>
              <span className="text-xs font-mono text-muted-foreground">{p.chain}</span>
            </div>
            {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
            {p.twitterHandle && <span className="font-mono">{p.twitterHandle}</span>}
            {p.websiteUrl && (
              <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border text-sm font-mono">
          <div><span className="text-violet-400 text-lg font-bold">{projectAgents?.length ?? 0}</span><span className="text-muted-foreground text-xs ml-1">agents</span></div>
          <div><span className="text-cyan-400 text-lg font-bold">{tasks.data?.length ?? 0}</span><span className="text-muted-foreground text-xs ml-1">tasks</span></div>
          <div><span className="text-emerald-400 text-lg font-bold">{insights.data?.length ?? 0}</span><span className="text-muted-foreground text-xs ml-1">insights</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents */}
        <div className="bg-card border border-card-border rounded">
          <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Agents</h2>
          </div>
          <div className="divide-y divide-border">
            {projectAgents?.length === 0
              ? <div className="px-4 py-6 text-center text-xs text-muted-foreground">No agents assigned</div>
              : projectAgents?.map((agent) => (
                  <Link key={agent.id} href={`/agents/${agent.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors" data-testid={`agent-${agent.id}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[agent.status] ?? ""}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono">{agent.name}</div>
                      <div className={`text-xs capitalize ${agentTypeColors[agent.type] ?? ""}`}>{agent.type}</div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-card border border-card-border rounded">
          <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Tasks ({tasks.data?.length ?? 0})</h2>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-auto">
            {tasks.isLoading
              ? <div className="h-16 animate-pulse bg-muted" />
              : tasks.data?.length === 0
              ? <div className="px-4 py-6 text-center text-xs text-muted-foreground">No tasks</div>
              : tasks.data?.map((task) => (
                  <div key={task.id} className="px-4 py-3" data-testid={`task-${task.id}`}>
                    <p className="text-sm">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-muted-foreground">
                      <span className="capitalize">{task.status.replace("_", " ")}</span>
                      <span className={`capitalize ${priorityColors[task.priority] ?? ""}`}>{task.priority}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-card border border-card-border rounded">
          <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Insights ({insights.data?.length ?? 0})</h2>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-auto">
            {insights.isLoading
              ? <div className="h-16 animate-pulse bg-muted" />
              : insights.data?.length === 0
              ? <div className="px-4 py-6 text-center text-xs text-muted-foreground">No insights</div>
              : insights.data?.map((insight) => (
                  <div key={insight.id} className="px-4 py-3" data-testid={`insight-${insight.id}`}>
                    <p className="text-sm">{insight.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                      <span className={`capitalize ${impactColors[insight.impact] ?? ""}`}>{insight.impact} impact</span>
                      <span className="text-muted-foreground capitalize">{insight.category}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
