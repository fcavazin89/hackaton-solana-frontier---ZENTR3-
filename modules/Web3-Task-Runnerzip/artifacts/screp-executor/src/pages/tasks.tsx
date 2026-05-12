import { useState } from "react";
import { 
  useListTasks, useCreateTask, useDeleteTask, useExecuteTask, getListTasksQueryKey, 
  getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey,
  useListTaskSteps, useApproveTaskStep, useRejectTaskStep, getListTaskStepsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { TerminalSquare, Plus, Trash2, Play, CircleDashed, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronRight, ShieldAlert, X } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["smart_contract", "frontend", "backend", "deploy", "integration", "audit", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"])
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

function TaskStepsPipeline({ taskId, taskStatus, initialExpanded }: { taskId: number, taskStatus: string, initialExpanded: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const queryClient = useQueryClient();
  
  const showSteps = expanded || taskStatus === 'running' || taskStatus === 'awaiting_approval';
  
  const { data: steps, isLoading } = useListTaskSteps(taskId, { 
    query: { 
      enabled: showSteps, 
      refetchInterval: (showSteps && taskStatus === 'running') ? 2000 : false 
    } 
  });
  
  const approveStep = useApproveTaskStep();
  const rejectStep = useRejectTaskStep();

  const handleApprove = (stepId: number) => {
    approveStep.mutate({ id: taskId, stepId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTaskStepsQueryKey(taskId) });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    });
  };

  const handleReject = (stepId: number) => {
    rejectStep.mutate({ id: taskId, stepId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTaskStepsQueryKey(taskId) });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    });
  };

  if (!showSteps && !expanded) {
    return (
      <Button variant="ghost" size="sm" className="mt-4 w-full justify-between border border-border/50 text-xs font-mono text-muted-foreground" onClick={() => setExpanded(true)}>
        <span>View Execution Pipeline</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  const stepCount = steps?.length || 0;
  const stepsDone = steps?.filter(s => s.status === 'done' || s.status === 'approved').length || 0;
  const progress = stepCount > 0 ? (stepsDone / stepCount) * 100 : 0;
  const currentRunningStep = steps?.find(s => s.status === 'running');

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-4 border border-border/50 rounded-md bg-background/50">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span>Execution Pipeline</span>
            {taskStatus === 'running' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            {taskStatus === 'running' && currentRunningStep && (
              <span className="text-primary truncate max-w-[150px]">{currentRunningStep.name}</span>
            )}
          </div>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3 border-t border-border/50 space-y-3">
        {taskStatus === 'running' && stepCount > 0 && (
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>Progress</span>
              <span>{stepsDone} / {stepCount} steps</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        
        {isLoading ? (
          <div className="h-8 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : steps && steps.length > 0 ? (
          <div className="space-y-3">
            {steps.map(step => (
              <div key={step.id} className="relative pl-4 border-l-2 border-border/30 pb-3 last:pb-0">
                <div className={`absolute -left-[5px] top-1 h-2 w-2 rounded-full ${
                  step.status === 'done' ? 'bg-green-500' :
                  step.status === 'approved' ? 'bg-green-500/50' :
                  step.status === 'running' ? 'bg-primary animate-pulse shadow-[0_0_5px_rgba(0,255,255,0.5)]' :
                  step.status === 'awaiting_approval' ? 'bg-yellow-500' :
                  step.status === 'failed' ? 'bg-red-500' :
                  step.status === 'rejected' ? 'bg-red-500/50' :
                  'bg-muted-foreground'
                }`} />
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground">[{step.orderIndex}] {step.name}</span>
                      {step.status === 'awaiting_approval' && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-yellow-500/50 text-yellow-500 bg-yellow-500/10">AWAITING</Badge>
                      )}
                    </div>
                    {step.description && <p className="text-[11px] font-mono text-muted-foreground mt-1">{step.description}</p>}
                  </div>
                  
                  {step.status === 'awaiting_approval' && (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 border-green-500/30 text-green-500 hover:bg-green-500/10" onClick={() => handleApprove(step.id)} disabled={approveStep.isPending || rejectStep.isPending}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={() => handleReject(step.id)} disabled={approveStep.isPending || rejectStep.isPending}>
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
                {step.output && step.status === 'done' && (
                  <div className="mt-2 bg-black/40 border border-border/50 rounded p-2 text-[10px] font-mono text-muted-foreground max-h-[80px] overflow-y-auto">
                    {step.output}
                  </div>
                )}
                {step.error && (
                  <div className="mt-2 bg-red-950/20 border border-red-900/50 rounded p-2 text-[10px] font-mono text-red-400">
                    {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-mono text-muted-foreground text-center py-2">No steps defined.</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Tasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tasks, isLoading } = useListTasks(filter !== "all" ? { status: filter as any } : undefined, { query: { refetchInterval: 3000 }});
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const executeTask = useExecuteTask();

  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      priority: "medium"
    }
  });

  const onSubmit = (data: CreateTaskFormValues) => {
    createTask.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Task Created", description: "Directives uploaded to processing queue." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: "Task Terminated", description: `Task ${id} has been removed from the system.` });
      }
    });
  };

  const handleExecute = (id: number) => {
    executeTask.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        toast({ title: "Execution Initiated", description: `Task ${id} is now processing.` });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "done": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "awaiting_approval": return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      default: return <CircleDashed className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase border-b border-primary/30 pb-2 inline-block">Directives</h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">Directive queue — execute without permission</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px] bg-card border-border font-mono text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL_STATUS</SelectItem>
              <SelectItem value="pending">PENDING</SelectItem>
              <SelectItem value="running">RUNNING</SelectItem>
              <SelectItem value="awaiting_approval">AWAITING_APPROVAL</SelectItem>
              <SelectItem value="done">DONE</SelectItem>
              <SelectItem value="failed">FAILED</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-mono uppercase tracking-wider">
                <Plus className="h-4 w-4" /> New Directive
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-widest text-primary font-mono border-b border-primary/20 pb-2">Initialize Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Title</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-border focus-visible:ring-primary" placeholder="e.g. Deploy ERC20 Token" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Parameters (Description)</FormLabel>
                        <FormControl>
                          <Textarea className="bg-background border-border focus-visible:ring-primary font-mono text-sm min-h-[100px]" placeholder="Provide execution parameters..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="smart_contract">Smart Contract</SelectItem>
                              <SelectItem value="frontend">Frontend</SelectItem>
                              <SelectItem value="backend">Backend</SelectItem>
                              <SelectItem value="deploy">Deploy</SelectItem>
                              <SelectItem value="integration">Integration</SelectItem>
                              <SelectItem value="audit">Audit</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">LOW</SelectItem>
                              <SelectItem value="medium">MEDIUM</SelectItem>
                              <SelectItem value="high">HIGH</SelectItem>
                              <SelectItem value="critical">CRITICAL</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full font-mono uppercase tracking-widest" disabled={createTask.isPending}>
                    {createTask.isPending ? "Transmitting..." : "Execute Queue"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse h-32" />
          ))}
        </div>
      ) : tasks?.length === 0 ? (
        <Card className="bg-card border-dashed border-border py-12 flex flex-col items-center justify-center">
          <TerminalSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground uppercase tracking-widest font-mono">Queue Empty</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">No directives found in the current system context.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks?.map((task) => {
            const isAwaiting = task.status === 'awaiting_approval';
            return (
            <Card key={task.id} className={`bg-card border-border transition-all duration-300 group ${
              task.status === 'running' ? 'shadow-[0_0_15px_rgba(0,255,255,0.1)] border-primary/30' : 
              isAwaiting ? 'shadow-[0_0_15px_rgba(234,179,8,0.15)] border-yellow-500/50' :
              'hover:border-primary/50'
            }`}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1 pr-4 w-full">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <CardTitle className="text-lg font-medium">{task.title}</CardTitle>
                    </div>
                    {isAwaiting && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-mono text-xs uppercase shadow-[0_0_10px_rgba(234,179,8,0.3)] animate-pulse">
                        Awaiting Approval
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase bg-background border-primary/20 text-primary">
                      {task.category}
                    </Badge>
                    <Badge variant="outline" className={`font-mono text-[10px] uppercase bg-background border-border ${
                      task.priority === 'critical' ? 'text-destructive border-destructive/50' : 
                      task.priority === 'high' ? 'text-orange-500 border-orange-500/50' : 
                      'text-muted-foreground'
                    }`}>
                      P:{task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono ml-auto">
                      ID:{task.id.toString().padStart(4, '0')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2 font-mono h-10">
                  {task.description || "No parameters specified."}
                </p>
                
                <TaskStepsPipeline taskId={task.id} taskStatus={task.status} initialExpanded={isAwaiting || task.status === 'running'} />
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground font-mono">
                    {format(new Date(task.updatedAt), "yyyy-MM-dd HH:mm:ss")}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === "done" ? (
                      <span className="text-xs font-mono font-bold text-green-500 uppercase tracking-widest px-3 py-1">
                        Está feito.
                      </span>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-mono text-xs uppercase"
                        onClick={() => handleExecute(task.id)}
                        disabled={task.status === "running" || isAwaiting || executeTask.isPending}
                      >
                        <Play className="h-3 w-3" /> Execute
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(task.id)}
                      disabled={deleteTask.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
