import { useParams, Link } from "wouter";
import { useGetBusinessModelAnalysis, getGetBusinessModelAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart2, TrendingUp, Users, ChevronRight, Star } from "lucide-react";
import { format } from "date-fns";

type ModelOption = { type: string; description: string; fit_score: number; pros: string[]; cons: string[] };
type RevenueStream = { name: string; description: string; potential: string };

const SCORE_COLOR = (s: number) => s >= 70 ? "#FFB300" : s >= 50 ? "#FF9100" : "#888888";

export default function BizModelResult() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data, isLoading, error } = useGetBusinessModelAnalysis(id, {
    query: { enabled: !!id, queryKey: getGetBusinessModelAnalysisQueryKey(id) },
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

  const primaryModel = data.primary_model as unknown as ModelOption;
  const alternativeModels = data.alternative_models as unknown as ModelOption[];
  const revenueStreams = data.revenue_streams as unknown as RevenueStream[];
  const recommendations = data.recommendations as unknown as string[];

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="relative container mx-auto px-4 py-10 max-w-5xl">
        <Link href="/bizmodel" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-mono text-xs uppercase tracking-wider mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> BUSINESS MODEL
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter gold-gradient-text" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {data.startup_name}
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono bg-primary/10 border border-primary/30 text-primary uppercase tracking-wider">{data.sector}</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
              BUSINESS MODEL REPORT &nbsp;// &nbsp;{data.created_at ? format(new Date(data.created_at), "yyyy-MM-dd HH:mm") : ""} &nbsp;// &nbsp;ID:{String(data.id ?? 0).padStart(4, "0")}
            </p>
          </div>
        </div>

        {/* Primary Model Hero */}
        <div className="bg-card border border-primary/40 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 gold-gradient-bg" />
          <div className="absolute top-0 left-0 bottom-0 w-1 gold-gradient-bg" />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[9px] text-primary uppercase tracking-[0.25em] mb-2">MODELO PRIMÁRIO RECOMENDADO</p>
              <h2 className="text-2xl font-black gold-gradient-text mb-3" style={{ fontFamily: "Orbitron, sans-serif" }}>{primaryModel.type}</h2>
              <p className="font-sans text-sm text-foreground/85 leading-relaxed max-w-2xl">{primaryModel.description}</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">FIT SCORE</p>
              <p className="font-black text-5xl leading-none" style={{ color: SCORE_COLOR(primaryModel.fit_score), fontFamily: "Orbitron, sans-serif" }}>
                {primaryModel.fit_score}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border/40">
            <div>
              <p className="font-mono text-[9px] text-primary uppercase tracking-widest mb-2">VANTAGENS</p>
              {primaryModel.pros.map((p, i) => (
                <p key={i} className="font-sans text-xs text-foreground/80 flex gap-2 mb-1.5">
                  <span className="text-primary flex-shrink-0">+</span>{p}
                </p>
              ))}
            </div>
            <div>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">DESAFIOS</p>
              {primaryModel.cons.map((c, i) => (
                <p key={i} className="font-sans text-xs text-foreground/70 flex gap-2 mb-1.5">
                  <span className="text-muted-foreground flex-shrink-0">−</span>{c}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Alternative Models */}
        <div className="mb-6">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3 border-b border-border/30 pb-2">MODELOS ALTERNATIVOS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternativeModels.map((model) => (
              <Card key={model.type} className="border-border/40 bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono font-black text-sm text-foreground uppercase tracking-wide" style={{ fontFamily: "Orbitron, sans-serif" }}>{model.type}</span>
                    <span className="font-mono text-sm font-bold flex-shrink-0" style={{ color: SCORE_COLOR(model.fit_score) }}>{model.fit_score}/100</span>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-3">{model.description}</p>
                  <div className="h-1 bg-border/60 mb-4">
                    <div className="h-full" style={{ width: `${model.fit_score}%`, background: SCORE_COLOR(model.fit_score) }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>{model.pros.slice(0,2).map((p,i) => <p key={i} className="text-foreground/70 flex gap-1"><span className="text-primary">+</span>{p}</p>)}</div>
                    <div>{model.cons.slice(0,2).map((c,i) => <p key={i} className="text-foreground/60 flex gap-1"><span className="text-muted-foreground">−</span>{c}</p>)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Revenue Streams */}
        <Card className="border-border/40 bg-card/70 mb-6">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />STREAMS DE RECEITA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40">
              {revenueStreams.map((stream) => (
                <div key={stream.name} className="bg-card p-4 relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-primary/40" />
                  <p className="font-mono font-black text-xs text-primary uppercase mb-1" style={{ fontFamily: "Orbitron, sans-serif" }}>{stream.name}</p>
                  <p className="font-sans text-xs text-foreground/80 leading-relaxed mb-2">{stream.description}</p>
                  <p className="font-mono text-[10px] text-amber-400 uppercase tracking-wider">{stream.potential}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monetization + CAC/LTV */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Star className="w-3.5 h-3.5" />ESTRATÉGIA DE MONETIZAÇÃO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="font-sans text-sm text-foreground/85 leading-relaxed">{data.monetization_strategy}</p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />ANÁLISE CAC/LTV
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="font-sans text-sm text-foreground/85 leading-relaxed">{data.cac_ltv_analysis}</p>
            </CardContent>
          </Card>
        </div>

        {/* Competitive Positioning + Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5" />POSICIONAMENTO COMPETITIVO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="font-sans text-sm text-foreground/85 leading-relaxed">{data.competitive_positioning}</p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5" />RECOMENDAÇÕES
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-primary font-bold mt-0.5 flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                    <p className="font-sans text-sm text-foreground/80 leading-relaxed">{rec}</p>
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
