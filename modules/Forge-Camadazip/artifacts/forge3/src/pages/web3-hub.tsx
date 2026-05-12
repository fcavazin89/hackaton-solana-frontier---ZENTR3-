import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Hammer, Send, Copy, Check, Download, Code2,
  Sparkles, Loader2, RotateCcw, ExternalLink,
} from "lucide-react";

type Platform = "evm" | "solana";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ParsedContent {
  before: string;
  code: string | null;
  lang: "sol" | "rs" | null;
  after: string;
  lineCount: number;
}

function parseContent(content: string): ParsedContent {
  const match = content.match(/```(solidity|rust)\n([\s\S]*?)```/);
  if (!match) return { before: content, code: null, lang: null, after: "", lineCount: 0 };
  const idx = content.indexOf(match[0]);
  const code = match[2];
  return {
    before: content.slice(0, idx).trim(),
    code,
    lang: match[1] === "solidity" ? "sol" : "rs",
    after: content.slice(idx + match[0].length).trim(),
    lineCount: code.split("\n").length,
  };
}

function renderText(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      {i < text.split("\n").length - 1 && <br />}
    </span>
  ));
}

const QUICK_ACTIONS: Record<Platform, { label: string; prompt: string }[]> = {
  evm: [
    { label: "Token ERC-20 + staking", prompt: "Crie um token ERC-20 chamado ForgeToken (FRG) com 10 milhões de supply, mintagem pelo owner, e um contrato de staking separado onde usuários depositam FRG e ganham recompensas por bloco." },
    { label: "NFT com royalties", prompt: "Quero uma coleção NFT (ERC-721) com supply máximo de 10.000, mint público por 0.05 ETH, royalties de 5% via ERC-2981, e whitelist de pré-venda." },
    { label: "DAO on-chain", prompt: "Crie uma DAO completa com Governor (OpenZeppelin), TimelockController de 48h e um token de votação ERC-20Votes com 1 milhão de supply." },
    { label: "Vault multi-sig", prompt: "Vault simples: 3 endereços signatários, threshold de 2 de 3, aceita ETH, libera fundos somente com aprovação do quórum. Inclua eventos de proposta e execução." },
    { label: "Token deflacionário", prompt: "Token ERC-20 com taxa de 3% em cada transferência: 1% queimado, 1% para o owner, 1% para um fundo de liquidez. Pausável pelo owner." },
    { label: "ERC-4626 Vault", prompt: "Vault de rendimento ERC-4626 que aceita um token ERC-20 como ativo base, distribui shares proporcionais, e tem função de yield simulada pelo owner." },
  ],
  solana: [
    { label: "SPL Token + pausa", prompt: "Crie um programa Anchor para um SPL Token com mintagem pelo authority, capacidade de pausar transferências, e queima de tokens pelo holder." },
    { label: "Staking de SOL", prompt: "Programa de staking onde usuários depositam SOL, recebem recompensas calculadas por tempo de lock (mínimo 7 dias), e podem fazer unstake com penalidade de saída antecipada." },
    { label: "NFT Metaplex", prompt: "Programa Anchor para uma NFT collection usando Metaplex, com supply máximo de 5.000, mint price de 0.1 SOL, whitelist por PDA, e royalties de 7%." },
    { label: "DAO on-chain", prompt: "DAO Solana com votação por tokens SPL: criar proposta, votar (a favor/contra), executar se quórum atingido (51%), prazo de votação configurável." },
    { label: "Vault com PDA", prompt: "Vault com PDA como custodian: usuários depositam SOL, cada usuário tem seu próprio vault-PDA, saque disponível após timelock de 24h definido no depósito." },
    { label: "Token com treasury", prompt: "SPL Token com 2% de cada transferência indo automaticamente para um endereço de treasury configurado pelo authority. Inclua função de atualizar treasury." },
  ],
};

const WELCOME_CONTENT = {
  evm: "Pronto para gerar contratos **EVM**. Pode pedir tokens, NFTs, DAOs, vaults — descreva em português e eu gero o Solidity completo, seguro e pronto para o Remix.",
  solana: "Pronto para gerar programas **Solana**. Pode pedir tokens SPL, staking, NFT, DAOs — descreva em português e eu gero o Rust/Anchor completo para o Solana Playground.",
};

export default function TheForge() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [platform, setPlatform] = useState<Platform>("evm");
  const [outputCode, setOutputCode] = useState("");
  const [outputLang, setOutputLang] = useState<"sol" | "rs">("sol");
  const [outputName, setOutputName] = useState("contrato.sol");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const hasUserMessages = messages.some((m) => m.role === "user");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now() + 1}`;

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    let fullContent = "";

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/contracts/forge-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, platform }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Falha na requisição");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
              );
            }
            if (data.done) {
              const { code, lang } = parseContent(fullContent);
              if (code && lang) {
                setOutputCode(code);
                setOutputLang(lang);
                setOutputName(`contrato.${lang}`);
              }
            }
            if (data.error) {
              toast({ title: "Erro", description: data.error, variant: "destructive" });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast({ title: "Erro", description: "Não foi possível conectar ao ForgeBot.", variant: "destructive" });
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async () => {
    if (!outputCode) return;
    await navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast({ title: "Código copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputCode) return;
    const blob = new Blob([outputCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outputName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setOutputCode("");
    setIsStreaming(false);
  };

  const handlePlatformSwitch = (p: Platform) => {
    setPlatform(p);
    setOutputCode("");
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Left panel: chat ── */}
      <div className="w-[440px] shrink-0 flex flex-col border-r border-border/30 bg-card/10">
        {/* Header */}
        <div className="h-14 border-b border-border/30 flex items-center justify-between px-4 shrink-0 bg-card/20">
          <div className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-bold uppercase tracking-wider">The Forge</span>
            <Badge className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20 uppercase tracking-wider">
              Agente
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleClear}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="font-mono text-xs">Nova conversa</TooltipContent>
              </Tooltip>
            )}
            {/* Platform toggle */}
            <div className="flex items-center gap-0.5 bg-background/60 border border-border/40 rounded-lg p-1">
              <button
                onClick={() => handlePlatformSwitch("evm")}
                className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all ${
                  platform === "evm"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EVM
              </button>
              <button
                onClick={() => handlePlatformSwitch("solana")}
                className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all ${
                  platform === "solana"
                    ? "bg-chart-3 text-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Solana
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Welcome message */}
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
              <Hammer className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                ForgeBot
              </p>
              <div className="text-sm text-foreground/90 leading-relaxed space-y-2">
                <p>
                  Olá! Sou o <strong>ForgeBot</strong>, seu agente de engenharia de contratos
                  inteligentes.
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {WELCOME_CONTENT[platform]}
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions (only before first message) */}
          {!hasUserMessages && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">
                Sugestões rápidas
              </p>
              <div className="flex flex-col gap-1.5">
                {QUICK_ACTIONS[platform].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    className="text-left text-xs font-mono px-3 py-2 rounded-lg border border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Sparkles className="h-3 w-3 inline mr-2 text-primary/60" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] bg-primary/15 border border-primary/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            }

            const isThisStreaming = isStreaming && msg === messages[messages.length - 1];
            const parsed = parseContent(msg.content);

            return (
              <div key={msg.id} className="flex gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                  {isThisStreaming && !msg.content ? (
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                  ) : (
                    <Hammer className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <p className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                    ForgeBot
                  </p>

                  {!msg.content && isThisStreaming ? (
                    <div className="flex gap-1 items-center py-1">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  ) : parsed.code ? (
                    <div className="space-y-2.5">
                      {parsed.before && (
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {renderText(parsed.before)}
                        </p>
                      )}
                      {/* Code indicator pill */}
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono cursor-default ${
                          parsed.lang === "rs"
                            ? "bg-chart-3/10 border-chart-3/30 text-chart-3"
                            : "bg-secondary/10 border-secondary/30 text-secondary"
                        }`}
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        {parsed.lang === "rs" ? "Rust · Anchor" : "Solidity"} ·{" "}
                        {parsed.lineCount} linhas
                        <span className="text-muted-foreground ml-1">→ painel direito</span>
                      </div>
                      {parsed.after && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {renderText(parsed.after)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {renderText(msg.content)}
                      {isThisStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-primary/70 ml-0.5 animate-pulse align-text-bottom" />
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border/30 p-3 bg-card/20 shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                platform === "evm"
                  ? "Ex: Crie um token ERC-20 com staking e mintagem pelo owner..."
                  : "Ex: Quero um programa de staking de SOL com recompensas diárias..."
              }
              className="font-mono text-xs bg-background/80 min-h-[60px] max-h-[160px] resize-none leading-relaxed border-border/40 focus-visible:ring-primary/30"
              disabled={isStreaming}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isStreaming || !input.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/50 mt-1.5 px-1">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* ── Right panel: code output ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f]">
        {/* Toolbar */}
        <div className="h-14 border-b border-border/30 flex items-center justify-between px-4 bg-card/20 shrink-0">
          <div className="flex items-center gap-3">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              {outputCode ? outputName : "aguardando geração..."}
            </span>
            {outputCode && (
              <>
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] uppercase ${
                    outputLang === "rs"
                      ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                      : "bg-secondary/10 text-secondary border-secondary/20"
                  }`}
                >
                  {outputLang === "rs" ? "Rust · Anchor" : "Solidity ^0.8.22"}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                  {outputCode.split("\n").length} linhas
                </Badge>
              </>
            )}
          </div>

          {outputCode && (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="font-mono text-xs">
                  Download .{outputLang}
                </TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs h-8 gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-secondary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>

              {outputLang === "rs" ? (
                <a
                  href="https://beta.solpg.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="font-mono text-xs h-8 bg-chart-3 hover:bg-chart-3/90 text-black gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Solana Playground
                  </Button>
                </a>
              ) : (
                <a
                  href="https://remix.ethereum.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="font-mono text-xs h-8 bg-primary hover:bg-primary/90 gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Remix
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Code block */}
        <div className="flex-1 overflow-auto p-6">
          {outputCode ? (
            <pre
              className={`font-mono text-sm leading-relaxed whitespace-pre-wrap break-all ${
                outputLang === "rs" ? "text-orange-300/90" : "text-green-300/90"
              }`}
            >
              <code>{outputCode}</code>
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Hammer className="h-7 w-7 text-primary/40" />
                </div>
                <Sparkles className="h-4 w-4 text-primary/60 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-mono text-sm text-muted-foreground/60">
                  O contrato gerado aparecerá aqui
                </p>
                <p className="font-mono text-xs text-muted-foreground/40 max-w-xs leading-relaxed">
                  Descreva o que você precisa no painel esquerdo.
                  <br />
                  Use as sugestões rápidas para começar.
                </p>
              </div>
              <div className="flex gap-4 mt-2">
                {[
                  platform === "evm" ? "Solidity ^0.8.22" : "Rust · Anchor",
                  platform === "evm" ? "OpenZeppelin v5" : "Solana Playground",
                  platform === "evm" ? "Base · Polygon" : "Devnet · Mainnet",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono text-muted-foreground/40 border border-border/20 rounded-full px-3 py-1 uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer strip */}
        <div className="h-9 border-t border-border/30 bg-card/10 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              ForgeBot · gpt-4o
            </span>
          </div>
          {outputCode && (
            <span className="text-[10px] font-mono text-muted-foreground/40">
              {outputCode.split("\n").length} linhas · {new Blob([outputCode]).size} bytes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
