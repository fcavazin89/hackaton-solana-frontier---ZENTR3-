import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useListAgents, useListProjects, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Plus, Circle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "text-muted-foreground border-muted-foreground/30",
  in_progress: "text-cyan-400 border-cyan-400/30",
  completed: "text-emerald-400 border-emerald-400/30",
  failed: "text-red-400 border-red-400/30",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-cyan-400",
  high: "text-amber-400",
  critical: "text-red-400",
};

const statusList = ["pending", "in_progress", "completed", "failed"] as const;
const priorityList = ["low", "medium", "high", "critical"] as const;
const categoryList = ["community", "tokenomics", "marketing", "traction", "analytics", "partnership"] as const;

const createTaskSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  agentId: z.coerce.number().min(1, "Agent required"),
  projectId: z.coerce.number().optional(),
  priority: z.enum(priorityList),
  category: z.enum(categoryList),
});
type CreateTaskForm = z.infer<typeof createTaskSchema>;

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: agents } = useListAgents();
  const { data: projects } = useListProjects();
  const { data: tasks, isLoading } = useListTasks(statusFilter !== "all" ? { status: statusFilter as "pending" | "in_progress" | "completed" | "failed" } : undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "", agentId: 0, priority: "medium", category: "community" },
  });

  const onSubmit = (data: CreateTaskForm) => {
    const { projectId, ...rest } = data;
    createTask.mutate(
      { data: projectId ? { ...rest, projectId } : rest },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
          setOpen(false);
          form.reset();
          toast({ title: "Task created" });
        },
      }
    );
  };

  const cycleStatus = (id: number, current: string) => {
    const next: Record<string, string> = { pending: "in_progress", in_progress: "completed", completed: "pending", failed: "pending" };
    updateTask.mutate(
      { id, data: { status: next[current] as "pending" | "in_progress" | "completed" | "failed" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">Task Board</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{tasks?.length ?? 0} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-mono">
            {["all", ...statusList].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded border transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`filter-${s}`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-task">
                <Plus className="w-4 h-4 mr-1" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input {...field} data-testid="input-task-title" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} rows={2} data-testid="input-task-description" /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="agentId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent</FormLabel>
                        <Select onValueChange={(v) => field.onChange(parseInt(v, 10))} defaultValue={field.value ? String(field.value) : undefined}>
                          <FormControl><SelectTrigger data-testid="select-task-agent"><SelectValue placeholder="Select agent" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {agents?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="projectId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project (optional)</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : parseInt(v, 10))}>
                          <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {projects?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="priority" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {priorityList.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {categoryList.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTask.isPending} data-testid="button-submit-task">
                    {createTask.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded divide-y divide-border">
          {tasks?.map((task) => (
            <div key={task.id} className="px-4 py-3 flex items-start gap-3" data-testid={`row-task-${task.id}`}>
              <button
                onClick={() => cycleStatus(task.id, task.status)}
                className="mt-0.5 flex-shrink-0"
                data-testid={`button-cycle-status-${task.id}`}
              >
                {task.status === "in_progress" ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <Circle className={`w-4 h-4 ${task.status === "completed" ? "text-emerald-400 fill-emerald-400" : "text-muted-foreground"}`} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                  <span className={`text-xs font-mono flex-shrink-0 capitalize ${priorityColors[task.priority] ?? ""}`}>{task.priority}</span>
                </div>
                {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                  <span className={`capitalize px-1.5 py-0.5 rounded border text-xs ${statusColors[task.status] ?? ""}`}>
                    {task.status.replace("_", " ")}
                  </span>
                  <span className="text-muted-foreground capitalize">{task.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
