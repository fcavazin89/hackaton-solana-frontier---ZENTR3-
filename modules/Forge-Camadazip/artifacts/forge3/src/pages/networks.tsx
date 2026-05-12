import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Zap, Shield, Clock, DollarSign, TrendingUp } from "lucide-react";

const NETWORKS = [
  {
    name: "Base",
    logo: "🔵",
    tagline: "Ethereum L2 da Coinbase",
    badge: "Recomendado",
    badgeClass: "bg-secondary/10 text-secondary border-secondary/20",
    cardClass: "border-secondary/30 shadow-[0_0_30px_rgba(34,211,238,0.08)]",
    chain: "8453",
    gasAvg: "$0.0003",
    tps: "~2000",
    finality: "~2 seg",
    security: "Ethereum (Optimistic Rollup)",
    ecosystem: "Coinbase · Uniswap · Aave · OpenSea",
    pros: ["Gas mais barato da classe", "Suporte nativo da Coinbase", "Crescimento explosivo 2024", "EVM 100% compatível"],
    cons: ["Janela de contestação 7 dias", "Centralização inicial do sequencer"],
    useCase: "Token de startup, NFT de produto, DAO governance",
    color: "text-secondary",
  },
  {
    name: "Polygon",
    logo: "🟣",
    tagline: "Sidechain EVM consolidada",
    badge: "Estável",
    badgeClass: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    cardClass: "border-chart-4/30 shadow-[0_0_30px_rgba(168,85,247,0.08)]",
    chain: "137",
    gasAvg: "$0.001",
    tps: "~7000",
    finality: "~2.3 seg",
    security: "Validadores próprios + checkpoints Ethereum",
    ecosystem: "Disney · Nike · Reddit · Starbucks",
    pros: ["5+ anos de track record", "Adoção corporativa massiva", "POL (staking nativo)", "zkEVM disponível"],
    cons: ["Sidechain (não rollup puro)", "Gas em MATIC (não ETH)"],
    useCase: "NFT de colecionável, gaming, loyalty programs",
    color: "text-chart-4",
  },
  {
    name: "Optimism",
    logo: "🔴",
    tagline: "Ethereum Optimistic Rollup original",
    badge: "OP Stack",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    cardClass: "border-border/50",
    chain: "10",
    gasAvg: "$0.001",
    tps: "~2000",
    finality: "~2 seg",
    security: "Ethereum (Optimistic Rollup)",
    ecosystem: "Synthetix · Velodrome · Base usa OP Stack",
    pros: ["Fundação sólida (OP Stack)", "Retroactive Public Goods Funding", "Superchain vision"],
    cons: ["Menor TVL que Base/Polygon", "Janela contestação 7 dias"],
    useCase: "DeFi, public goods, projetos open source",
    color: "text-destructive",
  },
  {
    name: "Arbitrum",
    logo: "⚡",
    tagline: "L2 com maior TVL DeFi",
    badge: "DeFi Hub",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    cardClass: "border-border/50",
    chain: "42161",
    gasAvg: "$0.002",
    tps: "~4000",
    finality: "~2.6 seg",
    security: "Ethereum (Optimistic Rollup + Nitro)",
    ecosystem: "GMX · Uniswap · Aave · Camelot",
    pros: ["Maior TVL de qualquer L2", "Nitro = alta performance", "Stylus (Rust/C++ contratos)"],
    cons: ["Gas levemente mais caro", "ARB token centralizado no início"],
    useCase: "DeFi avançado, perp trading, yield farming",
    color: "text-primary",
  },
];

const COMPARISON_ROWS = [
  { label: "Gas médio", key: "gasAvg", icon: DollarSign },
  { label: "TPS", key: "tps", icon: TrendingUp },
  { label: "Finalidade", key: "finality", icon: Clock },
  { label: "Segurança", key: "security", icon: Shield },
];

export default function Networks() {
  return (
    <div className="container max-w-6xl mx-auto p-6 md:p-12 space-y-12">

      {/* Header */}
      <section className="space-y-4 max-w-3xl">
        <Badge variant="outline" className="font-mono bg-background text-chart-4 border-chart-4/30 uppercase tracking-widest">
          Layer 2 Networks
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold">
          Ninguém paga <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-4">$50 de gas</span>
          <br />para validar uma ideia.
        </h1>
        <p className="text-lg text-muted-foreground font-mono leading-relaxed">
          Layer 2s entregam a segurança do Ethereum com custo de centavos.
          Foco em Base e Polygon para projetos novos — velocidade, custo e ecossistema.
        </p>
      </section>

      {/* Quick comparison bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gas em Base", value: "$0.0003", sub: "por transação" },
          { label: "Gas em Polygon", value: "$0.001", sub: "por transação" },
          { label: "Economia vs Ethereum", value: "99%+", sub: "mais barato" },
          { label: "Segurança", value: "Ethereum", sub: "como base" },
        ].map((s) => (
          <div key={s.label} className="bg-card/40 border border-border/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary font-mono">{s.value}</p>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-0.5">{s.sub}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Network Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-widest flex items-center gap-3">
          <span className="h-px w-8 bg-chart-4/50" />
          Redes Disponíveis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {NETWORKS.map((net) => (
            <Card key={net.name} className={`bg-card/30 backdrop-blur transition-all ${net.cardClass}`}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{net.logo}</span>
                    <div>
                      <CardTitle className="text-xl">{net.name}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{net.tagline}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`font-mono text-xs uppercase shrink-0 ${net.badgeClass}`}>{net.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: DollarSign, label: "Gas médio", value: net.gasAvg },
                    { icon: TrendingUp, label: "TPS", value: net.tps },
                    { icon: Clock, label: "Finalidade", value: net.finality },
                    { icon: Layers, label: "Chain ID", value: net.chain },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-background/40 border border-border/30 rounded-lg p-3 flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${net.color}`} />
                      <div>
                        <p className={`text-sm font-mono font-bold ${net.color}`}>{value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pros */}
                <div className="space-y-1.5">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Vantagens</p>
                  <ul className="space-y-1">
                    {net.pros.map((pro) => (
                      <li key={pro} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Zap className={`h-3 w-3 mt-0.5 shrink-0 ${net.color}`} />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Use case */}
                <div className="bg-background/30 border border-border/30 rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Ideal para</p>
                  <p className="text-sm text-foreground">{net.useCase}</p>
                </div>

                {/* Ecosystem */}
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Ecossistema: {net.ecosystem}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Decision Guide */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-widest flex items-center gap-3">
          <span className="h-px w-8 bg-primary/50" />
          Qual rede escolher?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Startup em fase inicial",
              rec: "Base Sepolia (testnet)",
              reason: "Gas grátis para testar. Migra para Base mainnet quando validar o produto.",
              color: "border-secondary/30 bg-secondary/5",
              badge: "text-secondary",
            },
            {
              title: "Token ou NFT de produto",
              rec: "Base ou Polygon",
              reason: "Ecossistema robusto, gas barato, e carteiras como Coinbase Wallet integradas nativamente.",
              color: "border-primary/30 bg-primary/5",
              badge: "text-primary",
            },
            {
              title: "DeFi ou DAO governance",
              rec: "Polygon ou Arbitrum",
              reason: "TVL consolidado, ferramentas DeFi maduras, e comunidade técnica ativa.",
              color: "border-chart-4/30 bg-chart-4/5",
              badge: "text-chart-4",
            },
          ].map((item) => (
            <div key={item.title} className={`border rounded-xl p-5 space-y-3 ${item.color}`}>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{item.title}</p>
              <p className={`font-mono font-bold text-base ${item.badge}`}>{item.rec}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
