import { useState } from "react";
import { useLocation } from "wouter";
import { useValidateMvp } from "@workspace/api-client-react";
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
import { FlaskConical, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const STAGES = ["idea", "pre-seed", "seed", "series-a", "growth"] as const;
const INPUT_CLASS = "border-border/50 bg-card/60 font-sans focus:border-primary/60 transition-colors";

export default function MvpForm() {
  const [, navigate] = useLocation();
  const { mutate, isPending, error } = useValidateMvp();

  const [form, setForm] = useState({
    startup_name: "",
    description: "",
    stage: "" as (typeof STAGES)[number] | "",
    problem_statement: "",
    proposed_mvp: "",
    target_audience: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stage) return;
    mutate(
      { data: { ...form, stage: form.stage as (typeof STAGES)[number] } },
      { onSuccess: (data) => navigate(`/mvp/results/${data.id}`) }
    );
  };

  const isValid = Object.values(form).every((v) => v.trim() !== "");

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-[0.3em] mb-5">
            <FlaskConical className="w-3 h-3" />
            MVP VALIDATOR // TERMINAL DE INPUT
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter gold-gradient-text mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            MVP Validator
          </h1>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">
            Valide sua estratégia de MVP com o framework StartSe. Avalie Problem-Solution FIT,
            Product-Solution FIT e Product-Market FIT com uma estratégia de validação estruturada.
          </p>
        </div>

        {isPending && (
          <div className="mb-8 border border-primary/40 bg-primary/5 p-6 relative overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-3 text-primary mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs uppercase tracking-[0.25em]" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  MVP VALIDATOR PROCESSANDO
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
                {["Avaliando Problem-Solution FIT...", "Analisando viabilidade do MVP...", "Identificando gaps de validação...", "Gerando estratégia de experimentos..."].map((line, i) => (
                  <p key={i} className="text-primary/70">&gt; {line}{i === 3 && <span className="animate-pulse">_</span>}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <span className="text-destructive uppercase tracking-wider">ERRO: Validação falhou. Tente novamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[01] IDENTIDADE DA STARTUP</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome da Startup *</Label>
                  <Input value={form.startup_name} onChange={(e) => setForm(f => ({ ...f, startup_name: e.target.value }))} placeholder="ex: MeuApp" className={INPUT_CLASS} required disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Estágio *</Label>
                  <Select value={form.stage} onValueChange={(v) => setForm(f => ({ ...f, stage: v as (typeof STAGES)[number] }))} disabled={isPending}>
                    <SelectTrigger className={`${INPUT_CLASS} font-mono text-xs`}><SelectValue placeholder="Selecionar estágio" /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s} value={s} className="font-mono text-xs uppercase">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Descrição da Startup *</Label>
                <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="O que sua startup faz e qual problema resolve..." className={`${INPUT_CLASS} resize-none`} rows={2} required disabled={isPending} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[02] DEFINIÇÃO DO PROBLEMA E MVP</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Declaração do Problema *</Label>
                <Textarea value={form.problem_statement} onChange={(e) => setForm(f => ({ ...f, problem_statement: e.target.value }))} placeholder="Qual é o problema específico que você está resolvendo? Quem sofre com ele? Qual é o custo desse problema?" className={`${INPUT_CLASS} resize-none`} rows={3} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">MVP Proposto *</Label>
                <Textarea value={form.proposed_mvp} onChange={(e) => setForm(f => ({ ...f, proposed_mvp: e.target.value }))} placeholder="Descreva seu MVP — o que ele faz, quais funcionalidades tem, como entrega valor..." className={`${INPUT_CLASS} resize-none`} rows={3} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Público-Alvo *</Label>
                <Input value={form.target_audience} onChange={(e) => setForm(f => ({ ...f, target_audience: e.target.value }))} placeholder="ex: PMEs de varejo com 10-50 funcionários" className={INPUT_CLASS} required disabled={isPending} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={!isValid || isPending} className="w-full h-14 font-mono text-sm tracking-widest gold-gradient-bg text-black hover:opacity-90 transition-opacity disabled:opacity-30 font-bold uppercase">
            {isPending ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />VALIDANDO...</> : <><FlaskConical className="mr-2 w-5 h-5" />VALIDAR MVP<ChevronRight className="ml-2 w-5 h-5" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
