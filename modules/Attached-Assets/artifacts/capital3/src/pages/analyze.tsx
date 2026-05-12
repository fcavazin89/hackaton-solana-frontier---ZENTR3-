import { useState } from "react";
import { useLocation } from "wouter";
import { useAnalyzeStartup } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const STAGES = ["idea", "pre-seed", "seed", "series-a", "growth"] as const;
const SECTORS = [
  "DeFi", "NFT", "GameFi", "Infrastructure", "DAO",
  "Layer 1", "Layer 2", "DEX", "Lending", "Stablecoin",
  "Cross-chain", "Identity", "Data", "Other",
] as const;

const SECTION_TITLE = "font-mono text-[10px] text-primary uppercase tracking-[0.25em]";
const INPUT_CLASS = "border-border/50 bg-card/60 font-sans focus:border-primary/60 transition-colors";

export default function Analyze() {
  const [, navigate] = useLocation();
  const { mutate, isPending, error } = useAnalyzeStartup();

  const [form, setForm] = useState({
    startup_name: "",
    description: "",
    target_audience: "",
    revenue_model: "",
    stage: "" as (typeof STAGES)[number] | "",
    sector: "",
    monthly_burn: "",
    existing_capital: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stage || !form.sector) return;

    mutate(
      {
        data: {
          startup_name: form.startup_name,
          description: form.description,
          target_audience: form.target_audience,
          revenue_model: form.revenue_model,
          stage: form.stage as (typeof STAGES)[number],
          sector: form.sector,
          monthly_burn: form.monthly_burn ? parseFloat(form.monthly_burn) : undefined,
          existing_capital: form.existing_capital ? parseFloat(form.existing_capital) : undefined,
        },
      },
      {
        onSuccess: (data) => {
          navigate(`/results/${data.id}`);
        },
      }
    );
  };

  const isValid =
    form.startup_name && form.description && form.target_audience &&
    form.revenue_model && form.stage && form.sector;

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-[0.3em] mb-5">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
            CAPITAL3 // TERMINAL DE INPUT
          </div>
          <h1
            className="text-4xl font-black uppercase tracking-tighter gold-gradient-text mb-2"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Análise de Startup
          </h1>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">
            Forneça os parâmetros da sua startup. CAPITAL3 irá gerar um blueprint
            financeiro completo incluindo tokenomics, estratégia de funding e avaliação de risco.
          </p>
        </div>

        {/* Processing state */}
        {isPending && (
          <div className="mb-8 border border-primary/40 bg-primary/5 p-6 relative overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-3 text-primary mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span
                  className="text-xs uppercase tracking-[0.25em]"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  CAPITAL3 PROCESSANDO
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
                {[
                  "Inicializando motor de análise financeira...",
                  "Executando simulação de tokenomics...",
                  "Avaliando condições de mercado Web3...",
                  "Gerando blueprint de captação...",
                ].map((line, i) => (
                  <p
                    key={i}
                    className="text-primary/70"
                    style={{ animationDelay: `${i * 300}ms` }}
                  >
                    &gt; {line}
                    {i === 3 && <span className="animate-pulse">_</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <span className="text-destructive uppercase tracking-wider">
              ERRO: Análise falhou. Verifique os inputs e tente novamente.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity */}
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className={SECTION_TITLE}>
                [01] IDENTIDADE DA STARTUP
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Nome da Startup *
                </Label>
                <Input
                  value={form.startup_name}
                  onChange={(e) => setForm((f) => ({ ...f, startup_name: e.target.value }))}
                  placeholder="ex: DeFiChain Labs"
                  className={INPUT_CLASS}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Descrição *
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva a proposta de valor central da sua startup e qual problema ela resolve..."
                  className={`${INPUT_CLASS} resize-none`}
                  rows={3}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Estágio *
                  </Label>
                  <Select
                    value={form.stage}
                    onValueChange={(v) => setForm((f) => ({ ...f, stage: v as (typeof STAGES)[number] }))}
                    disabled={isPending}
                  >
                    <SelectTrigger className={`${INPUT_CLASS} font-mono text-xs`}>
                      <SelectValue placeholder="Selecione o estágio" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s} className="font-mono text-xs uppercase">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Setor *
                  </Label>
                  <Select
                    value={form.sector}
                    onValueChange={(v) => setForm((f) => ({ ...f, sector: v }))}
                    disabled={isPending}
                  >
                    <SelectTrigger className={`${INPUT_CLASS} font-mono text-xs`}>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s} className="font-mono text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Model */}
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className={SECTION_TITLE}>
                [02] MODELO DE NEGÓCIO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Público-Alvo *
                </Label>
                <Input
                  value={form.target_audience}
                  onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value }))}
                  placeholder="ex: DeFi power users e yield farmers"
                  className={INPUT_CLASS}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Modelo de Receita *
                </Label>
                <Input
                  value={form.revenue_model}
                  onChange={(e) => setForm((f) => ({ ...f, revenue_model: e.target.value }))}
                  placeholder="ex: Taxas de protocolo, staking de tokens, assinaturas SaaS"
                  className={INPUT_CLASS}
                  required
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial */}
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className={SECTION_TITLE}>
                [03] PARÂMETROS FINANCEIROS{" "}
                <span className="text-muted-foreground normal-case font-normal">(opcional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Burn Mensal (USD)
                  </Label>
                  <Input
                    type="number"
                    value={form.monthly_burn}
                    onChange={(e) => setForm((f) => ({ ...f, monthly_burn: e.target.value }))}
                    placeholder="ex: 50000"
                    className={INPUT_CLASS}
                    disabled={isPending}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Capital Existente (USD)
                  </Label>
                  <Input
                    type="number"
                    value={form.existing_capital}
                    onChange={(e) => setForm((f) => ({ ...f, existing_capital: e.target.value }))}
                    placeholder="ex: 200000"
                    className={INPUT_CLASS}
                    disabled={isPending}
                    min={0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            disabled={!isValid || isPending}
            className="w-full h-14 font-mono text-sm tracking-widest gold-gradient-bg text-black hover:opacity-90 transition-opacity disabled:opacity-30 font-bold uppercase"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                ANALISANDO...
              </>
            ) : (
              <>
                <Terminal className="mr-2 w-5 h-5" />
                DEPLOY CAPITAL3
                <ChevronRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
