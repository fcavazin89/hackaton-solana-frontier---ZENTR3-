import { useState } from "react";
import { useListInsights, useCreateInsight, useDeleteInsight, useListAgents, useListProjects, getListInsightsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
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

const impactColors: Record<string, string> = {
  low: "text-muted-foreground border-muted-foreground/30",
  medium: "text-amber-400 border-amber-400/30",
  high: "text-emerald-400 border-emerald-400/30",
};

const categoryColors: Record<string, string> = {
  community: "text-cyan-400",
  tokenomics: "text-violet-400",
  marketing: "text-pink-400",
  traction: "text-emerald-400",
  analytics: "text-amber-400",
  partnership: "text-blue-400",
};

const categoryList = ["community", "tokenomics", "marketing", "traction", "analytics", "partnership"] as const;

const schema = z.object({
  title: z.string().min(1, "Title required"),
  content: z.string().min(1, "Content required"),
  agentId: z.coerce.number().min(1, "Agent required"),
  projectId: z.coerce.number().optional(),
  category: z.enum(categoryList),
  impact: z.enum(["low", "medium", "high"]),
});
type InsightForm = z.infer<typeof schema>;

export default function Insights() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: agents } = useListAgents();
  const { data: projects } = useListProjects();
  const { data: insights, isLoading } = useListInsights(
    categoryFilter !== "all" ? { category: categoryFilter as typeof categoryList[number] } : undefined
  );
  const createInsight = useCreateInsight();
  const deleteInsight = useDeleteInsight();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<InsightForm>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: "", agentId: 0, category: "community", impact: "medium" },
  });

  const onSubmit = (data: InsightForm) => {
    const { projectId, ...rest } = data;
    createInsight.mutate(
      { data: projectId ? { ...rest, projectId } : rest },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListInsightsQueryKey() });
          setOpen(false);
          form.reset();
          toast({ title: "Insight logged" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this insight?")) return;
    deleteInsight.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListInsightsQueryKey() });
          toast({ title: "Insight deleted" });
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">Insights Feed</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{insights?.length ?? 0} insights generated</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-mono flex-wrap">
            {["all", ...categoryList].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2 py-1 rounded border transition-colors capitalize ${
                  categoryFilter === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`filter-category-${c}`}
              >
                {c}
              </button>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-insight">
                <Plus className="w-4 h-4 mr-1" /> Log Insight
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log New Insight</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input {...field} data-testid="input-insight-title" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl><Textarea {...field} rows={4} data-testid="input-insight-content" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="agentId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent</FormLabel>
                        <Select onValueChange={(v) => field.onChange(parseInt(v, 10))}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {agents?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="impact" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {["low", "medium", "high"].map((i) => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
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
                  <Button type="submit" className="w-full" disabled={createInsight.isPending} data-testid="button-submit-insight">
                    {createInsight.isPending ? "Logging..." : "Log Insight"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}
        </div>
      ) : insights?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No insights yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights?.map((insight) => (
            <div key={insight.id} className="bg-card border border-card-border rounded p-4" data-testid={`card-insight-${insight.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono capitalize px-1.5 py-0.5 rounded border ${impactColors[insight.impact] ?? ""}`}>
                      {insight.impact} impact
                    </span>
                    <span className={`text-xs font-mono capitalize ${categoryColors[insight.category] ?? ""}`}>{insight.category}</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(insight.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-medium mt-2">{insight.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(insight.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1"
                  data-testid={`button-delete-insight-${insight.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
