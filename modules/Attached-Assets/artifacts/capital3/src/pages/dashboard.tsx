import { Link } from "wouter";
import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Database, TrendingUp, Clock, Terminal } from "lucide-react";

/* Gold → Amber → Orange → Deep Orange → Red-Orange → burnt */
const BAR_COLORS = ["#FFB300", "#FFC107", "#FF9100", "#FF6D00", "#E65100", "#BF360C"];

const RISK_COLORS: Record<string, string> = {
  low: "#FFB300",
  medium: "#FF9100",
  high: "#ef4444",
  "very-high": "#dc2626",
};

const CHART_STYLE = {
  background: "#111",
  border: "1px solid rgba(255,179,0,0.25)",
  borderRadius: 0,
  fontFamily: "Orbitron, sans-serif",
  fontSize: "11px",
  color: "#EDEDED",
};

const AXIS_TICK = {
  fontFamily: "Orbitron, sans-serif",
  fontSize: 8,
  fill: "rgba(237,237,237,0.4)",
  textTransform: "uppercase" as const,
};

function StatCard({
  label,
  value,
  icon: Icon,
  color = "#FFB300",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="bg-card p-5 relative overflow-hidden group hover:bg-card/80 transition-colors">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: color, opacity: 0.7 }} />
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
          {label}
        </span>
      </div>
      <p
        className="font-black text-3xl leading-none"
        style={{ color, fontFamily: "Orbitron, sans-serif" }}
      >
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });

  const stageData = data
    ? Object.entries(data.by_stage).map(([k, v]) => ({ name: k.toUpperCase(), count: v }))
    : [];
  const sectorData = data
    ? Object.entries(data.by_sector)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ name: k, count: v }))
    : [];
  const riskData = data
    ? Object.entries(data.by_risk_level).map(([k, v]) => ({
        name: k.toUpperCase(),
        count: v,
        color: RISK_COLORS[k] ?? "#FFB300",
      }))
    : [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-card/40 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 bg-card/40 animate-pulse border border-border/40" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = (data?.total_analyses ?? 0) > 0;

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-[0.3em] mb-5">
            <BarChart3 className="w-3 h-3" />
            INTELIGÊNCIA AGREGADA
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1
              className="text-4xl font-black uppercase tracking-tighter gold-gradient-text"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Dashboard
            </h1>
            <Link href="/analyze">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 gold-gradient-bg text-black font-mono text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-opacity">
                <Terminal className="w-3.5 h-3.5" />
                NOVA ANÁLISE
              </button>
            </Link>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50 mb-8">
          <StatCard label="Total Análises" value={data?.total_analyses ?? 0} icon={Database} color="#FFB300" />
          <StatCard
            label="Setores"
            value={Object.keys(data?.by_sector ?? {}).length}
            icon={BarChart3}
            color="#FFC107"
          />
          <StatCard
            label="Runway Médio"
            value={`${data?.avg_runway_months ?? 0}mo`}
            icon={Clock}
            color="#FF9100"
          />
          <StatCard
            label="Stages"
            value={Object.keys(data?.by_stage ?? {}).length}
            icon={TrendingUp}
            color="#FF6D00"
          />
        </div>

        {!hasData ? (
          <div className="border border-dashed border-border/40 p-20 text-center carbon-grid">
            <div
              className="text-4xl font-black gold-gradient-text mb-4"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              C3
            </div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
              NENHUM DADO DISPONÍVEL
            </p>
            <Link
              href="/analyze"
              className="text-primary hover:text-primary/80 font-mono text-xs uppercase tracking-wider transition-colors"
            >
              INICIAR PRIMEIRA ANÁLISE &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Stage */}
            <Card className="border-border/40 bg-card/70">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">
                  ANÁLISES POR ESTÁGIO
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stageData} barSize={20}>
                    <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_STYLE} cursor={{ fill: "rgba(255,179,0,0.05)" }} />
                    <Bar dataKey="count" name="Análises">
                      {stageData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* By Risk */}
            <Card className="border-border/40 bg-card/70">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">
                  DISTRIBUIÇÃO DE RISCO
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={riskData} barSize={28}>
                    <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_STYLE} cursor={{ fill: "rgba(255,179,0,0.05)" }} />
                    <Bar dataKey="count" name="Análises">
                      {riskData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* By Sector */}
            <Card className="border-border/40 bg-card/70 md:col-span-2">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">
                  ANÁLISES POR SETOR
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sectorData} barSize={24}>
                    <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_STYLE} cursor={{ fill: "rgba(255,179,0,0.05)" }} />
                    <Bar dataKey="count" name="Análises">
                      {sectorData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
