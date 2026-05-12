import { useState } from "react";
import { useListProjects, useCreateProject, useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Trash2, ExternalLink } from "lucide-react";
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

const stageColors: Record<string, string> = {
  idea: "text-muted-foreground border-muted-foreground/30",
  mvp: "text-cyan-400 border-cyan-400/30",
  launch: "text-violet-400 border-violet-400/30",
  growth: "text-emerald-400 border-emerald-400/30",
  scale: "text-amber-400 border-amber-400/30",
};

const chainColors: Record<string, string> = {
  Ethereum: "text-blue-400",
  Solana: "text-violet-400",
  Base: "text-cyan-400",
  Polygon: "text-pink-400",
};

const stageList = ["idea", "mvp", "launch", "growth", "scale"] as const;
const chainList = ["Ethereum", "Solana", "Base", "Polygon", "Arbitrum", "Optimism", "Avalanche", "BNB Chain"] as const;

const schema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  chain: z.string().min(1, "Chain required"),
  stage: z.enum(stageList),
  twitterHandle: z.string().optional(),
  discordUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
});
type ProjectForm = z.infer<typeof schema>;

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", chain: "Ethereum", stage: "idea", twitterHandle: "", discordUrl: "", websiteUrl: "" },
  });

  const onSubmit = (data: ProjectForm) => {
    createProject.mutate(
      { data },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setOpen(false);
          form.reset();
          toast({ title: "Project created" });
        },
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    deleteProject.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project deleted" });
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Web3 Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{projects?.length ?? 0} projects tracked</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-create-project">
              <Plus className="w-4 h-4 mr-1" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-project-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} rows={2} /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="chain" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chain</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {chainList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="stage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {stageList.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="twitterHandle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter Handle</FormLabel>
                    <FormControl><Input {...field} placeholder="@handle" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl><Input {...field} placeholder="https://" /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createProject.isPending} data-testid="button-submit-project">
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-muted rounded animate-pulse" />)}
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <div key={project.id} className="bg-card border border-card-border rounded p-4 flex flex-col gap-3" data-testid={`card-project-${project.id}`}>
              <div className="flex items-start justify-between">
                <Link href={`/projects/${project.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                  {project.name}
                </Link>
                <button
                  onClick={() => handleDelete(project.id, project.name)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  data-testid={`button-delete-project-${project.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono capitalize px-1.5 py-0.5 rounded border ${stageColors[project.stage] ?? ""}`}>
                  {project.stage}
                </span>
                <span className={`text-xs font-mono ${chainColors[project.chain] ?? "text-muted-foreground"}`}>{project.chain}</span>
              </div>
              {project.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border text-xs text-muted-foreground">
                {project.twitterHandle && (
                  <span className="font-mono">{project.twitterHandle}</span>
                )}
                {project.websiteUrl && (
                  <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" data-testid={`link-project-website-${project.id}`}>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
