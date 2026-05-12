import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Globe, Lock, Copy, Check, ChevronRight, Zap, Eye, Key, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function generateDeterministicAddress(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const part2 = Math.abs(hash * 31).toString(16).padStart(8, "0");
  const part3 = Math.abs(hash * 17).toString(16).padStart(8, "0");
  const part4 = Math.abs(hash * 7).toString(16).padStart(8, "0");
  const part5 = Math.abs(hash * 3).toString(16).padStart(12, "0");
  return `0x${hex}${part2}${part3}${part4}${part5}`.slice(0, 42);
}

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem("forge3_session_id");
  if (!id) {
    id = `forge3_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem("forge3_session_id", id);
  }
  return id;
}

const FEATURES = [
  {
    icon: Globe,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    title: "Login Social",
    desc: "E-mail, Google, Apple, Discord — sem seed phrase. O usuário não sabe que tem uma blockchain por baixo.",
    tech: "Privy · Dynamic",
  },
  {
    icon: Shield,
    color: "text-secondary",
    bg: "bg-secondary/10 border-secondary/20",
    title: "Smart Account ERC-4337",
    desc: "Conta programável. Você define as regras: gasless transactions, recuperação social, permissões por app.",
    tech: "Account Abstraction · EIP-4337",
  },
  {
    icon: Lock,
    color: "text-chart-4",
    bg: "bg-chart-4/10 border-chart-4/20",
    title: "Tesouraria Multi-sig",
    desc: "Safe (Gnosis) protege o dinheiro da startup. Nenhuma transação passa sem múltiplas assinaturas dos fundadores.",
    tech: "Safe · Gnosis Protocol",
  },
  {
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    title: "Gasless Transactions",
    desc: "O usuário nunca paga gas. Um Paymaster cobre as taxas — você decide quando e como cobrar de outra forma.",
    tech: "ERC-4337 Paymaster · Base",
  },
];

const ERC4337_FLOW = [
  { step: "01", label: "Login", desc: "Usuário entra com Google/e-mail via Privy ou Dynamic" },
  { step: "02", label: "Account criada", desc: "Smart Account ERC-4337 gerada automaticamente no backend" },
  { step: "03", label: "UserOperation", desc: "Ação do usuário vira uma UserOp assinada pela conta" },
  { step: "04", label: "Bundler", desc: "Bundler agrega UserOps e submete on-chain em batch" },
  { step: "05", label: "Paymaster", desc: "Paymaster paga o gas — usuário não precisa de ETH" },
  { step: "06", label: "EntryPoint", desc: "Contrato EntryPoint valida e executa a transação" },
];

export default function SmartAccount() {
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [safeAddress, setSafeAddress] = useState("");
  const [copied, setCopied] = useState<"address" | "safe" | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    setAddress(generateDeterministicAddress(sessionId));
    setSafeAddress(generateDeterministicAddress(sessionId + "_safe"));
  }, []);

  const handleCopy = async (text: string, type: "address" | "safe") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Endereço copiado!", description: "Este é o endereço da sua Smart Account de demonstração." });
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 md:p-12 space-y-12">

      {/* Header */}
      <section className="space-y-4 max-w-3xl">
        <Badge variant="outline" className="font-mono bg-background text-secondary border-secondary/30 uppercase tracking-widest">
          Smart Account · ERC-4337
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold">
          Identidade <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">Blockchain</span>
        </h1>
        <p className="text-lg text-muted-foreground font-mono leading-relaxed">
          O "3" do seu FORGE3 é a chave. Cada startup nasce com uma Smart Account — login com e-mail,
          carteira por baixo, tesouraria multi-sig protegida pelo Safe.
        </p>
      </section>

      {/* Demo Account */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-3">
          <span className="h-px w-6 bg-secondary/50" />
          Sua Account de Demonstração
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/40 border-secondary/20 shadow-[0_0_30px_rgba(34,211,238,0.06)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-secondary" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-secondary">Smart Account</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-secondary/10 text-secondary border-secondary/20">ERC-4337</Badge>
              </div>
              <CardDescription className="text-xs font-mono">Base Sepolia · Endereço de demo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-background/60 border border-border/50 rounded-lg p-3 flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-foreground/80 truncate">
                  {revealed ? address : `${address.slice(0, 10)}${"•".repeat(24)}${address.slice(-6)}`}
                </code>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevealed(!revealed)} data-testid="btn-toggle-address">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(address, "address")} data-testid="btn-copy-address">
                    {copied === "address" ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Gasless", "Recuperação social", "Permissões por app"].map(tag => (
                  <span key={tag} className="text-[10px] font-mono bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-primary/20 shadow-[0_0_30px_rgba(251,146,60,0.06)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-primary">Safe Multi-sig</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">Gnosis</Badge>
              </div>
              <CardDescription className="text-xs font-mono">Tesouraria da startup · 2 de 3 assinaturas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-background/60 border border-border/50 rounded-lg p-3 flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-foreground/80 truncate">{safeAddress.slice(0, 10)}...{safeAddress.slice(-8)}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy(safeAddress, "safe")} data-testid="btn-copy-safe">
                  {copied === "safe" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["2 de 3 assinaturas", "Recuperação", "On-chain"].map(tag => (
                  <span key={tag} className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card/20 border border-border/30 rounded-xl p-4">
          <p className="text-xs font-mono text-muted-foreground">
            <span className="text-primary font-bold">Demo mode:</span> Endereços gerados localmente para visualização. Para produção,
            integre com <a href="https://privy.io" target="_blank" rel="noopener noreferrer" className="text-secondary underline">Privy</a> ou{" "}
            <a href="https://dynamic.xyz" target="_blank" rel="noopener noreferrer" className="text-secondary underline">Dynamic</a> e crie Smart Accounts reais na Base ou Polygon.
          </p>
        </div>
      </section>

      {/* ERC-4337 Flow */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-widest flex items-center gap-3">
          <span className="h-px w-8 bg-secondary/50" />
          Como Funciona (ERC-4337)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ERC4337_FLOW.map((item, idx) => (
            <div key={item.step} className="relative bg-card/30 border border-border/50 rounded-xl p-4 hover:border-secondary/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-secondary/60 font-bold shrink-0 mt-0.5">{item.step}</span>
                <div>
                  <p className="font-mono text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
              {idx < ERC4337_FLOW.length - 1 && (
                <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-border hidden lg:block z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-widest flex items-center gap-3">
          <span className="h-px w-8 bg-primary/50" />
          Funcionalidades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card key={feat.title} className="bg-card/30 border-border/50 hover:border-muted/50 transition-colors">
                <CardContent className="p-6 flex gap-4">
                  <div className={`p-3 rounded-xl border ${feat.bg} shrink-0 h-fit`}>
                    <Icon className={`h-5 w-5 ${feat.color}`} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-mono font-bold text-sm text-foreground">{feat.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                    <p className={`text-[10px] font-mono uppercase tracking-wider ${feat.color}`}>{feat.tech}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-secondary/10 via-card/30 to-primary/10 border border-secondary/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="font-mono font-bold text-lg text-foreground">Pronto para produção?</p>
          <p className="text-sm text-muted-foreground">Integre Privy ou Dynamic em minutos. Dockers e SDKs disponíveis.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a href="https://docs.privy.io" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="font-mono uppercase text-xs">Privy Docs</Button>
          </a>
          <a href="https://docs.dynamic.xyz" target="_blank" rel="noopener noreferrer">
            <Button className="font-mono uppercase text-xs bg-secondary/90 hover:bg-secondary text-secondary-foreground">Dynamic Docs</Button>
          </a>
        </div>
      </section>

    </div>
  );
}
