import { useState } from "react";
import { useLocation } from "wouter";
import { useAnalyzeBusinessModel } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const INPUT_CLASS = "border-border/50 bg-card/60 font-sans focus:border-primary/60 transition-colors";

export default function BizModelForm() {
  const [, navigate] = useLocation();
  const { mutate, isPending, error } = useAnalyzeBusinessModel();

  const [form, setForm] = useState({
    startup_name: "",
    description: "",
    sector: "",
    target_audience: "",
    value_proposition: "",
    existing_revenue: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { data: { ...form, existing_revenue: form.existing_revenue || undefined } },
      { onSuccess: (data) => navigate(`/bizmodel/results/${data.id}`) }
    );
  };

  const isValid = form.startup_name && form.description && form.sector && form.target_audience && form.value_proposition;

  return (
    <div className="relative">
      <div className="absolute inset-0 carbon-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-[0.3em] mb-5">
            <BarChart2 className="w-3 h-3" />
            BUSINESS MODEL ARCHITECT // TERMINAL DE INPUT
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter gold-gradient-text mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Business Model
          </h1>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">
            Arquitete o modelo de negócio ideal com base no framework InovAtiva Brasil. Receba análise
            de CAC/LTV, streams de receita, posicionamento competitivo e estratégia de monetização.
          </p>
        </div>

        {isPending && (
          <div className="mb-8 border border-primary/40 bg-primary/5 p-6 relative overflow-hidden">
            <div className="absolute inset-0 carbon-grid opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-3 text-primary mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs uppercase tracking-[0.25em]" style={{ fontFamily: "Orbitron, sans-serif" }}>ARQUITETANDO MODELO DE NEGÓCIO</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
                {["Analisando estrutura de receita...", "Mapeando modelos alternativos...", "Calculando análise CAC/LTV...", "Gerando estratégia de monetização..."].map((line, i) => (
                  <p key={i} className="text-primary/70">&gt; {line}{i === 3 && <span className="animate-pulse">_</span>}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <span className="text-destructive uppercase tracking-wider">ERRO: Análise falhou. Tente novamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[01] PERFIL DA EMPRESA</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome da Startup *</Label>
                  <Input value={form.startup_name} onChange={(e) => setForm(f => ({ ...f, startup_name: e.target.value }))} placeholder="ex: DataFlow" className={INPUT_CLASS} required disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Setor *</Label>
                  <Input value={form.sector} onChange={(e) => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="ex: FinTech, EdTech, SaaS B2B" className={INPUT_CLASS} required disabled={isPending} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Descrição *</Label>
                <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="O que sua startup faz..." className={`${INPUT_CLASS} resize-none`} rows={2} required disabled={isPending} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="font-mono text-[10px] text-primary uppercase tracking-[0.25em]">[02] PROPOSTA DE VALOR E MERCADO</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Público-Alvo *</Label>
                <Input value={form.target_audience} onChange={(e) => setForm(f => ({ ...f, target_audience: e.target.value }))} placeholder="ex: Gestores financeiros de médias empresas" className={INPUT_CLASS} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proposta de Valor *</Label>
                <Textarea value={form.value_proposition} onChange={(e) => setForm(f => ({ ...f, value_proposition: e.target.value }))} placeholder="Qual valor único você entrega? Por que clientes escolhem você?" className={`${INPUT_CLASS} resize-none`} rows={3} required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Modelo de Receita Atual <span className="normal-case font-normal">(opcional)</span></Label>
                <Input value={form.existing_revenue} onChange={(e) => setForm(f => ({ ...f, existing_revenue: e.target.value }))} placeholder="ex: Assinatura mensal, sem receita ainda" className={INPUT_CLASS} disabled={isPending} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={!isValid || isPending} className="w-full h-14 font-mono text-sm tracking-widest gold-gradient-bg text-black hover:opacity-90 transition-opacity disabled:opacity-30 font-bold uppercase">
            {isPending ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />ARQUITETANDO...</> : <><BarChart2 className="mr-2 w-5 h-5" />ARQUITETAR MODELO<ChevronRight className="ml-2 w-5 h-5" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
