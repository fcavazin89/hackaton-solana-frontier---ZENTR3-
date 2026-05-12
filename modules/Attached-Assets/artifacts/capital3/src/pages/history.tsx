import { useState } from "react";
import { Link } from "wouter";
import { useListAnalyses, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, Search, ArrowRight, Terminal } from "lucide-react";
import { format } from "date-fns";

const RISK_COLOR: Record<string, string> = {
  low: "#FFB300",
  medium: "#FF9100",
  high: "#ef4444",
  "very-high": "#dc2626",
};

export default function History() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const { data, isLoading } = useListAnalyses(
    { limit: 100 },
    { query: { queryKey: getListAnalysesQueryKey({ limit: 100 }) } }
  );

  const filtered = (data?.analyses ?? []).filter((a) => {
    const matchSearch =
      !search ||
      a.startup_name.toLowerCase().includes(search.toLowerCase()) ||
      a.sector.toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === "all" || a.sector === sector;
    const matchRisk = riskFilter === "all" || a.risk_level === riskFilter;
    return matchSearch && matchSector && matchRisk;
  });

  const sectors = Array.from(new Set((data?.analyses ?? []).map((a) => a.sector)));

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-[0.3em] mb-5">
            <span className="w-1.5 h-1.5 bg-primary" />
            ANALYSIS LEDGER
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1
              className="text-4xl font-black uppercase tracking-tighter gold-gradient-text"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Histórico
            </h1>
            <Link href="/analyze">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 gold-gradient-bg text-black font-mono text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-opacity">
                <Terminal className="w-3.5 h-3.5" />
                NOVA ANÁLISE
              </button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar startups..."
              className="pl-9 border-border/50 bg-card/60 font-sans focus:border-primary/50 transition-colors"
            />
          </div>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="border-border/50 bg-card/60 font-mono text-xs w-44 focus:border-primary/50">
              <SelectValue placeholder="Todos os Setores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-xs">TODOS OS SETORES</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s} className="font-mono text-xs">
                  {s.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="border-border/50 bg-card/60 font-mono text-xs w-44 focus:border-primary/50">
              <SelectValue placeholder="Todo Risco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-xs">TODO RISCO</SelectItem>
              {["low", "medium", "high", "very-high"].map((r) => (
                <SelectItem key={r} value={r} className="font-mono text-xs">
                  {r.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4 border-b border-border/30 pb-3">
          {filtered.length} REGISTRO{filtered.length !== 1 ? "S" : ""} ENCONTRADO{filtered.length !== 1 ? "S" : ""}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-card/40 animate-pulse border border-border/40"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-border/40 p-16 text-center carbon-grid">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              NENHUM REGISTRO ENCONTRADO
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((analysis) => (
              <Link key={analysis.id} href={`/results/${analysis.id}`}>
                <Card className="border-border/40 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="w-8 h-8 gold-gradient-bg flex items-center justify-center font-black text-black text-[10px] flex-shrink-0"
                          style={{ fontFamily: "Orbitron, sans-serif" }}
                        >
                          {String(analysis.id ?? 0).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <h3
                            className="font-black text-sm text-foreground group-hover:text-primary transition-colors uppercase tracking-wide truncate"
                            style={{ fontFamily: "Orbitron, sans-serif" }}
                          >
                            {analysis.startup_name}
                          </h3>
                          <p className="font-mono text-xs text-muted-foreground mt-0.5">
                            {analysis.stage.toUpperCase()} &nbsp;·&nbsp; {analysis.valuation_estimate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider hidden sm:inline">
                          {analysis.sector}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert
                            className="w-3.5 h-3.5"
                            style={{ color: RISK_COLOR[analysis.risk_level] ?? "#FFB300" }}
                          />
                          <span
                            className="font-mono text-xs uppercase tracking-wider"
                            style={{ color: RISK_COLOR[analysis.risk_level] ?? "#FFB300" }}
                          >
                            {analysis.risk_level}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground hidden md:inline">
                          {analysis.created_at
                            ? format(new Date(analysis.created_at), "yyyy-MM-dd")
                            : ""}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
