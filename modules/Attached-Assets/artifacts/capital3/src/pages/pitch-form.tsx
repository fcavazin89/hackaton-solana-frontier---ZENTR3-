import { useState } from "react";
import { useLocation } from "wouter";
import { useBuildPitch } from "@workspace/api-client-react";
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
import { Presentation, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const STAGES = ["idea", "pre-seed", "seed", "series-a", "growth"] as const;
const INPUT_CLASS = "border-border/50 bg-card/60 font-sans focus:border-primary/60 transition-colors";

export default function PitchForm() {
  const [, navigate] = useLocation();
  const { mutate, isPending, error } = useBuildPitch();

  const [form, setForm] = useState({
    startup_name: "",
    sector: "",
    stage: "" as (typeof STAGES)[number] | "",
    problem: "",
    solution: "",
    market_size: "",
    secret_sauce: "",
    team_description: "",
    funding_ask: "",
    traction: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stage) return;
    mutate(
      { data: { ...form, stage: form.stage as (typeof STAGES)[number], traction: form.traction || undefined } },
      { onSuccess: (data) => navigate(`/pitch/results/${data.id}`) }
    );
  };

  const isValid = form.startup_name && form.sector && form.stage && form.problem && form.solution && form.market_size && form.secret_sauce && form.team_description && form.funding_ask;

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-[0.3em] mb-5">
            <Presentation className="w-3 h-3" />
            PITCH BUILDER // TERMINAL DE INPUT
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter gold-gradient-text mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Pitch Builder
          </h1>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">
            Gere um pitch deck completo com 10 seções narrativas prontas para apresentação. Baseado
            no framework InovAtiva Brasil adaptado para sua startup.
          </p>
        </div>

        {isPending && (
          <div className="mb-8 border border-primary/40 bg-primary/5 p-6 relative overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-3 text-primary mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs uppercase tracking-[0.25em]" style={{ fontFamily: "Orbitron, sans-serif" }}>CONSTRUINDO SEU PITCH DECK</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
                {["Estruturando narrativa do problema...", "Dimensionando tamanho de mercado...", "Elaborando estratégia go-to-market...", "Montando round de investimento..."].map((line, i) => (
                  <p key={i} className="text-primary/70">&gt; {line}{i === 3 && <span className="animate-pulse">_</span>}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <span className="text-destructive uppercase tracking-wider">ERRO: Build do pitch falhou. Tente novamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[01] IDENTIDADE</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome *</Label>
                  <Input value={form.startup_name} onChange={(e) => setForm(f => ({ ...f, startup_name: e.target.value }))} placeholder="Nome da startup" className={INPUT_CLASS} required disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Setor *</Label>
                  <Input value={form.sector} onChange={(e) => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="ex: HealthTech" className={INPUT_CLASS} required disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Estágio *</Label>
                  <Select value={form.stage} onValueChange={(v) => setForm(f => ({ ...f, stage: v as (typeof STAGES)[number] }))} disabled={isPending}>
                    <SelectTrigger className={`${INPUT_CLASS} font-mono text-xs`}><SelectValue placeholder="Estágio" /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s} value={s} className="font-mono text-xs uppercase">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[02] PROBLEMA E SOLUÇÃO</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Problema *</Label>
                <Textarea value={form.problem} onChange={(e) => setForm(f => ({ ...f, problem: e.target.value }))} placeholder="Qual problema você resolve? Quem sofre com ele?" className={`${INPUT_CLASS} resize-none`} rows={2} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Solução *</Label>
                <Textarea value={form.solution} onChange={(e) => setForm(f => ({ ...f, solution: e.target.value }))} placeholder="Como você resolve esse problema?" className={`${INPUT_CLASS} resize-none`} rows={2} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tamanho de Mercado *</Label>
                <Input value={form.market_size} onChange={(e) => setForm(f => ({ ...f, market_size: e.target.value }))} placeholder="ex: Mercado global de $45B, SAM de $2B no Brasil" className={INPUT_CLASS} required disabled={isPending} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[03] DIFERENCIAL E TIME</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Secret Sauce / Diferencial *</Label>
                <Textarea value={form.secret_sauce} onChange={(e) => setForm(f => ({ ...f, secret_sauce: e.target.value }))} placeholder="O que torna sua solução única? Por que vocês vencerão?" className={`${INPUT_CLASS} resize-none`} rows={2} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Descrição do Time *</Label>
                <Textarea value={form.team_description} onChange={(e) => setForm(f => ({ ...f, team_description: e.target.value }))} placeholder="Quem são os founders? Experiências relevantes? Por que esse time?" className={`${INPUT_CLASS} resize-none`} rows={2} required disabled={isPending} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[04] CAPTAÇÃO E TRAÇÃO</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pedido de Captação *</Label>
                <Input value={form.funding_ask} onChange={(e) => setForm(f => ({ ...f, funding_ask: e.target.value }))} placeholder="ex: $500K seed para 18 meses de runway" className={INPUT_CLASS} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tração Atual <span className="normal-case font-normal">(opcional)</span></Label>
                <Input value={form.traction} onChange={(e) => setForm(f => ({ ...f, traction: e.target.value }))} placeholder="ex: 200 usuários beta, $15K MRR, 3 contratos assinados" className={INPUT_CLASS} disabled={isPending} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={!isValid || isPending} className="w-full h-14 font-mono text-sm tracking-widest gold-gradient-bg text-black hover:opacity-90 transition-opacity disabled:opacity-30 font-bold uppercase">
            {isPending ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />BUILDANDO...</> : <><Presentation className="mr-2 w-5 h-5" />BUILD PITCH DECK<ChevronRight className="ml-2 w-5 h-5" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
