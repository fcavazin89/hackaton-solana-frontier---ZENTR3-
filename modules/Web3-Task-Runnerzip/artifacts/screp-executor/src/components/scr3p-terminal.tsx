import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { TerminalSquare, ChevronRight, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
  getListTasksQueryKey,
  getListDeploymentsQueryKey,
  getListIntegrationsQueryKey,
  getGetAgentConfigQueryKey,
  getGetAgentStatusQueryKey,
} from "@workspace/api-client-react";

type LineType = "info" | "success" | "error" | "muted" | "warn" | "cmd";

interface TerminalLine {
  text: string;
  type: LineType;
  id: number;
}

let lineCounter = 0;
function mkLine(text: string, type: LineType = "info"): TerminalLine {
  return { text, type, id: ++lineCounter };
}

const BOOT_SEQUENCE: TerminalLine[] = [
  mkLine("", "muted"),
  mkLine("  ███████╗ ██████╗██████╗ ██████╗ ██████╗ ", "success"),
  mkLine("  ██╔════╝██╔════╝██╔══██╗╚════██╗██╔══██╗", "success"),
  mkLine("  ███████╗██║     ██████╔╝ █████╔╝██████╔╝", "success"),
  mkLine("  ╚════██║██║     ██╔══██╗ ╚═══██╗██╔═══╝ ", "success"),
  mkLine("  ███████║╚██████╗██║  ██║██████╔╝██║     ", "success"),
  mkLine("  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═════╝ ╚═╝     v1.0.0", "success"),
  mkLine("", "muted"),
  mkLine("> Initializing agent engine...", "muted"),
  mkLine("> Scanning directive queue...", "muted"),
  mkLine("> Workers online.", "muted"),
  mkLine("> System ready.", "muted"),
  mkLine("", "muted"),
  mkLine("Type 'help' for available commands.", "info"),
  mkLine("─────────────────────────────────────────", "muted"),
];

const COLOR_MAP: Record<LineType, string> = {
  info: "text-foreground",
  success: "text-primary",
  error: "text-red-400",
  muted: "text-muted-foreground/60",
  warn: "text-yellow-400",
  cmd: "text-foreground/80",
};

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const INVALIDATE_KEY_MAP: Record<string, () => unknown[][]> = {
  dashboard: () => [getGetDashboardSummaryQueryKey(), getGetRecentActivityQueryKey()],
  agent: () => [getGetAgentConfigQueryKey(), getGetAgentStatusQueryKey()],
  tasks: () => [getListTasksQueryKey()],
  deploys: () => [getListDeploymentsQueryKey()],
  integrations: () => [getListIntegrationsQueryKey()],
};

interface Scr3pTerminalProps {
  onNavigate?: (path: string) => void;
}

export function Scr3pTerminal({ onNavigate }: Scr3pTerminalProps = {}) {
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<TerminalLine[]>(BOOT_SEQUENCE);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(async () => {
    const raw = input.trim();
    if (!raw || loading) return;

    if (raw.toLowerCase() === "clear") {
      setLines([mkLine("Terminal cleared.", "muted"), mkLine("─────────────────────────────────────────", "muted")]);
      setInput("");
      setHistory((h) => [raw, ...h].slice(0, 50));
      setHistoryIdx(-1);
      return;
    }

    setLines((prev) => [...prev, mkLine(`> ${raw}`, "cmd")]);
    setInput("");
    setHistory((h) => [raw, ...h].slice(0, 50));
    setHistoryIdx(-1);
    setLoading(true);

    try {
      const resp = await fetch(`${BASE_URL}/api/terminal/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: raw }),
      });
      const data = await resp.json();
      const result: TerminalLine[] = (data.lines as Array<{ text: string; type: LineType }>).map((l) =>
        mkLine(l.text, l.type)
      );
      setLines((prev) => [...prev, ...result]);

      if (data.invalidate && Array.isArray(data.invalidate)) {
        for (const key of data.invalidate as string[]) {
          const getKeys = INVALIDATE_KEY_MAP[key];
          if (getKeys) {
            for (const queryKey of getKeys()) {
              queryClient.invalidateQueries({ queryKey });
            }
          }
        }
      }

      if (data.navigate && onNavigate) {
        setTimeout(() => onNavigate(data.navigate), 400);
      }
    } catch {
      setLines((prev) => [...prev, mkLine("NETWORK ERROR: could not reach system.", "error")]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, queryClient, onNavigate]);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistoryIdx((i) => {
          const next = Math.min(i + 1, history.length - 1);
          setInput(history[next] ?? "");
          return next;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistoryIdx((i) => {
          const next = Math.max(i - 1, -1);
          setInput(next === -1 ? "" : (history[next] ?? ""));
          return next;
        });
      }
    },
    [submit, history]
  );

  return (
    <div
      className="flex flex-col h-full rounded-sm border border-border bg-background overflow-hidden cursor-text"
      onClick={focusInput}
      style={{ fontFamily: "var(--app-font-mono)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono text-primary tracking-widest uppercase">
            SCR3P TERMINAL
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500/70" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
          <div className="h-2 w-2 rounded-full bg-green-500/70" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {lines.map((l) => (
          <div
            key={l.id}
            className={`text-[11px] leading-[1.65] whitespace-pre-wrap break-all select-text ${COLOR_MAP[l.type]}`}
          >
            {l.text || "\u00A0"}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>executing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-card shrink-0">
        <ChevronRight className="h-3 w-3 text-primary shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder={loading ? "executing..." : "type a command..."}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/30 outline-none border-none focus:ring-0"
          style={{ fontFamily: "var(--app-font-mono)" }}
        />
        {loading && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
        {!loading && input.trim() && (
          <span className="text-[9px] text-muted-foreground/30 uppercase tracking-widest">ENTER</span>
        )}
      </div>
    </div>
  );
}
