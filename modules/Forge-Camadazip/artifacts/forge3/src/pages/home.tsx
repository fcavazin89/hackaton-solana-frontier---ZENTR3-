import { useListAgents, useGetStatsOverview, useCreateConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare, Users, Cpu, ShieldAlert, ArrowRight, Server, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const DOMAIN_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  architecture:            { color: "text-secondary",    bg: "bg-secondary/10",    border: "border-secondary/20",    label: "Arquitetura" },
  "smart-contracts":       { color: "text-primary",      bg: "bg-primary/10",      border: "border-primary/20",      label: "Smart Contracts" },
  infrastructure:          { color: "text-[#7A00FF]",    bg: "bg-[#7A00FF]/10",    border: "border-[#7A00FF]/20",    label: "Infraestrutura" },
  "blockchain-engineering":{ color: "text-cyan-400",     bg: "bg-cyan-400/10",     border: "border-cyan-400/20",     label: "Blockchain" },
  defi:                    { color: "text-emerald-400",  bg: "bg-emerald-400/10",  border: "border-emerald-400/20",  label: "DeFi" },
  economics:               { color: "text-amber-400",    bg: "bg-amber-400/10",    border: "border-amber-400/20",    label: "Economia" },
  econometrics:            { color: "text-blue-400",     bg: "bg-blue-400/10",     border: "border-blue-400/20",     label: "Econometria" },
  "graph-theory":          { color: "text-pink-400",     bg: "bg-pink-400/10",     border: "border-pink-400/20",     label: "Grafos" },
  taxonomy:                { color: "text-orange-300",   bg: "bg-orange-300/10",   border: "border-orange-300/20",   label: "Taxonomia" },
  ontology:                { color: "text-violet-400",   bg: "bg-violet-400/10",   border: "border-violet-400/20",   label: "Ontologia" },
  econophysics:            { color: "text-teal-400",     bg: "bg-teal-400/10",     border: "border-teal-400/20",     label: "Econofísica" },
  "devops-web3":           { color: "text-lime-400",     bg: "bg-lime-400/10",     border: "border-lime-400/20",     label: "DevOps Web3" },
};

function getDomainConfig(domain: string) {
  return DOMAIN_CONFIG[domain] ?? { color: "text-muted-foreground", bg: "bg-muted/10", border: "border-muted/20", label: domain };
}

export default function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: agents, isLoading: loadingAgents } = useListAgents();
  const { data: stats, isLoading: loadingStats } = useGetStatsOverview();

  const createConversation = useCreateConversation();

  const handleStartConversation = (agentId: string) => {
    createConversation.mutate({ data: { agentId } }, {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setLocation(`/chat/${newConv.id}`);
      }
    });
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 md:p-12 space-y-12">

      {/* Hero Section */}
      <section className="space-y-5 max-w-3xl">
        <Badge variant="outline" className="font-mono bg-background text-primary border-primary/30 uppercase tracking-widest">
          Forge3 Engineering Protocol
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-display leading-tight">
          Understand your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-secondary">
            infrastructure.
          </span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Agentes A2G de alta precisão. Da arquitetura ao smart contract, FORGE3 conecta fundadores não-técnicos a sistemas de engenharia complexos.
        </p>
        <p className="font-mono text-xs text-primary/60 uppercase tracking-[0.3em]">
          Engenharia · Construção · Execução
        </p>
      </section>

      {/* Stats Overview */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Operações</p>
              {loadingStats ? <Skeleton className="h-7 w-12 mt-1" /> : (
                <p className="text-2xl font-bold font-display text-primary">{stats?.totalConversations || 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-secondary/10 rounded-lg text-secondary shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Mensagens</p>
              {loadingStats ? <Skeleton className="h-7 w-12 mt-1" /> : (
                <p className="text-2xl font-bold font-display text-secondary">{stats?.totalMessages || 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-[#7A00FF]/10 rounded-lg text-[#7A00FF] shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Agentes</p>
              <p className="text-2xl font-bold font-display text-[#7A00FF]">{agents?.length ?? 14}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-400/10 rounded-lg text-emerald-400 shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Domínios</p>
              <p className="text-2xl font-bold font-display text-emerald-400">12</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Agents Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-foreground flex items-center gap-3">
            <span className="h-px w-8 bg-primary/50"></span>
            Deployed Agents
          </h2>
          <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
            {loadingAgents ? "..." : `${agents?.length ?? 0} active`}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loadingAgents ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={i} className="bg-card/30 border-border/50 h-52 animate-pulse" />
            ))
          ) : (
            agents?.map(agent => {
              const cfg = getDomainConfig(agent.domain);
              return (
                <Card
                  key={agent.id}
                  className={`bg-card/30 border-border/40 backdrop-blur flex flex-col transition-all duration-200 group hover:border-opacity-60 cursor-pointer`}
                  style={{ "--hover-border": cfg.color } as React.CSSProperties}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2.5 ${cfg.bg} border ${cfg.border} rounded-xl group-hover:scale-110 transition-transform`}>
                        <span className="text-xl leading-none">{agent.icon}</span>
                      </div>
                      <Badge variant="outline" className={`font-mono text-[10px] uppercase px-2 py-0.5 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <CardTitle className={`text-base font-display ${cfg.color}`}>{agent.name}</CardTitle>
                    <CardDescription className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      ID: {agent.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 px-4 pb-2">
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">{agent.description}</p>
                  </CardContent>
                  <div className="p-3 pt-0">
                    <Button
                      className={`w-full font-mono text-xs uppercase tracking-wider h-8 border transition-all ${cfg.border} ${cfg.color} bg-transparent hover:${cfg.bg}`}
                      variant="outline"
                      onClick={() => handleStartConversation(agent.id)}
                      disabled={createConversation.isPending}
                    >
                      Iniciar <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}
