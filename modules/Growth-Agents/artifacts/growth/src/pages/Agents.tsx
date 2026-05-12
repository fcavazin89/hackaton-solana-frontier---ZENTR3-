import { useState } from "react";
import { useListAgents, useCreateAgent, useDeleteAgent, getListAgentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
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

const agentTypeColors: Record<string, string> = {
  community: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  tokenomics: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  marketing: "bg-pink-400/10 text-pink-400 border-pink-400/20",
  traction: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  analytics: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  partnership: "bg-blue-400/10 text-blue-400 border-blue-400/20",
};

const statusDot: Record<string, string> = {
  active: "bg-emerald-400",
  idle: "bg-amber-400",
  paused: "bg-muted-foreground",
};

const createAgentSchema = z.object({
  name: z.string().min(1, "Name required"),
  type: z.enum(["community", "tokenomics", "marketing", "traction", "analytics", "partnership"]),
  description: z.string().optional(),
});
type CreateAgentForm = z.infer<typeof createAgentSchema>;

export default function Agents() {
  const { data: agents, isLoading } = useListAgents();
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: { name: "", type: "community", description: "" },
  });

  const onSubmit = (data: CreateAgentForm) => {
    createAgent.mutate(
      { data },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAgentsQueryKey() });
          setOpen(false);
          form.reset();
          toast({ title: "Agent created" });
        },
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete agent "${name}"?`)) return;
    deleteAgent.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAgentsQueryKey() });
          toast({ title: "Agent deleted" });
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">GROWTH3 Agents</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{agents?.length ?? 0} agents deployed</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-create-agent">
              <Plus className="w-4 h-4 mr-1" /> New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deploy New Agent</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-agent-name" placeholder="e.g. ARIA, TOKEN-X" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-agent-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["community", "tokenomics", "marketing", "traction", "analytics", "partnership"].map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} data-testid="input-agent-description" placeholder="What does this agent do?" rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createAgent.isPending} data-testid="button-submit-agent">
                  {createAgent.isPending ? "Deploying..." : "Deploy Agent"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : agents?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bot className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No agents deployed yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.map((agent) => (
            <div key={agent.id} className="bg-card border border-card-border rounded p-4 flex flex-col gap-3" data-testid={`card-agent-${agent.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[agent.status] ?? "bg-muted"}`} />
                  <Link href={`/agents/${agent.id}`} className="font-mono font-medium text-sm hover:text-primary transition-colors">
                    {agent.name}
                  </Link>
                </div>
                <button
                  onClick={() => handleDelete(agent.id, agent.name)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  data-testid={`button-delete-agent-${agent.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className={`self-start text-xs px-2 py-0.5 rounded border font-mono capitalize ${agentTypeColors[agent.type] ?? ""}`}>
                {agent.type}
              </span>
              {agent.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mt-auto pt-2 border-t border-border">
                <span className="text-emerald-400">{agent.tasksCompleted} tasks done</span>
                <span className="text-primary">{agent.insightsGenerated} insights</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
