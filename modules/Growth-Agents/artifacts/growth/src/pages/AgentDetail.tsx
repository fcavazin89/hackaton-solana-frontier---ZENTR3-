import { useGetAgent, useListTasks, useListInsights, getGetAgentQueryKey, useUpdateAgent } from "@workspace/api-client-react";
import { Bot, ArrowLeft, CheckSquare, Lightbulb } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusDot: Record<string, string> = {
  active: "bg-emerald-400",
  idle: "bg-amber-400",
  paused: "bg-muted-foreground",
};

const agentTypeColors: Record<string, string> = {
  community: "text-cyan-400",
  tokenomics: "text-violet-400",
  marketing: "text-pink-400",
  traction: "text-emerald-400",
  analytics: "text-amber-400",
  partnership: "text-blue-400",
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

export default function AgentDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const agent = useGetAgent(id, { query: { enabled: !!id, queryKey: getGetAgentQueryKey(id) } });
  const tasks = useListTasks({ agentId: id });
  const insights = useListInsights({ agentId: id });
  const updateAgent = useUpdateAgent();
  const qc = useQueryClient();
  const { toast } = useToast();

  const toggleStatus = () => {
    if (!agent.data) return;
    const next = agent.data.status === "active" ? "paused" : "active";
    updateAgent.mutate(
      { id, data: { status: next } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetAgentQueryKey(id) });
          toast({ title: `Agent ${next}` });
        },
      }
    );
  };

  if (agent.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!agent.data) {
    return <div className="p-6 text-muted-foreground">Agent not found</div>;
  }

  const a = agent.data;

  return (
    <div className="p-6 space-y-6">
      <Link href="/agents" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to agents
      </Link>

      <div className="bg-card border border-card-border rounded p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-muted rounded">
              <Bot className={`w-5 h-5 ${agentTypeColors[a.type] ?? "text-foreground"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusDot[a.status] ?? "bg-muted"}`} />
                <h1 className="text-lg font-mono font-semibold">{a.name}</h1>
              </div>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{a.type} agent — {a.status}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={a.status === "active" ? "outline" : "default"}
            onClick={toggleStatus}
            disabled={updateAgent.isPending}
            data-testid="button-toggle-status"
          >
            {a.status === "active" ? "Pause" : "Activate"}
          </Button>
        </div>
        {a.description && <p className="text-sm text-muted-foreground mt-4">{a.description}</p>}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border text-sm font-mono">
          <div><span className="text-emerald-400 text-lg font-bold">{a.tasksCompleted}</span><span className="text-muted-foreground text-xs ml-1">tasks done</span></div>
          <div><span className="text-primary text-lg font-bold">{a.insightsGenerated}</span><span className="text-muted-foreground text-xs ml-1">insights</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-card border border-card-border rounded">
          <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Tasks ({tasks.data?.length ?? 0})</h2>
          </div>
          <div className="divide-y divide-border">
            {tasks.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 px-4 py-3 animate-pulse bg-muted/50" />)
              : tasks.data?.length === 0
              ? <div className="px-4 py-6 text-center text-xs text-muted-foreground">No tasks assigned</div>
              : tasks.data?.map((task) => (
                  <div key={task.id} className="px-4 py-3" data-testid={`task-${task.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{task.title}</p>
                      <span className={`text-xs font-mono flex-shrink-0 capitalize ${priorityColors[task.priority] ?? ""}`}>{task.priority}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 capitalize">{task.status.replace("_", " ")} · {task.category}</div>
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
          <div className="divide-y divide-border">
            {insights.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 px-4 py-3 animate-pulse bg-muted/50" />)
              : insights.data?.length === 0
              ? <div className="px-4 py-6 text-center text-xs text-muted-foreground">No insights generated</div>
              : insights.data?.map((insight) => (
                  <div key={insight.id} className="px-4 py-3" data-testid={`insight-${insight.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{insight.title}</p>
                      <span className={`text-xs font-mono flex-shrink-0 capitalize ${impactColors[insight.impact] ?? ""}`}>{insight.impact}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.content}</p>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
