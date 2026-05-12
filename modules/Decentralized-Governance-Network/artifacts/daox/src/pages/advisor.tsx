import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrainCircuit, AlertTriangle, ArrowRight, Cpu, Zap, LayoutGrid, Lock, Users, Wallet } from "lucide-react";

type Lang = "pt" | "en" | "es";

interface GovernanceRecommendation {
  daoModel: "token-based" | "reputation-based" | "multisig" | "hybrid";
  votingSystem: "simple-majority" | "supermajority" | "quadratic" | "weighted";
  proposalTypes: string[];
  quorum: string;
  executionMechanism: "snapshot" | "safe-multisig" | "on-chain" | "hybrid";
  recommendation: string;
  rationale: string;
  risks: string[];
  nextSteps: string[];
  maturityScore: number;
}

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
];

const T = {
  pt: {
    pageTitle: "Consultor de Governança IA",
    pageSubtitle: "Desenvolvido por DAOX — o arquiteto de governança",
    pageDesc: "Descreva sua startup e a IA criará a estrutura de governança descentralizada ideal — incluindo modelo de DAO, sistema de votação, regras de quórum e mecanismo de execução.",
    cardTitle: "Perfil da Startup",
    cardDesc: "Forneça o contexto da sua startup para obter uma recomendação de governança personalizada",
    labelStage: "Estágio",
    placeholderStage: "Selecione o estágio...",
    stageIdea: "Ideia — pré-produto",
    stageBuild: "Build — construindo MVP",
    stageLaunch: "Lançamento — produto no ar",
    stageGrowth: "Crescimento — escalando usuários",
    stageScale: "Escala — consolidado",
    labelCommunity: "Tamanho da Comunidade",
    placeholderCommunity: "ex: 500",
    labelToken: "Distribuição de Token",
    placeholderToken: "Selecione a distribuição...",
    tokenNone: "Não definido ainda",
    tokenDefined: "Definido (não distribuído)",
    tokenDistributed: "Distribuído (time/investidores)",
    tokenCirculating: "Circulando (público)",
    labelRisk: "Tolerância ao Risco",
    placeholderRisk: "Selecione o nível de risco...",
    riskLow: "Baixo — maximizar segurança",
    riskMedium: "Médio — abordagem equilibrada",
    riskHigh: "Alto — mover rápido",
    labelGoal: "Objetivo de Governança",
    placeholderGoal: "Descreva o que quer alcançar. Ex: 'Descentralizar decisões de tesouraria e deixar a comunidade votar na direção do produto'",
    btnGenerate: "Gerar Recomendação de Governança",
    btnLoading: "Analisando estrutura de governança...",
    errorMsg: "Falha ao obter recomendação da IA. Tente novamente.",
    sectionLabel: "Recomendação IA",
    labelVoting: "Sistema de Votação",
    labelQuorum: "Quórum",
    quorumSub: "Participação mínima necessária",
    labelExecution: "Execução",
    labelRationale: "Justificativa",
    labelProposalTypes: "Tipos de Proposta",
    labelRisks: "Principais Riscos",
    labelNextSteps: "Próximos Passos",
    maturityLabel: "Score de Maturidade DAO",
    maturityNascent: "Nascente",
    maturityEstablished: "Estabelecida",
    maturitySovereign: "Soberana",
    applyHint: "Aplique esta estrutura ao criar um novo DAO",
    btnApply: "Criar DAO com esta estrutura",
  },
  en: {
    pageTitle: "AI Governance Advisor",
    pageSubtitle: "Powered by DAOX — the governance architect",
    pageDesc: "Describe your startup and the AI will design the optimal decentralized governance structure — including DAO model, voting system, quorum rules, and execution mechanism.",
    cardTitle: "Startup Profile",
    cardDesc: "Provide your startup context to get a tailored governance recommendation",
    labelStage: "Stage",
    placeholderStage: "Select stage...",
    stageIdea: "Idea — pre-product",
    stageBuild: "Build — building MVP",
    stageLaunch: "Launch — product live",
    stageGrowth: "Growth — scaling users",
    stageScale: "Scale — established",
    labelCommunity: "Community Size",
    placeholderCommunity: "e.g. 500",
    labelToken: "Token Distribution",
    placeholderToken: "Select distribution...",
    tokenNone: "Not defined yet",
    tokenDefined: "Defined (not distributed)",
    tokenDistributed: "Distributed to team/investors",
    tokenCirculating: "Circulating (public)",
    labelRisk: "Risk Tolerance",
    placeholderRisk: "Select risk level...",
    riskLow: "Low — maximize security",
    riskMedium: "Medium — balanced approach",
    riskHigh: "High — move fast",
    labelGoal: "Governance Goal",
    placeholderGoal: "Describe what you want to achieve. e.g. 'Decentralize treasury decisions and let our community vote on product direction and partnerships'",
    btnGenerate: "Generate Governance Recommendation",
    btnLoading: "Analyzing governance structure...",
    errorMsg: "Failed to get AI recommendation. Please try again.",
    sectionLabel: "AI Recommendation",
    labelVoting: "Voting System",
    labelQuorum: "Quorum",
    quorumSub: "Minimum participation required",
    labelExecution: "Execution",
    labelRationale: "Rationale",
    labelProposalTypes: "Proposal Types",
    labelRisks: "Key Risks",
    labelNextSteps: "Next Steps",
    maturityLabel: "DAO Maturity Score",
    maturityNascent: "Nascent",
    maturityEstablished: "Established",
    maturitySovereign: "Sovereign",
    applyHint: "Apply this structure when creating a new DAO",
    btnApply: "Create DAO with this structure",
  },
  es: {
    pageTitle: "Asesor de Gobernanza IA",
    pageSubtitle: "Desarrollado por DAOX — el arquitecto de gobernanza",
    pageDesc: "Describe tu startup y la IA diseñará la estructura de gobernanza descentralizada óptima — incluyendo modelo de DAO, sistema de votación, reglas de quórum y mecanismo de ejecución.",
    cardTitle: "Perfil de la Startup",
    cardDesc: "Proporciona el contexto de tu startup para obtener una recomendación de gobernanza personalizada",
    labelStage: "Etapa",
    placeholderStage: "Selecciona la etapa...",
    stageIdea: "Idea — pre-producto",
    stageBuild: "Build — construyendo MVP",
    stageLaunch: "Lanzamiento — producto en vivo",
    stageGrowth: "Crecimiento — escalando usuarios",
    stageScale: "Escala — consolidado",
    labelCommunity: "Tamaño de la Comunidad",
    placeholderCommunity: "ej: 500",
    labelToken: "Distribución de Token",
    placeholderToken: "Selecciona la distribución...",
    tokenNone: "No definido aún",
    tokenDefined: "Definido (no distribuido)",
    tokenDistributed: "Distribuido (equipo/inversores)",
    tokenCirculating: "Circulando (público)",
    labelRisk: "Tolerancia al Riesgo",
    placeholderRisk: "Selecciona el nivel de riesgo...",
    riskLow: "Bajo — maximizar seguridad",
    riskMedium: "Medio — enfoque equilibrado",
    riskHigh: "Alto — moverse rápido",
    labelGoal: "Objetivo de Gobernanza",
    placeholderGoal: "Describe lo que quieres lograr. Ej: 'Descentralizar decisiones de tesorería y dejar que la comunidad vote la dirección del producto'",
    btnGenerate: "Generar Recomendación de Gobernanza",
    btnLoading: "Analizando estructura de gobernanza...",
    errorMsg: "Error al obtener recomendación de IA. Inténtalo de nuevo.",
    sectionLabel: "Recomendación IA",
    labelVoting: "Sistema de Votación",
    labelQuorum: "Quórum",
    quorumSub: "Participación mínima requerida",
    labelExecution: "Ejecución",
    labelRationale: "Justificación",
    labelProposalTypes: "Tipos de Propuesta",
    labelRisks: "Riesgos Clave",
    labelNextSteps: "Próximos Pasos",
    maturityLabel: "Puntuación de Madurez DAO",
    maturityNascent: "Naciente",
    maturityEstablished: "Establecida",
    maturitySovereign: "Soberana",
    applyHint: "Aplica esta estructura al crear un nuevo DAO",
    btnApply: "Crear DAO con esta estructura",
  },
} as const;

const DAO_MODEL_META: Record<string, { label: string; color: string; icon: typeof Lock }> = {
  "token-based": { label: "Token-Based", color: "text-violet-400 bg-violet-400/10 border-violet-400/30", icon: Wallet },
  "reputation-based": { label: "Reputation-Based", color: "text-teal-400 bg-teal-400/10 border-teal-400/30", icon: Users },
  "multisig": { label: "Multi-Sig", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: Lock },
  "hybrid": { label: "Hybrid", color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: LayoutGrid },
};

const VOTING_META: Record<string, { label: string; description: Record<Lang, string> }> = {
  "simple-majority": { label: "Simple Majority", description: { pt: ">50% vence", en: ">50% wins", es: ">50% gana" } },
  "supermajority": { label: "Super Majority", description: { pt: ">66% necessário", en: ">66% required", es: ">66% requerido" } },
  "quadratic": { label: "Quadratic Voting", description: { pt: "√tokens = votos, evita dominância de baleias", en: "√tokens = votes, prevents whale dominance", es: "√tokens = votos, evita dominancia de ballenas" } },
  "weighted": { label: "Weighted Voting", description: { pt: "Poder ponderado por função + tokens", en: "Power weighted by role + tokens", es: "Poder ponderado por rol + tokens" } },
};

const EXECUTION_META: Record<string, { label: string; description: Record<Lang, string> }> = {
  "snapshot": { label: "Snapshot", description: { pt: "Votação off-chain, sem gas", en: "Off-chain, gasless voting", es: "Votación off-chain, sin gas" } },
  "safe-multisig": { label: "Safe Multi-Sig", description: { pt: "Execução on-chain via Gnosis Safe", en: "On-chain execution via Gnosis Safe", es: "Ejecución on-chain via Gnosis Safe" } },
  "on-chain": { label: "On-Chain Governor", description: { pt: "Execução autônoma por smart contract", en: "Fully autonomous smart contract execution", es: "Ejecución autónoma por smart contract" } },
  "hybrid": { label: "Hybrid", description: { pt: "Votos off-chain, execução on-chain", en: "Off-chain votes, on-chain execution", es: "Votos off-chain, ejecución on-chain" } },
};

function MaturityMeter({ score, t }: { score: number; t: typeof T.pt }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono text-muted-foreground">
        <span>{t.maturityLabel}</span>
        <span className="text-primary font-bold">{score} / 10</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400 transition-all duration-1000"
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>{t.maturityNascent}</span>
        <span>{t.maturityEstablished}</span>
        <span>{t.maturitySovereign}</span>
      </div>
    </div>
  );
}

function LangButton({ lang, current, onClick }: { lang: typeof LANGS[0]; current: Lang; onClick: () => void }) {
  const active = lang.code === current;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
      }`}
    >
      <span className="text-base leading-none">{lang.flag}</span>
      <span>{lang.label}</span>
    </button>
  );
}

export default function Advisor() {
  const [lang, setLang] = useState<Lang>("pt");
  const [stage, setStage] = useState<string>("");
  const [communitySize, setCommunitySize] = useState<string>("");
  const [tokenDistribution, setTokenDistribution] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<string>("medium");
  const [governanceGoal, setGovernanceGoal] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<GovernanceRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = T[lang];
  const isValid = stage && communitySize && tokenDistribution && governanceGoal.trim().length > 5;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const res = await fetch("/api/ai/recommend-governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          communitySize: parseInt(communitySize, 10),
          tokenDistribution,
          governanceGoal,
          riskLevel,
          language: lang,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as GovernanceRecommendation;
      setRecommendation(data);
    } catch {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const modelMeta = recommendation ? DAO_MODEL_META[recommendation.daoModel] : null;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">{t.pageTitle}</h1>
              <p className="text-muted-foreground font-mono text-sm">{t.pageSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg border bg-muted/30 self-start shrink-0">
            {LANGS.map((l) => (
              <LangButton key={l.code} lang={l} current={lang} onClick={() => setLang(l.code)} />
            ))}
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed -mt-4">{t.pageDesc}</p>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              {t.cardTitle}
            </CardTitle>
            <CardDescription className="font-mono text-xs">{t.cardDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.labelStage}</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.placeholderStage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">{t.stageIdea}</SelectItem>
                    <SelectItem value="build">{t.stageBuild}</SelectItem>
                    <SelectItem value="launch">{t.stageLaunch}</SelectItem>
                    <SelectItem value="growth">{t.stageGrowth}</SelectItem>
                    <SelectItem value="scale">{t.stageScale}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.labelCommunity}</Label>
                <Input
                  type="number"
                  placeholder={t.placeholderCommunity}
                  value={communitySize}
                  onChange={(e) => setCommunitySize(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.labelToken}</Label>
                <Select value={tokenDistribution} onValueChange={setTokenDistribution}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.placeholderToken} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-defined">{t.tokenNone}</SelectItem>
                    <SelectItem value="defined">{t.tokenDefined}</SelectItem>
                    <SelectItem value="distributed">{t.tokenDistributed}</SelectItem>
                    <SelectItem value="circulating">{t.tokenCirculating}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.labelRisk}</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.placeholderRisk} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t.riskLow}</SelectItem>
                    <SelectItem value="medium">{t.riskMedium}</SelectItem>
                    <SelectItem value="high">{t.riskHigh}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.labelGoal}</Label>
              <Textarea
                placeholder={t.placeholderGoal}
                value={governanceGoal}
                onChange={(e) => setGovernanceGoal(e.target.value)}
                className="min-h-[100px] font-mono text-sm resize-none"
              />
            </div>

            <Button onClick={handleSubmit} disabled={!isValid || loading} className="w-full font-mono" size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {t.btnLoading}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4" />
                  {t.btnGenerate}
                </span>
              )}
            </Button>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {recommendation && modelMeta && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t.sectionLabel}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Card className={`border ${modelMeta.color.split(" ")[2]}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${modelMeta.color}`}>
                        <modelMeta.icon className="h-3 w-3" />
                        {modelMeta.label} DAO
                      </span>
                    </div>
                    <CardTitle className="text-xl font-sans">{recommendation.recommendation}</CardTitle>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-bold text-primary">{recommendation.maturityScore}</div>
                    <div className="text-xs text-muted-foreground font-mono">/ 10</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <MaturityMeter score={recommendation.maturityScore} t={t} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t.labelVoting}</div>
                    <div className="font-semibold text-sm">{VOTING_META[recommendation.votingSystem]?.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{VOTING_META[recommendation.votingSystem]?.description[lang]}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t.labelQuorum}</div>
                    <div className="font-semibold text-sm">{recommendation.quorum}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.quorumSub}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t.labelExecution}</div>
                    <div className="font-semibold text-sm">{EXECUTION_META[recommendation.executionMechanism]?.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{EXECUTION_META[recommendation.executionMechanism]?.description[lang]}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2 font-mono uppercase tracking-wider text-muted-foreground">{t.labelRationale}</h3>
                  <p className="text-sm leading-relaxed text-foreground/90">{recommendation.rationale}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-3 font-mono uppercase tracking-wider text-muted-foreground">{t.labelProposalTypes}</h3>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.proposalTypes.map((type) => (
                      <span key={type} className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-mono uppercase tracking-wider text-xs">{t.labelRisks}</span>
                    </h3>
                    <ul className="space-y-2">
                      {recommendation.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-muted-foreground">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-teal-500">
                      <Zap className="h-4 w-4" />
                      <span className="font-mono uppercase tracking-wider text-xs">{t.labelNextSteps}</span>
                    </h3>
                    <ol className="space-y-2">
                      {recommendation.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 font-mono text-xs font-bold text-teal-500 shrink-0 w-4">{i + 1}.</span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">{t.applyHint}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs gap-1"
                      onClick={() => {
                        const params = new URLSearchParams({
                          governanceModel: recommendation.daoModel,
                          votingSystem: recommendation.votingSystem,
                          executionMechanism: recommendation.executionMechanism,
                        });
                        window.location.href = `/daos?${params.toString()}`;
                      }}
                    >
                      {t.btnApply} <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
