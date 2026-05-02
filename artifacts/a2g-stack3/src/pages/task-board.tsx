import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, GripVertical, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { AGENTS } from "@/lib/agents";

// Mock data since API is missing create/update details for this exercise, we'll build the UI completely
const MOCK_TASKS = [
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

import { Activity } from "lucide-react";

export default function TaskBoard() {
  const [tasks, setTasks] = useState(MOCK_TASKS);

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
        ? { ...t, status: newStatus, progress: newStatus === 'COMPLETED' ? 100 : (newStatus === 'PENDING' ? 0 : t.progress) } 
        : t
    ));
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">AGENT TASK_BOARD</h1>
          <p className="font-mono text-sm text-muted-foreground">Distributed processing queue</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs">
          <Plus className="w-4 h-4 mr-2" />
          NEW_TASK
        </Button>
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
                              <span>PROGRESS</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          {agent ? (
                            <div className="flex items-center gap-1.5" title={agent.name}>
                              <div className="p-1 rounded bg-muted">
                                <agent.icon className="w-3 h-3 text-muted-foreground" />
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">{agent.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-muted-foreground">UNASSIGNED</span>
                          )}
                          
                          {/* Mock action buttons to simulate drag/drop for this UI demo */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {column.id !== 'PENDING' && (
                              <button onClick={() => moveTask(task.id, 'PENDING')} className="p-1 hover:bg-muted rounded"><Clock className="w-3 h-3 text-muted-foreground" /></button>
                            )}
                            {column.id !== 'IN_PROGRESS' && (
                              <button onClick={() => moveTask(task.id, 'IN_PROGRESS')} className="p-1 hover:bg-muted rounded"><Activity className="w-3 h-3 text-primary" /></button>
                            )}
                            {column.id !== 'COMPLETED' && (
                              <button onClick={() => moveTask(task.id, 'COMPLETED')} className="p-1 hover:bg-muted rounded"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
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
    </div>
  );
}
