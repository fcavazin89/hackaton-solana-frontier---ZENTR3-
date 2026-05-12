import { useState, useEffect } from "react";
import {
  useGetAgentConfig, useUpdateAgentConfig, getGetAgentConfigQueryKey,
  useGetAgentStatus, useTriggerAgent, getGetAgentStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bot, Shield, Zap, Activity, Clock, Settings2, Play, Power,
  CheckCircle2, FileCode2, Layers, Rocket, Brain, Radio,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const WORKER_META: Record<string, { icon: typeof Bot; color: string; glowColor: string }> = {
  contract_agent: { icon: FileCode2, color: "text-purple-400", glowColor: "rgba(168,85,247,0.2)" },
  frontend_agent: { icon: Layers, color: "text-blue-400", glowColor: "rgba(96,165,250,0.2)" },
  deploy_agent:   { icon: Rocket, color: "text-green-400", glowColor: "rgba(74,222,128,0.2)" },
};

export default function Agent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: config, isLoading: isConfigLoading } = useGetAgentConfig();
  const { data: status } = useGetAgentStatus({ query: { refetchInterval: 2000 } });

  const updateConfig = useUpdateAgentConfig();
  const triggerAgent = useTriggerAgent();

  const [localConfig, setLocalConfig] = useState({
    maxConcurrentTasks: 3,
    executionIntervalSec: 10,
    requireApprovalForDeploy: true,
    requireApprovalForMainnet: true,
    autoRetryFailed: false,
  });

  useEffect(() => {
    if (config) {
      setLocalConfig({
        maxConcurrentTasks: config.maxConcurrentTasks,
        executionIntervalSec: config.executionIntervalSec,
        requireApprovalForDeploy: config.requireApprovalForDeploy,
        requireApprovalForMainnet: config.requireApprovalForMainnet,
        autoRetryFailed: config.autoRetryFailed,
      });
    }
  }, [config]);

  const handleModeChange = (mode: "manual" | "supervised" | "semi_auto" | "full_auto") => {
    updateConfig.mutate({ data: { autonomyLevel: mode } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAgentConfigQueryKey() });
        toast({ title: "Autonomy Level Updated", description: `Mode set to ${mode.toUpperCase()}` });
      },
    });
  };

  const handleConfigSave = () => {
    updateConfig.mutate({
      data: {
        maxConcurrentTasks: Number(localConfig.maxConcurrentTasks),
        executionIntervalSec: Number(localConfig.executionIntervalSec),
        requireApprovalForDeploy: localConfig.requireApprovalForDeploy,
        requireApprovalForMainnet: localConfig.requireApprovalForMainnet,
        autoRetryFailed: localConfig.autoRetryFailed,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAgentConfigQueryKey() });
        toast({ title: "Configuration Saved", description: "Agent operational parameters updated." });
      },
    });
  };

  const handleToggleAgent = (checked: boolean) => {
    updateConfig.mutate({ data: { isEnabled: checked } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAgentConfigQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAgentStatusQueryKey() });
        toast({
          title: checked ? "Agent Fleet Activated" : "Agent Fleet Suspended",
          description: checked ? "All worker agents are now online." : "All operations halted.",
        });
      },
    });
  };

  const handleTrigger = () => {
    triggerAgent.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAgentStatusQueryKey() });
        toast({ title: "Cycle Triggered", description: "Orchestrator dispatched a new cycle." });
      },
    });
  };

  const autonomyLevels = [
    { id: "manual",     name: "MANUAL",     icon: Shield,       desc: "User triggers each task",          borderActive: "border-muted-foreground", textActive: "text-muted-foreground" },
    { id: "supervised", name: "SUPERVISED", icon: CheckCircle2, desc: "User approves each critical step",  borderActive: "border-blue-500",         textActive: "text-blue-400" },
    { id: "semi_auto",  name: "SEMI-AUTO",  icon: Bot,          desc: "Pauses before blockchain ops",      borderActive: "border-primary",          textActive: "text-primary" },
    { id: "full_auto",  name: "FULL AUTO",  icon: Zap,          desc: "Fully autonomous, no interrupts",   borderActive: "border-red-500",          textActive: "text-red-400" },
  ];

  const workers = status?.workers ?? [];
  const busyWorkers = workers.filter((w) => w.status === "running").length;
  const idleWorkers = workers.filter((w) => w.status === "idle").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase border-b border-primary/30 pb-2 inline-block">
            Agent Fleet
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Autonomous multi-agent execution — build without permission
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border p-2 rounded-lg">
          <Power className={`h-5 w-5 ${config?.isEnabled ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          <span className="text-xs uppercase font-mono text-muted-foreground">Main Power</span>
          <Switch
            checked={config?.isEnabled ?? false}
            onCheckedChange={handleToggleAgent}
            disabled={isConfigLoading}
            className="ml-2 data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {/* Autonomy Level */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          Autonomy Level
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {autonomyLevels.map((level) => {
            const isActive = config?.autonomyLevel === level.id;
            const Icon = level.icon;
            const isFullAuto = level.id === "full_auto";
            return (
              <Card
                key={level.id}
                className={`cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? `${level.borderActive} ${isFullAuto ? "bg-red-950/20" : "bg-primary/5"}`
                    : "border-border hover:border-muted-foreground/50"
                }`}
                style={isActive ? {
                  boxShadow: isFullAuto
                    ? "0 0 20px rgba(239,68,68,0.15)"
                    : level.id === "manual" ? undefined : "0 0 20px rgba(0,255,255,0.12)",
                } : undefined}
                onClick={() => handleModeChange(level.id as "manual" | "supervised" | "semi_auto" | "full_auto")}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <Icon className={`h-6 w-6 ${isActive ? level.textActive : "text-muted-foreground"}`} />
                    {isActive && (
                      <div className={`h-2 w-2 rounded-full animate-pulse ${isFullAuto ? "bg-red-500" : "bg-primary"}`} />
                    )}
                  </div>
                  <h3 className={`font-mono font-bold tracking-wider mb-1 ${isActive ? level.textActive : "text-foreground"}`}>
                    {level.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-auto">{level.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Worker Fleet */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Worker Fleet
          </h2>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-primary">{busyWorkers} active</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{idleWorkers} idle</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workers.length === 0
            ? WORKER_DEFINITIONS_PLACEHOLDER.map((def) => (
                <WorkerCard key={def.id} worker={def} />
              ))
            : workers.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
        </div>
      </div>

      {/* Telemetry + Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50 mb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Orchestrator Telemetry
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${status?.isRunning ? "bg-primary animate-pulse" : "bg-muted"}`} />
                  <span className="font-mono text-sm">{status?.isRunning ? "RUNNING" : "IDLE"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Active / Pending</span>
                <div className="font-mono text-sm">
                  <span className="text-primary">{status?.runningTaskCount ?? 0}</span>
                  {" / "}
                  {status?.pendingTaskCount ?? 0}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Awaiting Approval</span>
                <div className="font-mono text-sm text-yellow-500 font-bold">
                  {status?.awaitingApprovalCount ?? 0}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Cycles</span>
                <div className="font-mono text-sm">{status?.cycleCount ?? 0}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <div className="text-xs uppercase font-mono text-muted-foreground">Next Cycle</div>
                  <div className="font-mono text-sm">
                    {status?.nextCycleIn !== undefined
                      ? status.nextCycleIn > 0
                        ? `T-${status.nextCycleIn}s`
                        : "IMMINENT"
                      : "--"}
                  </div>
                </div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs uppercase font-mono text-muted-foreground">Last Cycle</div>
                <div className="font-mono text-xs">
                  {status?.lastCycleAt
                    ? format(new Date(status.lastCycleAt), "HH:mm:ss.SSS")
                    : "NEVER"}
                </div>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs uppercase font-mono text-muted-foreground">Tasks Processed</div>
                <div className="font-mono text-sm text-primary">{status?.tasksProcessedTotal ?? 0}</div>
              </div>
              <Button
                onClick={handleTrigger}
                disabled={triggerAgent.isPending || !config?.isEnabled}
                variant="outline"
                className="gap-2 font-mono uppercase text-xs border-primary/30 text-primary hover:bg-primary/10 ml-auto w-full sm:w-auto"
              >
                <Play className="h-3 w-3" /> Trigger Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50 mb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Configuration
            </CardTitle>
            <Settings2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono text-muted-foreground">Max Concurrent Tasks</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={localConfig.maxConcurrentTasks}
                onChange={(e) =>
                  setLocalConfig((prev) => ({ ...prev, maxConcurrentTasks: parseInt(e.target.value) || 1 }))
                }
                className="font-mono bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono text-muted-foreground">Execution Interval (s)</Label>
              <Input
                type="number"
                min={5}
                max={120}
                value={localConfig.executionIntervalSec}
                onChange={(e) =>
                  setLocalConfig((prev) => ({ ...prev, executionIntervalSec: parseInt(e.target.value) || 10 }))
                }
                className="font-mono bg-background"
              />
            </div>

            <div className="space-y-3 pt-2">
              {[
                { key: "requireApprovalForDeploy" as const, label: "Approval for Deploy" },
                { key: "requireApprovalForMainnet" as const, label: "Approval for Mainnet" },
                { key: "autoRetryFailed" as const, label: "Auto Retry Failed" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-xs uppercase font-mono text-muted-foreground">{label}</Label>
                  <Switch
                    checked={localConfig[key]}
                    onCheckedChange={(c) => setLocalConfig((prev) => ({ ...prev, [key]: c }))}
                  />
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-4 font-mono uppercase tracking-widest text-xs"
              onClick={handleConfigSave}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? "Saving..." : "Save Config"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Worker Card ─────────────────────────────────────────────────────────────

type WorkerShape = {
  id: string;
  name: string;
  role: string;
  categories: string[];
  status: string;
  currentTaskId?: number | null;
  currentTaskTitle?: string | null;
  tasksCompleted: number;
  lastActiveAt?: string | null;
};

const WORKER_DEFINITIONS_PLACEHOLDER: WorkerShape[] = [
  { id: "contract_agent", name: "CONTRACT AGENT", role: "Smart Contract & Audit Specialist", categories: ["smart_contract", "audit"], status: "idle", tasksCompleted: 0 },
  { id: "frontend_agent", name: "FRONTEND AGENT", role: "UI & Backend Engineer", categories: ["frontend", "backend"], status: "idle", tasksCompleted: 0 },
  { id: "deploy_agent",   name: "DEPLOY AGENT",   role: "Deployment & Integration Specialist", categories: ["deploy", "integration", "other"], status: "idle", tasksCompleted: 0 },
];

function WorkerCard({ worker }: { worker: WorkerShape }) {
  const meta = WORKER_META[worker.id] ?? { icon: Radio, color: "text-primary", glowColor: "rgba(0,255,255,0.12)" };
  const Icon = meta.icon;
  const isRunning = worker.status === "running";
  const isPaused = worker.status === "paused";

  return (
    <Card
      className="relative overflow-hidden transition-all duration-500"
      style={isRunning ? { boxShadow: `0 0 18px ${meta.glowColor}`, borderColor: meta.color.replace("text-", "") } : undefined}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded bg-background border border-border ${isRunning ? "border-opacity-50" : ""}`}>
              <Icon className={`h-4 w-4 ${isRunning ? meta.color : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className={`text-xs font-mono font-bold tracking-widest ${isRunning ? meta.color : "text-foreground"}`}>
                {worker.name}
              </p>
              <p className="text-[10px] text-muted-foreground">{worker.role}</p>
            </div>
          </div>
          <StatusDot status={worker.status} />
        </div>

        {/* Current task */}
        <div className="space-y-1 min-h-[36px]">
          {isRunning && worker.currentTaskTitle ? (
            <>
              <p className="text-[10px] uppercase font-mono text-muted-foreground">Executing</p>
              <p className="text-xs font-mono text-foreground truncate">{worker.currentTaskTitle}</p>
            </>
          ) : isPaused ? (
            <>
              <p className="text-[10px] uppercase font-mono text-yellow-500">Awaiting Approval</p>
              <p className="text-xs font-mono text-foreground truncate">{worker.currentTaskTitle ?? "—"}</p>
            </>
          ) : (
            <p className="text-xs font-mono text-muted-foreground/50">No active task</p>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-mono text-muted-foreground">Completed</p>
            <p className={`text-sm font-mono font-bold ${meta.color}`}>{worker.tasksCompleted}</p>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {worker.categories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-[9px] font-mono px-1 py-0 border-border/50 text-muted-foreground">
                {cat.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Last active */}
        {worker.lastActiveAt && (
          <p className="text-[10px] font-mono text-muted-foreground/40">
            Last active {formatDistanceToNow(new Date(worker.lastActiveAt), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "running") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-mono text-green-400 uppercase">Active</span>
      </div>
    );
  }
  if (status === "paused") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-[10px] font-mono text-yellow-400 uppercase">Paused</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-muted" />
      <span className="text-[10px] font-mono text-muted-foreground uppercase">Idle</span>
    </div>
  );
}
