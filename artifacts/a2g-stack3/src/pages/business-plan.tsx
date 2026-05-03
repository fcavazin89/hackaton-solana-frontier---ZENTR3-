import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, Play, LayoutDashboard, Rocket, CheckCircle2 } from "lucide-react";
import { useGeneratePlan } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AGENTS } from "@/lib/agents";
import { exportBusinessPlanPdf } from "@/lib/export-pdf";
import { useProject, createTasksFromPlan, createSprintsFromPlan, createRoadmapFromPlan } from "@/context/project-context";

const formSchema = z.object({
  projectName: z.string().min(2, "Project name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export default function BusinessPlan() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { setBusinessPlan, setTasks, setSprints, setRoadmapPhases, setActivationState } = useProject();
  const generatePlanMutation = useGeneratePlan();
  const [results, setResults] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [planReady, setPlanReady] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { projectName: "", description: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setPlanReady(false);
    generatePlanMutation.mutate({ data: values }, {
      onSuccess: (data: any) => {
        setResults(data);

        const planData = {
          projectName: values.projectName,
          description: values.description,
          research: data.research || "",
          tokenomics: data.tokenomics || "",
          architecture: data.architecture || "",
          gtm: data.gtm || "",
          compliance: data.compliance || "",
        };

        setBusinessPlan(planData);
        setTasks(createTasksFromPlan(planData));
        setSprints(createSprintsFromPlan(planData));
        setRoadmapPhases(createRoadmapFromPlan(planData));
        setActivationState("ready");
        setPlanReady(true);

        toast({ title: "Plan Generated", description: "Multi-agent synthesis complete. Tasks auto-created." });
      },
      onError: () => {
        toast({ title: "Generation Failed", description: "Failed to generate business plan.", variant: "destructive" });
      }
    });
  }

  async function handleExport() {
    if (!results) return;
    setIsExporting(true);
    try {
      const values = form.getValues();
      await exportBusinessPlanPdf({
        projectName: values.projectName || "A2G Project",
        description: values.description || "",
        research:      results.research      || "",
        tokenomics:    results.tokenomics    || "",
        architecture:  results.architecture  || "",
        gtm:           results.gtm           || "",
        compliance:    results.compliance    || "",
      });
    } finally {
      setIsExporting(false);
    }
  }

  const sections = [
    { id: 'research', label: 'Research', icon: AGENTS.find(a => a.role === 'RESEARCHER')?.icon },
    { id: 'tokenomics', label: 'Tokenomics', icon: AGENTS.find(a => a.role === 'TOKENOMICS')?.icon },
    { id: 'architecture', label: 'Architecture', icon: AGENTS.find(a => a.role === 'ARCHITECT')?.icon },
    { id: 'gtm', label: 'GTM Strategy', icon: AGENTS.find(a => a.role === 'GTM')?.icon },
    { id: 'compliance', label: 'Compliance', icon: AGENTS.find(a => a.role === 'COMPLIANCE')?.icon },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">BUSINESS PLAN GENERATOR</h1>
          <p className="font-mono text-sm text-muted-foreground">Multi-agent synthesis protocol</p>
        </div>
        {results && (
          <Button
            variant="outline"
            className="font-mono border-primary/50 text-primary hover:bg-primary/10"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />EXPORTING...</>
              : <><Download className="w-4 h-4 mr-2" />EXPORT_PDF</>
            }
          </Button>
        )}
      </div>

      {/* Post-generation CTA */}
      {planReady && (
        <div className="relative overflow-hidden rounded-lg border border-primary/40 bg-primary/5 p-5 animate-in slide-in-from-top duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center justify-between gap-4 relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-primary/20 border border-primary/40">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-primary">SYNTHESIS COMPLETE</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  10 tasks auto-created · 12 agents ready to activate · Protocol Sim seeded
                </p>
              </div>
            </div>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider shrink-0"
              onClick={() => navigate("/")}
            >
              <Rocket className="w-4 h-4 mr-2" />
              LAUNCH COMMAND CENTER
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-card/50 backdrop-blur border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="font-display text-lg">PROJECT_PARAMS</CardTitle>
            <CardDescription className="font-mono text-xs">Initialize synthesis matrix</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="projectName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground">PROJECT_NAME</FormLabel>
                    <FormControl><Input placeholder="e.g. Nexus Protocol" className="font-mono bg-input/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground">CORE_THESIS</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the core mechanism and value proposition..."
                        className="min-h-[150px] font-mono text-sm bg-input/50 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 neon-border mt-4"
                  disabled={generatePlanMutation.isPending}
                >
                  {generatePlanMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SYNTHESIZING...</>
                    : <><Play className="mr-2 h-4 w-4 fill-current" /> INITIATE_PROTOCOL</>
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {generatePlanMutation.isPending ? (
            <Card className="h-[500px] flex items-center justify-center bg-card/30 border-dashed border-border/50">
              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-4">
                  {sections.slice(0, 3).map((sec, i) => {
                    const Icon = sec.icon as any;
                    return (
                      <div key={i} className="p-4 rounded-full border border-primary/30 bg-primary/5 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                        <Icon className="w-8 h-8 text-primary/70" />
                      </div>
                    );
                  })}
                </div>
                <div className="text-center">
                  <p className="font-mono text-primary animate-pulse">COORDINATING AGENTS...</p>
                  <p className="font-mono text-xs text-muted-foreground mt-2">Generating multi-dimensional analysis</p>
                </div>
              </div>
            </Card>
          ) : results ? (
            <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
              <Tabs defaultValue="research" className="w-full">
                <div className="px-4 pt-4 border-b border-border/50 bg-muted/10 overflow-x-auto">
                  <TabsList className="bg-transparent h-12 w-full justify-start">
                    {sections.map((sec) => {
                      const Icon = sec.icon as any;
                      return (
                        <TabsTrigger
                          key={sec.id}
                          value={sec.id}
                          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-mono text-xs"
                        >
                          <Icon className="w-3 h-3 mr-2" />
                          {sec.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
                <div className="p-6 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
                  {sections.map((sec) => (
                    <TabsContent key={sec.id} value={sec.id} className="m-0 animate-in fade-in duration-300">
                      <div className="prose prose-invert max-w-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {results[sec.id] || `*No data generated for ${sec.label}*`}
                        </ReactMarkdown>
                      </div>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </Card>
          ) : (
            <Card className="h-[500px] flex items-center justify-center bg-card/30 border-dashed border-border/50">
              <div className="text-center max-w-sm px-6">
                <LayoutDashboard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-mono text-sm text-muted-foreground">AWAITING_INPUT</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Enter project parameters to trigger the multi-agent business plan synthesis protocol.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
