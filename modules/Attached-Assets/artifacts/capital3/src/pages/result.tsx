import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetAnalysis, getGetAnalysisQueryKey } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldAlert,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Coins,
  FileDown,
  Presentation,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { exportPDF, exportPPTX, exportDOCX, type AnalysisExportData } from "@/lib/export";

const RISK_COLOR: Record<string, string> = {
  low: "#FFB300",
  medium: "#FF9100",
  high: "#ef4444",
  "very-high": "#dc2626",
};

const SCENARIO_COLORS: Record<string, string> = {
  conservative: "#FFB300",
  moderate: "#FF9100",
  aggressive: "#ef4444",
};

/* Gold → Amber → Orange → Deep Orange → Red-Orange */
const PIE_COLORS = ["#FFB300", "#FFC107", "#FF9100", "#FF6D00", "#E65100"];

type Tokenomics = {
  total_supply: string;
  distribution: Record<string, string>;
  vesting_schedule: string;
  token_utility: string;
};

type Scenario = {
  name: string;
  target_raise: string;
  valuation: string;
  timeline: string;
  probability: string;
};

const CARD_STYLE =
  "rounded-none border-border/50 bg-card/70 backdrop-blur";

export default function Result() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const [exporting, setExporting] = useState<"pdf" | "pptx" | "docx" | null>(null);

  const { data, isLoading, error } = useGetAnalysis(id, {
    query: { enabled: !!id, queryKey: getGetAnalysisQueryKey(id) },
  });

  const handleExport = async (type: "pdf" | "pptx" | "docx") => {
    if (!data || exporting) return;
    setExporting(type);
    try {
      const raw = data as unknown as Record<string, unknown>;
      const exportData: AnalysisExportData = {
        id: data.id ?? 0,
        startup_name: data.startup_name,
        sector: data.sector,
        stage: data.stage,
        description: (raw.description as string) ?? `${data.startup_name} — ${data.sector} ${data.stage} startup.`,
        revenue_model: data.revenue_model ?? "",
        funding_strategy: data.funding_strategy ?? "",
        valuation_estimate: data.valuation_estimate ?? "",
        runway_estimate: data.runway_estimate ?? "",
        risk_level: data.risk_level ?? "medium",
        tokenomics: data.tokenomics as AnalysisExportData["tokenomics"],
        scenarios: data.scenarios as AnalysisExportData["scenarios"],
        risk_factors: data.risk_factors as string[],
        recommendations: data.recommendations as string[],
        created_at: data.created_at ?? null,
      };
      if (type === "pdf") await exportPDF(exportData);
      else if (type === "pptx") await exportPPTX(exportData);
      else await exportDOCX(exportData);
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-card/40 animate-pulse border border-border/40"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="border border-destructive/50 bg-destructive/10 p-6 font-mono text-destructive text-sm">
          ERRO: Análise não encontrada ou falha ao carregar.
        </div>
        <Link
          href="/history"
          className="mt-4 inline-flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> RETORNAR AO LEDGER
        </Link>
      </div>
    );
  }

  const tokenomics = data.tokenomics as Tokenomics;
  const scenarios = data.scenarios as Scenario[];
  const riskFactors = data.risk_factors as string[];
  const recommendations = data.recommendations as string[];
  const riskColor = RISK_COLOR[data.risk_level] ?? "#FFB300";

  const pieData = Object.entries(tokenomics.distribution).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: parseFloat(val),
  }));

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 carbon-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 py-10 max-w-5xl">
        {/* Back link */}
        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-mono text-xs uppercase tracking-wider mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> LEDGER
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1
                className="text-3xl md:text-5xl font-black uppercase tracking-tighter gold-gradient-text"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {data.startup_name}
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono bg-primary/10 border border-primary/30 text-primary uppercase tracking-wider">
                {data.sector}
              </span>
              <span className="px-2 py-0.5 text-xs font-mono bg-secondary border border-border text-muted-foreground uppercase tracking-wider">
                {data.stage}
              </span>
            </div>
            <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
              RELATÓRIO &nbsp;// &nbsp;
              {data.created_at ? format(new Date(data.created_at), "yyyy-MM-dd HH:mm") : ""}{" "}
              &nbsp;// &nbsp; ID:{String(data.id ?? 0).padStart(4, "0")}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {/* Export toolbar */}
            <div className="flex items-center gap-1 border border-border/60 bg-card/60 p-1">
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest px-2 border-r border-border/60 mr-1">
                EXPORTAR
              </span>
              {(
                [
                  { type: "pdf" as const, label: "PDF", icon: FileDown, color: "text-amber-400" },
                  { type: "pptx" as const, label: "PPT", icon: Presentation, color: "text-orange-400" },
                  { type: "docx" as const, label: "WORD", icon: FileText, color: "text-yellow-400" },
                ] as const
              ).map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => handleExport(type)}
                  disabled={!!exporting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all
                    ${exporting === type
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {exporting === type ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Icon className={`w-3 h-3 ${color}`} />
                  )}
                  {exporting === type ? "..." : label}
                </button>
              ))}
            </div>
            <Link href="/analyze">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10 font-mono text-xs uppercase tracking-wider"
              >
                <Terminal className="mr-2 w-3.5 h-3.5" />
                NOVA ANÁLISE
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 mb-8">
          {[
            { label: "VALUATION EST.", value: data.valuation_estimate, icon: TrendingUp, color: "#FFB300" },
            { label: "RUNWAY", value: data.runway_estimate, icon: Clock, color: "#FFC107" },
            { label: "RISCO", value: (data.risk_level ?? "").toUpperCase(), icon: ShieldAlert, color: riskColor },
            { label: "TOKEN SUPPLY", value: tokenomics.total_supply, icon: Coins, color: "#FF9100" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card p-5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: color, opacity: 0.6 }} />
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  {label}
                </span>
              </div>
              <p
                className="font-mono text-base font-black leading-tight break-words"
                style={{ color, fontFamily: "Orbitron, sans-serif" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Funding Strategy + Revenue Model */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <Card className={CARD_STYLE}>
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">
                  ESTRATÉGIA DE FUNDING
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="font-sans text-sm text-foreground/85 leading-relaxed">
                  {data.funding_strategy}
                </p>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className={`${CARD_STYLE} h-full`}>
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">
                  MODELO DE RECEITA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="font-sans text-sm text-foreground/85 leading-relaxed">
                  {data.revenue_model}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tokenomics */}
        <Card className={`${CARD_STYLE} mb-4`}>
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <Coins className="w-4 h-4" />
              ESTRUTURA DE TOKENOMICS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                  DISTRIBUIÇÃO — {tokenomics.total_supply} SUPPLY TOTAL
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          opacity={0.9}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, ""]}
                      contentStyle={{
                        background: "#1A1A1A",
                        border: "1px solid rgba(255,179,0,0.3)",
                        borderRadius: 0,
                        fontFamily: "Orbitron, sans-serif",
                        fontSize: "11px",
                        color: "#EDEDED",
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span
                          style={{
                            fontFamily: "Orbitron, sans-serif",
                            fontSize: "9px",
                            color: "#EDEDED",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                    ALOCAÇÃO
                  </p>
                  <div className="space-y-2">
                    {Object.entries(tokenomics.distribution).map(([key, val], i) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2 h-2 flex-shrink-0"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {key}
                          </span>
                        </div>
                        <span
                          className="font-mono font-black text-sm"
                          style={{
                            color: PIE_COLORS[i % PIE_COLORS.length],
                            fontFamily: "Orbitron, sans-serif",
                          }}
                        >
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                    UTILIDADE DO TOKEN
                  </p>
                  <p className="font-sans text-xs text-foreground/80 leading-relaxed">
                    {tokenomics.token_utility}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border/40 pt-5">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                CRONOGRAMA DE VESTING
              </p>
              <p className="font-sans text-sm text-foreground/80 leading-relaxed">
                {tokenomics.vesting_schedule}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scenarios */}
        <Card className={`${CARD_STYLE} mb-4`}>
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">
              CENÁRIOS DE CAPTAÇÃO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40">
              {scenarios.map((scenario) => {
                const color =
                  SCENARIO_COLORS[scenario.name as keyof typeof SCENARIO_COLORS] ?? "#FFB300";
                return (
                  <div key={scenario.name} className="bg-card p-5 relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ background: color }}
                    />
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="font-mono text-xs font-black uppercase tracking-widest"
                        style={{ color, fontFamily: "Orbitron, sans-serif" }}
                      >
                        {scenario.name}
                      </span>
                      <span className="font-mono text-[10px] bg-secondary px-2 py-0.5 text-muted-foreground uppercase">
                        {scenario.probability}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {[
                        ["CAPTAÇÃO", scenario.target_raise],
                        ["VALUATION", scenario.valuation],
                        ["PRAZO", scenario.timeline],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                            {k}
                          </p>
                          <p
                            className="font-mono text-sm font-bold text-foreground mt-0.5"
                            style={{ fontFamily: "Orbitron, sans-serif" }}
                          >
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risk + Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={CARD_STYLE}>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="font-mono text-[10px] text-destructive uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                VETORES DE RISCO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {riskFactors.map((risk, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-destructive/50 mt-0.5 flex-shrink-0 font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="font-sans text-sm text-foreground/80 leading-relaxed">{risk}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className={CARD_STYLE}>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5" />
                RECOMENDAÇÕES
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="font-mono text-[10px] font-bold mt-0.5 flex-shrink-0"
                      style={{ color: "#FFB300" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
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
