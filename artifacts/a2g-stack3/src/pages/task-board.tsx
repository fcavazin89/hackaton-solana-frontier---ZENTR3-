import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, GripVertical, Clock, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { Activity } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { exportToPdf } from "@/lib/export-pdf";
import { useProject, ProjectTask } from "@/context/project-context";

const MOCK_TASKS: ProjectTask[] = [
  { id: '1', title: 'Compile Tokenomics Whitepaper', description: 'Draft the v1 tokenomics including vesting schedule', status: 'IN_PROGRESS', priority: 'HIGH', progress: 65, assignedTo: '2' },
  { id: '2', title: 'Competitor Analysis', description: 'Analyze top 3 competitors in DeFi options', status: 'COMPLETED', priority: 'MEDIUM', progress: 100, assignedTo: '1' },
  { id: '3', title: 'Audit Smart Contracts', description: 'Review ERC20 implementation', status: 'PENDING', priority: 'HIGH', progress: 0, assignedTo: 'audit' },
  { id: '4', title: 'Draft Marketing Plan', description: 'Create Twitter thread schedule', status: 'PENDING', priority: 'LOW', progress: 0, assignedTo: '5' },
];

const COLUMNS = [
  { id: 'PENDING', label: 'PENDING', icon: Clock, color: 'text-muted-foreground' },
  { id: 'IN_PROGRESS', label: 'IN_PROGRESS', icon: Activity, color: 'text-primary' },
  { id: 'COMPLETED', label: 'COMPLETED', icon: CheckCircle2, color: 'text-emerald-400' },
  { id: 'FAILED', label: 'FAILED', icon: XCircle, color: 'text-rose-400' },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981',
};

export default function TaskBoard() {
  const { tasks: contextTasks, businessPlan } = useProject();
  const activeTasks = contextTasks.length > 0 ? contextTasks : MOCK_TASKS;
  const [tasks, setTasks] = useState<ProjectTask[]>(activeTasks);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const moveTask = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: newStatus as any, progress: newStatus === 'COMPLETED' ? 100 : (newStatus === 'PENDING' ? 0 : t.progress) }
        : t
    ));
  };

  async function handleExport() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const name = businessPlan?.projectName || "TaskBoard";
      await exportToPdf(printRef.current, `A2G_Tasks_${name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">AGENT TASK_BOARD</h1>
          <p className="font-mono text-sm text-muted-foreground">
            {businessPlan ? `${businessPlan.projectName} · Distributed processing queue` : 'Distributed processing queue'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />EXPORTING...</>
              : <><Download className="w-4 h-4 mr-2" />EXPORT_PDF</>
            }
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs">
            <Plus className="w-4 h-4 mr-2" />
            NEW_TASK
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden pb-4">
        {COLUMNS.map(column => (
          <div key={column.id} className="flex flex-col h-full bg-muted/10 rounded-lg border border-border/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <column.icon className={`w-4 h-4 ${column.color}`} />
                <h3 className="font-mono text-sm font-semibold">{column.label}</h3>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {tasks.filter(t => t.status === column.id).length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {tasks.filter(t => t.status === column.id).map(task => {
                const agent = AGENTS.find(a => a.id === task.assignedTo);
                return (
                  <Card key={task.id} className="bg-card border-border/50 hover:border-primary/50 transition-colors group cursor-grab active:cursor-grabbing">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`font-mono text-[9px] px-1 py-0 border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                        <GripVertical className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="font-sans font-medium text-sm mb-1 leading-tight">{task.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
                      <div className="space-y-2">
                        {column.id === 'IN_PROGRESS' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                              <span>PROGRESS</span><span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          {agent ? (
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 rounded bg-muted"><agent.icon className="w-3 h-3 text-muted-foreground" /></div>
                              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">{agent.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-muted-foreground">UNASSIGNED</span>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {column.id !== 'PENDING' && <button onClick={() => moveTask(task.id, 'PENDING')} className="p-1 hover:bg-muted rounded"><Clock className="w-3 h-3 text-muted-foreground" /></button>}
                            {column.id !== 'IN_PROGRESS' && <button onClick={() => moveTask(task.id, 'IN_PROGRESS')} className="p-1 hover:bg-muted rounded"><Activity className="w-3 h-3 text-primary" /></button>}
                            {column.id !== 'COMPLETED' && <button onClick={() => moveTask(task.id, 'COMPLETED')} className="p-1 hover:bg-muted rounded"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></button>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {tasks.filter(t => t.status === column.id).length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg">
                  <span className="text-xs font-mono text-muted-foreground/50">NO_TASKS</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden print view */}
      <div ref={printRef} style={{ position: "absolute", left: "-9999px", top: 0, width: "794px", backgroundColor: "#080F14", color: "#BDB7C3", padding: "40px", fontFamily: "sans-serif" }}>
        <div style={{ marginBottom: "24px", borderBottom: "1px solid #1E2730", paddingBottom: "16px" }}>
          <div style={{ color: "#00D1FF", fontSize: "20px", fontWeight: "bold", letterSpacing: "2px" }}>A2G STACK3 — TASK BOARD</div>
          <div style={{ color: "#5A6470", fontSize: "12px", marginTop: "4px" }}>
            {businessPlan ? `${businessPlan.projectName} · ` : ''}Exported {new Date().toLocaleString()} · {tasks.length} tasks
          </div>
        </div>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          if (colTasks.length === 0) return null;
          return (
            <div key={col.id} style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: col.id === 'IN_PROGRESS' ? '#00D1FF' : col.id === 'COMPLETED' ? '#10b981' : col.id === 'FAILED' ? '#ef4444' : '#5A6470', letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px", borderBottom: "1px solid #1E2730", paddingBottom: "6px" }}>
                {col.label} ({colTasks.length})
              </div>
              {colTasks.map(task => {
                const agent = AGENTS.find(a => a.id === task.assignedTo);
                return (
                  <div key={task.id} style={{ backgroundColor: "#0A121A", border: "1px solid #1E2730", borderRadius: "6px", padding: "12px 16px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "bold", color: "#E8E3EF" }}>{task.title}</span>
                      <span style={{ fontSize: "10px", color: PRIORITY_COLORS[task.priority] || '#5A6470', fontWeight: "bold" }}>{task.priority}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#5A6470", marginBottom: "4px" }}>{task.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#5A6470" }}>
                      <span>Assigned: {agent?.name || 'Unassigned'}</span>
                      {task.progress > 0 && <span>Progress: {task.progress}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
