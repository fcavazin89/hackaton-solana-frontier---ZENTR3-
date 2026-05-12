import { useParams, Link } from "wouter";
import { useGetPitch, getGetPitchQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Presentation, Target, Globe, Lightbulb, BarChart2, TrendingUp, Map, Users, DollarSign, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type KeyMetric = { label: string; value: string };

const SLIDES = [
  { key: "pitch_cover", label: "CAPA", icon: Presentation, num: "01" },
  { key: "pitch_context", label: "CONTEXTO", icon: Globe, num: "02" },
  { key: "pitch_problem", label: "PROBLEMA", icon: Target, num: "03" },
  { key: "pitch_market", label: "MERCADO", icon: BarChart2, num: "04" },
  { key: "pitch_solution", label: "SOLUÇÃO", icon: Lightbulb, num: "05" },
  { key: "pitch_business_model", label: "MODELO DE NEGÓCIO", icon: TrendingUp, num: "06" },
  { key: "pitch_traction", label: "TRAÇÃO", icon: ChevronRight, num: "07" },
  { key: "pitch_go_to_market", label: "GO-TO-MARKET", icon: Map, num: "08" },
  { key: "pitch_competitors", label: "CONCORRENTES", icon: BarChart2, num: "09" },
  { key: "pitch_team", label: "TIME", icon: Users, num: "10" },
  { key: "pitch_investment_round", label: "RODADA DE INVESTIMENTO", icon: DollarSign, num: "11" },
];

const SLIDE_COLORS = [
  "#FFB300","#FFC107","#FF9100","#FF6D00","#FFB300",
  "#FFC107","#FF9100","#FF6D00","#FFB300","#FFC107","#FF9100"
];

export default function PitchResult() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data, isLoading, error } = useGetPitch(id, {
    query: { enabled: !!id, queryKey: getGetPitchQueryKey(id) },
  });

  if (isLoading) return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-card/40 animate-pulse border border-border/40" style={{ animationDelay: `${i*100}ms` }} />)}
    </div>
  );
  if (error || !data) return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="border border-destructive/50 bg-destructive/10 p-6 font-mono text-destructive text-sm">ERRO: Pitch não encontrado.</div>
    </div>
  );

  const keyMetrics = data.key_metrics as unknown as KeyMetric[];
  const raw = data as unknown as Record<string, unknown>;

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="relative container mx-auto px-4 py-10 max-w-5xl">
        <Link href="/pitch" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-mono text-xs uppercase tracking-wider mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> PITCH BUILDER
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter gold-gradient-text" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {data.startup_name}
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono bg-primary/10 border border-primary/30 text-primary uppercase tracking-wider">{data.sector}</span>
              <span className="px-2 py-0.5 text-xs font-mono bg-secondary border border-border text-muted-foreground uppercase tracking-wider">{data.stage}</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
              PITCH DECK &nbsp;// &nbsp;{data.created_at ? format(new Date(data.created_at), "yyyy-MM-dd HH:mm") : ""} &nbsp;// &nbsp;ID:{String(data.id ?? 0).padStart(4, "0")}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-px bg-border/60 mb-8" style={{ gridTemplateColumns: `repeat(${Math.min(keyMetrics.length, 4)}, 1fr)` }}>
          {keyMetrics.map((m, i) => (
            <div key={m.label} className="bg-card p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: SLIDE_COLORS[i % SLIDE_COLORS.length] }} />
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{m.label}</p>
              <p className="font-mono font-black text-lg leading-tight" style={{ color: SLIDE_COLORS[i % SLIDE_COLORS.length], fontFamily: "Orbitron, sans-serif" }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Pitch Slides */}
        <div className="space-y-4">
          {SLIDES.map(({ key, label, icon: Icon, num }, idx) => {
            const content = raw[key] as string;
            const color = SLIDE_COLORS[idx % SLIDE_COLORS.length];
            return (
              <Card key={key} className="border-border/40 bg-card/70 overflow-hidden group hover:border-primary/30 transition-colors">
                <div className="flex">
                  {/* Slide number sidebar */}
                  <div className="w-14 flex-shrink-0 flex flex-col items-center justify-center py-5 relative" style={{ background: `${color}12` }}>
                    <div className="absolute top-0 bottom-0 right-0 w-px" style={{ background: `${color}30` }} />
                    <p className="font-mono font-black text-xl leading-none" style={{ color, fontFamily: "Orbitron, sans-serif" }}>{num}</p>
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
                    </div>
                    <p className="font-sans text-sm text-foreground/85 leading-relaxed">{content}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
