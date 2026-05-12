import { Link } from "wouter";
import { useListAnalyses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Terminal, ArrowRight, ShieldAlert, Cpu, History, FlaskConical, BarChart2, Presentation, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const RISK_COLOR: Record<string, string> = {
  low: "#FFB300",
  medium: "#FF9100",
  high: "#ef4444",
  "very-high": "#dc2626",
};

const AGENTS = [
  {
    href: "/analyze",
    icon: Terminal,
    label: "Funding Agent",
    subtitle: "WEB3 FUNDING & TOKENOMICS",
    desc: "Projete sua estratégia de captação com tokenomics institucional, análise de risco vetorial e 3 cenários de valuation.",
    badge: "CAPITAL3",
    color: "#FFB300",
  },
  {
    href: "/mvp",
    icon: FlaskConical,
    label: "MVP Validator",
    subtitle: "PROBLEM-SOLUTION FIT",
    desc: "Valide sua hipótese de MVP com o framework StartSe: avalie PSF, ProSF e PMF com estratégia de experimentos estruturada.",
    badge: "STARTSE",
    color: "#FF9100",
  },
  {
    href: "/bizmodel",
    icon: BarChart2,
    label: "Business Model",
    subtitle: "INOVATIVA BRASIL FRAMEWORK",
    desc: "Arquitete o modelo de negócio ideal: receitas, CAC/LTV, posicionamento competitivo e estratégia de monetização.",
    badge: "ARQUITETO",
    color: "#FFC107",
  },
  {
    href: "/pitch",
    icon: Presentation,
    label: "Pitch Builder",
    subtitle: "INVESTOR PITCH DECK",
    desc: "Gere um pitch deck completo com 11 seções narrativas prontas para apresentação a investidores.",
    badge: "PITCH",
    color: "#FF6D00",
  },
];

export default function Home() {
  const { data: history, isLoading } = useListAnalyses({ limit: 5 });

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 carbon-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,179,0,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-[0.3em]">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
            STACK3 HUB DE AGENTES — {AGENTS.length} AGENTES ONLINE
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter gold-gradient-text leading-none" style={{ fontFamily: "Orbitron, sans-serif" }}>
              CAPITAL3
            </h1>
            <p className="text-lg md:text-2xl font-mono text-foreground/60 tracking-[0.2em] uppercase">
              Funding. Scale. Dominate.
            </p>
          </div>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            A plataforma de inteligência para startups. Do MVP à captação — estruture sua estratégia
            com agentes de IA especializados em cada etapa da sua jornada.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/analyze">
              <Button size="lg" className="h-14 px-10 font-mono text-sm tracking-wider gold-gradient-bg text-black hover:opacity-90 transition-opacity font-bold uppercase">
                <Terminal className="mr-2 w-5 h-5" />
                INICIAR ANÁLISE
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="h-14 px-10 font-mono text-sm tracking-wider border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all uppercase">
                <Cpu className="mr-2 w-5 h-5" />
                DASHBOARD
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Agent Hub */}
      <section className="py-16 bg-card/20 border-y border-border/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-mono text-[10px] text-primary uppercase tracking-[0.3em] mb-1">STACK3 // AGENT HUB</p>
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "Orbitron, sans-serif" }}>
                <span className="gold-gradient-text">4 Agentes</span>{" "}
                <span className="text-foreground/60">Especializados</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
            {AGENTS.map(({ href, icon: Icon, label, subtitle, desc, badge, color }) => (
              <Link key={href} href={href}>
                <div className="relative bg-card h-full p-6 group hover:bg-card/80 transition-colors cursor-pointer overflow-hidden">
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-px transition-all" style={{ background: color, opacity: 0.4 }} />
                  <div className="absolute top-0 left-0 right-0 h-px group-hover:opacity-100 opacity-0 transition-all" style={{ background: color }} />

                  {/* Badge */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border mb-4" style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
                    {badge}
                  </div>

                  <Icon className="w-8 h-8 mb-4 transition-all" style={{ color }} />

                  <h3 className="font-black text-sm uppercase tracking-wide mb-1 text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "Orbitron, sans-serif" }}>
                    {label}
                  </h3>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-3">{subtitle}</p>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-5">{desc}</p>

                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition-colors" style={{ color }}>
                    ACESSAR <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Analyses */}
      <section className="py-16 flex-1">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-5">
            <h2 className="text-xl font-black text-foreground flex items-center gap-3 uppercase tracking-widest" style={{ fontFamily: "Orbitron, sans-serif" }}>
              <History className="w-5 h-5 text-primary" />
              <span className="gold-gradient-text">Análises Recentes</span>
            </h2>
            <Link href="/history" className="text-xs font-mono text-primary hover:text-primary/80 flex items-center gap-1 uppercase tracking-wider transition-colors">
              LEDGER COMPLETO <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-card/50 animate-pulse border border-border/40" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          ) : history?.analyses?.length ? (
            <div className="space-y-2">
              {history.analyses.map((analysis) => (
                <Link key={analysis.id} href={`/results/${analysis.id}`}>
                  <Card className="border-border/40 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer group gold-border-glow-hover">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 gold-gradient-bg flex items-center justify-center font-black text-black text-xs flex-shrink-0" style={{ fontFamily: "Orbitron, sans-serif" }}>
                          {String(analysis.id).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-foreground group-hover:text-primary transition-colors uppercase tracking-wide truncate" style={{ fontFamily: "Orbitron, sans-serif" }}>
                            {analysis.startup_name}
                          </h3>
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">
                            {analysis.stage?.toUpperCase()} &nbsp;·&nbsp; {analysis.valuation_estimate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs font-mono px-2 py-0.5 bg-secondary text-secondary-foreground uppercase tracking-wider hidden sm:inline">{analysis.sector}</span>
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" style={{ color: RISK_COLOR[analysis.risk_level] ?? "#FFB300" }} />
                          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: RISK_COLOR[analysis.risk_level] ?? "#FFB300" }}>
                            {analysis.risk_level}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono hidden md:block">
                          {analysis.created_at ? format(new Date(analysis.created_at), "yyyy-MM-dd") : ""}
                        </p>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border/40 carbon-grid">
              <div className="text-3xl font-black gold-gradient-text mb-3" style={{ fontFamily: "Orbitron, sans-serif" }}>C3</div>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Nenhuma análise encontrada</p>
              <Link href="/analyze" className="mt-4 inline-flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-wider hover:text-primary/80 transition-colors">
                Iniciar primeira análise <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
