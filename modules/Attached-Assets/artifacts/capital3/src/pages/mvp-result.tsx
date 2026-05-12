import { useParams, Link } from "wouter";
import { useGetMvpAnalysis, getGetMvpAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FlaskConical, Target, Lightbulb, AlertTriangle, ChevronRight, CheckCircle2, RotateCcw, Zap } from "lucide-react";
import { format } from "date-fns";

const SCORE_COLOR = (s: number) => s >= 70 ? "#FFB300" : s >= 45 ? "#FF9100" : "#ef4444";
const SCORE_LABEL = (s: number) => s >= 70 ? "FORTE" : s >= 45 ? "MODERADO" : "FRACO";

const REC_CONFIG = {
  persist: { label: "PERSISTIR", icon: CheckCircle2, color: "#FFB300", bg: "bg-amber-500/10 border-amber-500/30" },
  pivot: { label: "PIVOTAR", icon: RotateCcw, color: "#ef4444", bg: "bg-red-500/10 border-red-500/30" },
  accelerate: { label: "ACELERAR", icon: Zap, color: "#22c55e", bg: "bg-green-500/10 border-green-500/30" },
};

type FitStage = { score: number; assessment: string; evidence: string; gaps: string[] };
type FitStages = { problem_solution: FitStage; product_solution: FitStage; product_market: FitStage };
type ValidationStrategy = { approach: string; experiments: string[]; tactics: string[] };

export default function MvpResult() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data, isLoading, error } = useGetMvpAnalysis(id, {
    query: { enabled: !!id, queryKey: getGetMvpAnalysisQueryKey(id) },
  });

  if (isLoading) return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-card/40 animate-pulse border border-border/40" style={{ animationDelay: `${i*100}ms` }} />)}
    </div>
  );
  if (error || !data) return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="border border-destructive/50 bg-destructive/10 p-6 font-mono text-destructive text-sm">ERRO: Análise não encontrada.</div>
    </div>
  );

  const fitStages = data.fit_stages as unknown as FitStages;
  const validationStrategy = data.validation_strategy as unknown as ValidationStrategy;
  const validationRisks = data.validation_risks as unknown as string[];
  const nextSteps = data.next_steps as unknown as string[];
  const rec = REC_CONFIG[data.recommendation as keyof typeof REC_CONFIG] ?? REC_CONFIG.persist;
  const RecIcon = rec.icon;

  const stages = [
    { key: "problem_solution", label: "Problem-Solution FIT", data: fitStages.problem_solution },
    { key: "product_solution", label: "Product-Solution FIT", data: fitStages.product_solution },
    { key: "product_market", label: "Product-Market FIT", data: fitStages.product_market },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="relative container mx-auto px-4 py-10 max-w-5xl">
        <Link href="/mvp" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-mono text-xs uppercase tracking-wider mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> MVP VALIDATOR
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter gold-gradient-text" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {data.startup_name}
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono bg-primary/10 border border-primary/30 text-primary uppercase tracking-wider">{data.stage}</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
              MVP REPORT &nbsp;// &nbsp;{data.created_at ? format(new Date(data.created_at), "yyyy-MM-dd HH:mm") : ""} &nbsp;// &nbsp;ID:{String(data.id ?? 0).padStart(4, "0")}
            </p>
          </div>
          <div className={`flex items-center gap-3 px-5 py-3 border ${rec.bg}`}>
            <RecIcon className="w-5 h-5" style={{ color: rec.color }} />
            <div>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">RECOMENDAÇÃO</p>
              <p className="font-mono font-black text-lg leading-none" style={{ color: rec.color, fontFamily: "Orbitron, sans-serif" }}>{rec.label}</p>
            </div>
          </div>
        </div>

        {/* FIT Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 mb-6">
          {stages.map(({ label, data: s }) => {
            const color = SCORE_COLOR(s.score);
            return (
              <div key={label} className="bg-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: color }} />
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
                <div className="flex items-end gap-3 mb-3">
                  <span className="font-black text-4xl leading-none" style={{ color, fontFamily: "Orbitron, sans-serif" }}>{s.score}</span>
                  <span className="font-mono text-[10px] font-bold pb-1" style={{ color }}>{SCORE_LABEL(s.score)}</span>
                </div>
                {/* Score bar */}
                <div className="h-1.5 bg-border/60 mb-3">
                  <div className="h-full transition-all" style={{ width: `${s.score}%`, background: color }} />
                </div>
                <p className="font-sans text-xs text-foreground/80 leading-relaxed mb-2">{s.assessment}</p>
              </div>
            );
          })}
        </div>

        {/* FIT Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stages.map(({ label, data: s }) => {
            const color = SCORE_COLOR(s.score);
            return (
              <Card key={label} className="border-border/40 bg-card/70">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color }}>{label} — EVIDÊNCIAS</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">EVIDÊNCIA</p>
                    <p className="font-sans text-xs text-foreground/80 leading-relaxed">{s.evidence}</p>
                  </div>
                  {s.gaps.length > 0 && (
                    <div>
                      <p className="font-mono text-[9px] text-destructive/70 uppercase tracking-widest mb-1">GAPS</p>
                      {s.gaps.map((g, i) => (
                        <p key={i} className="font-sans text-xs text-foreground/70 leading-relaxed flex gap-1.5">
                          <span className="text-destructive/60 flex-shrink-0">·</span>{g}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* MVP Type + Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5" />TIPO DE MVP RECOMENDADO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="font-mono font-black text-xl gold-gradient-text mb-3" style={{ fontFamily: "Orbitron, sans-serif" }}>{data.mvp_type}</p>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">{validationStrategy.approach}</p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: rec.color }}>
                <RecIcon className="w-3.5 h-3.5" />RATIONALE — {rec.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="font-sans text-sm text-foreground/85 leading-relaxed">{data.recommendation_rationale}</p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Target className="w-3.5 h-3.5" />EXPERIMENTOS DE VALIDAÇÃO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {validationStrategy.experiments.map((exp, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-primary font-bold mt-0.5 flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                    <p className="font-sans text-sm text-foreground/80 leading-relaxed">{exp}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5" />TÁTICAS RECOMENDADAS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {validationStrategy.tactics.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary flex-shrink-0 mt-1.5" />
                    <p className="font-sans text-sm text-foreground/80 leading-relaxed">{t}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Risks + Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-destructive uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />RISCOS DE VALIDAÇÃO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {validationRisks.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-destructive/70 font-bold mt-0.5 flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                    <p className="font-sans text-sm text-foreground/80 leading-relaxed">{r}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5" />PRÓXIMOS PASSOS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-primary font-bold mt-0.5 flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                    <p className="font-sans text-sm text-foreground/80 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
