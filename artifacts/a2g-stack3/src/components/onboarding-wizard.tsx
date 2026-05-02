import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Terminal, ArrowRight, ArrowLeft, Zap, CheckCircle2,
  Rocket, ClipboardList, LayoutDashboard, Activity, Loader2, X,
} from "lucide-react";
import { useGeneratePlan } from "@workspace/api-client-react";
import { useProject, createTasksFromPlan } from "@/context/project-context";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, label: "PROJECT", title: "What are you building?" },
  { id: 2, label: "THESIS", title: "Describe the core idea" },
  { id: 3, label: "GENERATE", title: "Launch the protocol" },
];

interface OnboardingWizardProps {
  onDismiss: () => void;
}

export function OnboardingWizard({ onDismiss }: OnboardingWizardProps) {
  const [, navigate] = useLocation();
  const { setBusinessPlan, setTasks, setActivationState } = useProject();
  const { toast } = useToast();
  const generatePlanMutation = useGeneratePlan();

  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [planDone, setPlanDone] = useState(false);

  function handleNext() {
    if (step === 2) {
      handleGenerate();
    } else {
      setStep(s => s + 1);
    }
  }

  function handleGenerate() {
    setStep(3);
    generatePlanMutation.mutate(
      { data: { projectName, description } },
      {
        onSuccess: (data: any) => {
          const planData = {
            projectName,
            description,
            research: data.research || "",
            tokenomics: data.tokenomics || "",
            architecture: data.architecture || "",
            gtm: data.gtm || "",
            compliance: data.compliance || "",
          };
          setBusinessPlan(planData);
          setTasks(createTasksFromPlan(planData));
          setActivationState("ready");
          setPlanDone(true);
          toast({ title: "Plan Ready", description: "10 tasks created. Agents standing by." });
        },
        onError: () => {
          toast({ title: "Generation Failed", description: "Please try again.", variant: "destructive" });
          setStep(2);
        },
      }
    );
  }

  function handleLaunch() {
    onDismiss();
    navigate("/");
  }

  const canNext = step === 1 ? projectName.trim().length >= 2 : description.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">

      {/* Dismiss for power users */}
      <button
        onClick={onDismiss}
        className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        title="Skip onboarding"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-2xl mx-4 space-y-6">

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs font-mono font-bold transition-all duration-300 ${
                step === s.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : step > s.id
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "border-border/50 text-muted-foreground"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-[10px] font-mono hidden sm:block ${step === s.id ? "text-primary" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${step > s.id ? "bg-emerald-500/50" : "bg-border/50"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="bg-card border-border/50 shadow-2xl overflow-hidden">

          {/* Step 1: Project Name */}
          {step === 1 && (
            <div className="p-8 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <Terminal className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-0.5">STEP 1 / 3</div>
                  <h2 className="font-display text-2xl font-bold">What are you building?</h2>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                A2G STACK3 is your multi-agent Web3 command center. Give your project a name and we'll guide the AI agents to do the heavy lifting — business planning, architecture, legal, tokenomics, marketing, and more.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-2">PROJECT_NAME *</label>
                  <Input
                    autoFocus
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. Nexus Protocol, Ether DAO, SonicSwap..."
                    className="font-mono bg-input/50 h-12 text-base"
                    onKeyDown={e => { if (e.key === "Enter" && canNext) handleNext(); }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { icon: LayoutDashboard, label: "Command Center", desc: "24 specialized AI agents" },
                    { icon: ClipboardList, label: "Task Board", desc: "Auto-created from your plan" },
                    { icon: Activity, label: "Protocol Sim", desc: "Live market simulation" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
                      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="font-display text-xs font-bold">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div className="p-8 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-0.5">STEP 2 / 3</div>
                  <h2 className="font-display text-2xl font-bold">Describe the core idea</h2>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                In a few sentences, explain <span className="text-foreground font-medium">{projectName}</span>'s mechanism, target market, and value proposition. Our 5 synthesis agents will turn this into a full multi-section business plan.
              </p>

              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-2">CORE_THESIS *</label>
                <Textarea
                  autoFocus
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={`Describe ${projectName}'s core mechanism, target users, problem solved, and competitive advantage...`}
                  className="font-mono bg-input/50 min-h-[160px] text-sm resize-none"
                />
                <p className="text-[10px] font-mono text-muted-foreground mt-2">{description.length} chars · minimum 10</p>
              </div>

              <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-mono text-primary mb-2">WHAT HAPPENS NEXT:</p>
                <ul className="space-y-1.5">
                  {[
                    "5 agents synthesize Research, Tokenomics, Architecture, GTM & Compliance",
                    "10 tasks auto-created and assigned to the right agents",
                    "Protocol Simulator seeded with your project data",
                    "12 key agents activated in the Command Center",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 3 && (
            <div className="p-8 text-center animate-in fade-in duration-300">
              {!planDone ? (
                <>
                  <div className="flex justify-center gap-4 mb-6">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="p-4 rounded-full border border-primary/30 bg-primary/5 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                        <Zap className="w-8 h-8 text-primary/70" />
                      </div>
                    ))}
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">Synthesizing {projectName}</h2>
                  <p className="text-muted-foreground font-mono text-sm animate-pulse">
                    COORDINATING 5 AGENTS · GENERATING FULL ANALYSIS...
                  </p>
                  <div className="mt-6 space-y-2 text-xs font-mono text-muted-foreground/60 text-left max-w-sm mx-auto">
                    <p className="animate-pulse">[RESEARCHER] Scanning DeFi landscape...</p>
                    <p className="animate-pulse" style={{ animationDelay: "400ms" }}>[TOKENOMICS] Modeling emission curves...</p>
                    <p className="animate-pulse" style={{ animationDelay: "800ms" }}>[ARCHITECT] Designing protocol stack...</p>
                    <p className="animate-pulse" style={{ animationDelay: "1200ms" }}>[GTM] Building go-to-market strategy...</p>
                    <p className="animate-pulse" style={{ animationDelay: "1600ms" }}>[COMPLIANCE] Reviewing regulatory landscape...</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="p-5 rounded-full border-2 border-emerald-500/50 bg-emerald-500/10">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2 text-emerald-400">PLAN SYNTHESIZED</h2>
                  <p className="text-muted-foreground mb-1">{projectName} is ready for deployment.</p>
                  <p className="text-xs font-mono text-muted-foreground/60 mb-8">10 tasks created · 12 agents standing by · Protocol Sim seeded</p>

                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider text-base px-10"
                    onClick={handleLaunch}
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    LAUNCH COMMAND CENTER
                  </Button>

                  <p className="text-[10px] font-mono text-muted-foreground/40 mt-4">
                    You can also explore Task Board and Protocol Sim from the nav
                  </p>
                </>
              )}
            </div>
          )}

          {/* Footer nav */}
          {step < 3 && (
            <div className="px-8 pb-6 flex items-center justify-between border-t border-border/50 pt-5">
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-xs text-muted-foreground"
                onClick={() => step > 1 ? setStep(s => s - 1) : onDismiss()}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                {step > 1 ? "BACK" : "SKIP"}
              </Button>

              <div className="flex gap-1.5">
                {STEPS.map(s => (
                  <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${step === s.id ? "bg-primary w-5" : step > s.id ? "bg-emerald-500/50" : "bg-border"}`} />
                ))}
              </div>

              <Button
                size="sm"
                className="font-mono font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleNext}
                disabled={!canNext || generatePlanMutation.isPending}
              >
                {step === 2 ? (
                  generatePlanMutation.isPending
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />GENERATING</>
                    : <><Zap className="w-3.5 h-3.5 mr-1.5" />GENERATE</>
                ) : (
                  <>NEXT <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
