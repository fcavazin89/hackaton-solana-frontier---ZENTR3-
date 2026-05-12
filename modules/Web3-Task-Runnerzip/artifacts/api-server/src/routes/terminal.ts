import { Router } from "express";
import { db } from "@workspace/db";
import {
  tasksTable,
  deploymentsTable,
  integrationsTable,
  agentConfigTable,
  activityTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { getEngineStats, getWorkerStates, runCycle, executeTaskAutonomously } from "../lib/agent-engine";
import Groq from "groq-sdk";

const router = Router();

type Line = { text: string; type: "info" | "success" | "error" | "muted" | "warn" | "cmd" };

function line(text: string, type: Line["type"] = "info"): Line {
  return { text, type };
}

function sep(): Line {
  return line("─────────────────────────────────────────", "muted");
}

function parseArgs(parts: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  let i = 0;
  while (i < parts.length) {
    if (parts[i].startsWith("--")) {
      const key = parts[i].slice(2);
      const val = parts[i + 1] && !parts[i + 1].startsWith("--") ? parts[i + 1] : "true";
      flags[key] = val;
      i += parts[i + 1] && !parts[i + 1].startsWith("--") ? 2 : 1;
    } else {
      positional.push(parts[i]);
      i++;
    }
  }
  return { flags, positional };
}

function normalizeCategory(raw: string): string {
  const map: Record<string, string> = {
    contract: "smart_contract",
    smart_contract: "smart_contract",
    frontend: "frontend",
    backend: "backend",
    deploy: "deploy",
    integration: "integration",
    audit: "audit",
    other: "other",
  };
  return map[raw.toLowerCase()] ?? "other";
}

function normalizePriority(raw: string): string {
  const valid = ["low", "medium", "high", "critical"];
  return valid.includes(raw.toLowerCase()) ? raw.toLowerCase() : "medium";
}

function normalizeIntegrationType(raw: string): string {
  const valid = ["rpc_provider", "wallet", "oracle", "storage", "indexer", "bridge", "dex", "other"];
  const aliases: Record<string, string> = {
    rpc: "rpc_provider",
    rpc_provider: "rpc_provider",
    wallet: "wallet",
    oracle: "oracle",
    storage: "storage",
    indexer: "indexer",
    bridge: "bridge",
    dex: "dex",
    other: "other",
  };
  return aliases[raw?.toLowerCase()] ?? (valid.includes(raw?.toLowerCase()) ? raw.toLowerCase() : "other");
}

const greetLines = [
  line("SCR3P pronto. Use 'help' para ver comandos.", "success"),
  line("Comandos rápidos: status | run | stop | autonomy full_auto | create <titulo>", "muted"),
];

router.post("/terminal/command", async (req, res) => {
  const raw: string = (req.body.input ?? "").trim();
  if (!raw) {
    return res.json({ lines: [line("Digite um comando. Use 'help' para ver os disponíveis.", "warn")] });
  }

  const tokens = raw.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((t) => t.replace(/"/g, "")) ?? [];
  const [cmd, ...rest] = tokens;
  const command = (cmd ?? "").toLowerCase();

  try {
    if (command === "help") {
      return res.json({
        lines: [
          sep(),
          line("SCR3P TERMINAL — COMMAND REFERENCE", "success"),
          sep(),
          line("SYSTEM / MISSION CTRL", "muted"),
          line("  status                              — fleet + task overview", "info"),
          line("  run                                 — activate agent engine", "info"),
          line("  stop                                — halt agent engine", "info"),
          line("  autonomy <level>                    — set autonomy level", "info"),
          line("    levels: manual | supervised | semi_auto | full_auto", "muted"),
          line("", "muted"),
          line("AGENT FLEET", "muted"),
          line("  fleet on | off                      — enable / disable agent fleet", "info"),
          line("  fleet trigger                       — manually trigger one cycle", "info"),
          line("  fleet autonomy <level>              — alias for autonomy command", "info"),
          line("", "muted"),
          line("DIRECTIVES", "muted"),
          line("  create <title> [opts]               — create a new directive", "info"),
          line("    --cat  <category>                 contract | frontend | backend | deploy | audit", "muted"),
          line("    --priority <level>                low | medium | high | critical", "muted"),
          line("    --desc \"<description>\"            optional description", "muted"),
          line("  execute <id>                        — execute a directive autonomously", "info"),
          line("  delete <id>                         — delete a directive", "info"),
          line("  ls                                  — list recent directives", "info"),
          line("", "muted"),
          line("DEPLOYS", "muted"),
          line("  deploy create <name> --network <n>  — register a new deployment", "info"),
          line("    --addr <address>                  contract address (optional)", "muted"),
          line("    --tx <hash>                       tx hash (optional)", "muted"),
          line("  deploy delete <id>                  — remove a deployment record", "info"),
          line("  ls deploys                          — list deployments", "info"),
          line("", "muted"),
          line("INTEGRATIONS", "muted"),
          line("  integration add <name> --type <t>   — add an integration", "info"),
          line("    types: rpc | wallet | oracle | storage | indexer | bridge | dex | other", "muted"),
          line("    --network <net>                   network (optional)", "muted"),
          line("    --endpoint <url>                  endpoint URL (optional)", "muted"),
          line("  integration enable <id>             — activate an integration", "info"),
          line("  integration disable <id>            — deactivate an integration", "info"),
          line("  integration delete <id>             — remove an integration", "info"),
          line("  ls integrations                     — list integrations", "info"),
          line("", "muted"),
          line("NAVIGATION", "muted"),
          line("  goto <section>                      — navigate to a section", "info"),
          line("    sections: home | agent | directives | deploys | integrations", "muted"),
          line("", "muted"),
          line("TERMINAL", "muted"),
          line("  clear                               — clear terminal output", "info"),
          line("  help                                — show this reference", "info"),
          sep(),
          line("BUILD WITHOUT PERMISSION.", "success"),
        ],
      });
    }

    if (["olá", "ola", "oi", "hello", "hi"].includes(command)) {
      return res.json({ lines: greetLines });
    }

    if (command === "goto" || command === "nav" || command === "cd") {
      const target = rest[0]?.toLowerCase();
      const routes: Record<string, string> = {
        home: "/", mission: "/", "mission-ctrl": "/", ctrl: "/",
        agent: "/agent", fleet: "/agent", "agent-fleet": "/agent",
        directives: "/tasks", tasks: "/tasks", task: "/tasks",
        deploys: "/deployments", deployments: "/deployments", deploy: "/deployments",
        integrations: "/integrations", integration: "/integrations",
      };
      const route = target ? routes[target] : null;
      if (!route) {
        return res.json({ lines: [line(`Seção desconhecida: "${target}"`, "error"), line("Use: home | agent | directives | deploys | integrations", "muted")] });
      }
      return res.json({ lines: [line(`Navegando para ${target?.toUpperCase()}...`, "success")], navigate: route });
    }

    if (command === "status") {
      const [cfg, tasks, deploys, integrations] = await Promise.all([
        db.query.agentConfigTable.findFirst(),
        db.query.tasksTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 5 }),
        db.query.deploymentsTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 3 }),
        db.query.integrationsTable.findMany({ where: eq(integrationsTable.status, "active"), limit: 5 }),
      ]);
      const stats = getEngineStats();
      const workers = getWorkerStates();
      const autonomy = cfg?.autonomyLevel ?? "manual";
      const engineActive = cfg?.isEnabled && autonomy !== "manual";
      const runningTasks = tasks.filter((t) => t.status === "running").length;
      const pendingTasks = tasks.filter((t) => t.status === "pending").length;
      const doneTasks = tasks.filter((t) => t.status === "done").length;
      const awaitingTasks = tasks.filter((t) => t.status === "awaiting_approval").length;

      return res.json({
        lines: [
          sep(),
          line("SYSTEM STATUS", "success"),
          sep(),
          line(`ENGINE        : ${engineActive ? "ACTIVE" : "IDLE"}`, engineActive ? "success" : "muted"),
          line(`AUTONOMY      : ${autonomy.toUpperCase()}`, "info"),
          line(`CYCLES        : ${stats.cycleCount}`, "muted"),
          line(`LAST CYCLE    : ${stats.lastCycleAt ? stats.lastCycleAt.toISOString().slice(11, 19) : "—"}`, "muted"),
          sep(),
          line("AGENT WORKERS", "info"),
          ...workers.map((w) => line(`  ${w.name.padEnd(20)} ${w.status.toUpperCase().padEnd(8)} ${w.tasksCompleted} completed`, w.status === "busy" ? "success" : "muted")),
          sep(),
          line("DIRECTIVES", "info"),
          line(`  RUNNING      : ${runningTasks}`, runningTasks > 0 ? "success" : "muted"),
          line(`  PENDING      : ${pendingTasks}`, pendingTasks > 0 ? "warn" : "muted"),
          line(`  AWAITING     : ${awaitingTasks}`, awaitingTasks > 0 ? "warn" : "muted"),
          line(`  DONE         : ${doneTasks}`, "muted"),
          sep(),
          line(`DEPLOYS       : ${deploys.length} recent`, "muted"),
          line(`INTEGRATIONS  : ${integrations.length} active`, "muted"),
          sep(),
        ],
      });
    }

    if (command === "run" || command === "start") {
      let cfg = await db.query.agentConfigTable.findFirst();
      if (!cfg) [cfg] = await db.insert(agentConfigTable).values({}).returning();
      await db.update(agentConfigTable).set({ isEnabled: true }).where(eq(agentConfigTable.id, cfg.id));
      await db.insert(activityTable).values({ type: "agent_cycle", message: "Agent engine activated via terminal", entityType: "agent" });
      runCycle().catch(() => {});
      return res.json({ lines: [line("> ativando agentes...", "muted"), line("STATUS: ACTIVE — agents are executing.", "success")], invalidate: ["agent", "dashboard"] });
    }

    if (command === "stop" || command === "pause" || command === "halt") {
      const cfg = await db.query.agentConfigTable.findFirst();
      if (cfg) await db.update(agentConfigTable).set({ isEnabled: false }).where(eq(agentConfigTable.id, cfg.id));
      await db.insert(activityTable).values({ type: "agent_cycle", message: "Agent engine halted via terminal", entityType: "agent" });
      return res.json({ lines: [line("STATUS: IDLE — engine halted.", "warn")], invalidate: ["agent", "dashboard"] });
    }

    if (command === "autonomy" || (command === "fleet" && rest[0]?.toLowerCase() === "autonomy")) {
      const levelRaw = (command === "fleet" ? rest[1] : rest[0])?.toLowerCase();
      const validLevels: Record<string, string> = { manual: "manual", supervised: "supervised", semi_auto: "semi_auto", "semi-auto": "semi_auto", full_auto: "full_auto", "full-auto": "full_auto", auto: "full_auto" };
      const level = levelRaw ? validLevels[levelRaw] : null;
      if (!level) return res.json({ lines: [line(`Nível inválido: "${levelRaw}"`, "error"), line("Use: manual | supervised | semi_auto | full_auto", "muted")] });
      let cfg = await db.query.agentConfigTable.findFirst();
      if (!cfg) [cfg] = await db.insert(agentConfigTable).values({}).returning();
      await db.update(agentConfigTable).set({ autonomyLevel: level as any }).where(eq(agentConfigTable.id, cfg.id));
      return res.json({ lines: [line(`AUTONOMY: ${level.toUpperCase()} — confirmed.`, "success")], invalidate: ["agent"] });
    }

    if (command === "fleet") {
      const sub = rest[0]?.toLowerCase();
      if (sub === "on" || sub === "enable") {
        let cfg = await db.query.agentConfigTable.findFirst();
        if (!cfg) [cfg] = await db.insert(agentConfigTable).values({}).returning();
        await db.update(agentConfigTable).set({ isEnabled: true }).where(eq(agentConfigTable.id, cfg.id));
        await db.insert(activityTable).values({ type: "agent_cycle", message: "Agent fleet enabled via terminal", entityType: "agent" });
        runCycle().catch(() => {});
        return res.json({ lines: [line("FLEET: ONLINE — all workers active.", "success")], invalidate: ["agent", "dashboard"] });
      }
      if (sub === "off" || sub === "disable") {
        const cfg = await db.query.agentConfigTable.findFirst();
        if (cfg) await db.update(agentConfigTable).set({ isEnabled: false }).where(eq(agentConfigTable.id, cfg.id));
        await db.insert(activityTable).values({ type: "agent_cycle", message: "Agent fleet disabled via terminal", entityType: "agent" });
        return res.json({ lines: [line("FLEET: OFFLINE — all workers halted.", "warn")], invalidate: ["agent", "dashboard"] });
      }
      if (sub === "trigger") {
        runCycle().catch(() => {});
        return res.json({ lines: [line("CYCLE TRIGGERED — orchestrator dispatched.", "success")], invalidate: ["agent", "dashboard"] });
      }
      if (sub === "status") {
        const stats = getEngineStats();
        const workers = getWorkerStates();
        return res.json({
          lines: [
            sep(),
            line("AGENT FLEET STATUS", "success"),
            sep(),
            ...workers.map((w) => line(`  ${w.name.padEnd(20)} ${w.status.toUpperCase().padEnd(8)} ${w.tasksCompleted} tasks`, w.status === "busy" ? "success" : "muted")),
            line(`  CYCLES: ${stats.cycleCount}`, "muted"),
            sep(),
          ],
        });
      }
      return res.json({ lines: [line(`Subcomando fleet inválido: "${sub}"`, "error"), line("Use: fleet on | off | trigger | status | autonomy <level>", "muted")] });
    }

    if (command === "create") {
      const { flags, positional } = parseArgs(rest);
      const title = positional.join(" ") || flags["title"];
      if (!title) return res.json({ lines: [line("Título é obrigatório.", "error"), line("Uso: create <titulo> [--cat <categoria>] [--priority <nivel>] [--desc \"texto\"]", "muted")] });
      const category = normalizeCategory(flags["cat"] ?? flags["category"] ?? "other");
      const priority = normalizePriority(flags["priority"] ?? flags["p"] ?? "medium");
      const description = flags["desc"] ?? flags["description"] ?? null;
      const [task] = await db.insert(tasksTable).values({ title, description, category: category as any, priority: priority as any }).returning();
      await db.insert(activityTable).values({ type: "task_created", message: `Directive "${task.title}" created via terminal`, entityId: task.id, entityType: "task" });
      return res.json({ lines: [line(`DIRECTIVE #${String(task.id).padStart(4, "0")} CREATED — "${task.title}"`, "success")], invalidate: ["tasks", "dashboard"] });
    }

    if (command === "execute" || command === "exec" || command === "run-task") {
      const idRaw = rest[0];
      const id = parseInt(idRaw ?? "");
      if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: execute <id>", "muted")] });
      const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, id) });
      if (!task) return res.json({ lines: [line(`Directive #${String(id).padStart(4, "0")} não encontrada.`, "error")] });
      if (task.status === "running") return res.json({ lines: [line(`Directive #${String(id).padStart(4, "0")} já está em execução.`, "warn")] });
      if (task.status === "done") return res.json({ lines: [line(`Directive #${String(id).padStart(4, "0")} já foi concluída.`, "warn")] });
      void executeTaskAutonomously(id).catch(() => {});
      await db.insert(activityTable).values({ type: "task_executed", message: `Directive "${task.title}" executed via terminal`, entityId: id, entityType: "task" });
      return res.json({ lines: [line(`> iniciando execução de #${String(id).padStart(4, "0")}...`, "muted"), line(`DIRECTIVE #${String(id).padStart(4, "0")} EXECUTING — "${task.title}"`, "success")], invalidate: ["tasks", "dashboard"] });
    }

    if (command === "delete" || command === "rm") {
      const sub = rest[0]?.toLowerCase();
      if (sub === "deploy" || sub === "deployment") {
        const idRaw = rest[1];
        const id = parseInt(idRaw ?? "");
        if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: delete deploy <id>", "muted")] });
        const dep = await db.query.deploymentsTable.findFirst({ where: eq(deploymentsTable.id, id) });
        if (!dep) return res.json({ lines: [line(`Deploy #${id} não encontrado.`, "error")] });
        await db.delete(deploymentsTable).where(eq(deploymentsTable.id, id));
        return res.json({ lines: [line(`DEPLOY #${id} REMOVED — "${dep.name}"`, "warn")], invalidate: ["deploys", "dashboard"] });
      }
      if (sub === "integration") {
        const idRaw = rest[1];
        const id = parseInt(idRaw ?? "");
        if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: delete integration <id>", "muted")] });
        const integ = await db.query.integrationsTable.findFirst({ where: eq(integrationsTable.id, id) });
        if (!integ) return res.json({ lines: [line(`Integration #${id} não encontrada.`, "error")] });
        await db.delete(integrationsTable).where(eq(integrationsTable.id, id));
        return res.json({ lines: [line(`INTEGRATION #${id} REMOVED — "${integ.name}"`, "warn")], invalidate: ["integrations", "dashboard"] });
      }
      const idRaw = sub;
      const id = parseInt(idRaw ?? "");
      if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: delete <id> | delete deploy <id> | delete integration <id>", "muted")] });
      const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, id) });
      if (!task) return res.json({ lines: [line(`Directive #${String(id).padStart(4, "0")} não encontrada.`, "error")] });
      await db.delete(tasksTable).where(eq(tasksTable.id, id));
      return res.json({ lines: [line(`DIRECTIVE #${String(id).padStart(4, "0")} DELETED — "${task.title}"`, "warn")], invalidate: ["tasks", "dashboard"] });
    }

    if (command === "deploy") {
      const sub = rest[0]?.toLowerCase();
      if (sub === "create" || sub === "new" || sub === "add") {
        const { flags, positional } = parseArgs(rest.slice(1));
        const name = positional.join(" ") || flags["name"];
        const network = flags["network"] ?? flags["net"] ?? flags["n"] ?? "ethereum";
        const contractAddress = flags["addr"] ?? flags["address"] ?? undefined;
        const txHash = flags["tx"] ?? flags["hash"] ?? undefined;
        if (!name) return res.json({ lines: [line("Nome é obrigatório.", "error"), line("Uso: deploy create <name> --network <net>", "muted")] });
        const [dep] = await db.insert(deploymentsTable).values({ name, network, contractAddress: contractAddress ?? null, txHash: txHash ?? null, status: "pending" } as any).returning();
        await db.insert(activityTable).values({ type: "deployment_created", message: `Deployment "${dep.name}" registered via terminal`, entityId: dep.id, entityType: "deployment" });
        return res.json({ lines: [line(`DEPLOY #${dep.id} REGISTERED — "${dep.name}" on ${network}`, "success")], invalidate: ["deploys", "dashboard"] });
      }
      if (sub === "delete" || sub === "remove" || sub === "rm") {
        const idRaw = rest[1];
        const id = parseInt(idRaw ?? "");
        if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: deploy delete <id>", "muted")] });
        const dep = await db.query.deploymentsTable.findFirst({ where: eq(deploymentsTable.id, id) });
        if (!dep) return res.json({ lines: [line(`Deploy #${id} não encontrado.`, "error")] });
        await db.delete(deploymentsTable).where(eq(deploymentsTable.id, id));
        return res.json({ lines: [line(`DEPLOY #${id} REMOVED — "${dep.name}"`, "warn")], invalidate: ["deploys", "dashboard"] });
      }
      if (sub === "ls" || sub === "list") {
        const deploys = await db.query.deploymentsTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 10 });
        if (!deploys.length) return res.json({ lines: [line("No deployments found.", "muted")] });
        return res.json({ lines: [sep(), line(`DEPLOYMENTS (${deploys.length})`, "success"), sep(), ...deploys.map((d) => line(`  #${d.id}  ${d.status.padEnd(12)} [${d.network.padEnd(16)}]  ${d.name}`, d.status === "success" ? "success" : d.status === "failed" ? "error" : "muted")), sep()] });
      }
      return res.json({ lines: [line(`Subcomando inválido: "${sub}"`, "error"), line("Use: deploy create <name> --network <net> | deploy delete <id> | deploy ls", "muted")] });
    }

    if (command === "integration") {
      const sub = rest[0]?.toLowerCase();
      if (sub === "add" || sub === "create" || sub === "new") {
        const { flags, positional } = parseArgs(rest.slice(1));
        const name = positional.join(" ") || flags["name"];
        const type = normalizeIntegrationType(flags["type"] ?? flags["t"] ?? "other");
        const network = flags["network"] ?? flags["net"] ?? undefined;
        const endpoint = flags["endpoint"] ?? flags["url"] ?? undefined;
        if (!name) return res.json({ lines: [line("Nome é obrigatório.", "error"), line("Uso: integration add <name> --type <type>", "muted")] });
        const [integ] = await db.insert(integrationsTable).values({ name, type: type as any, network: network ?? null, endpoint: endpoint ?? null, status: "active" } as any).returning();
        await db.insert(activityTable).values({ type: "integration_added", message: `Integration "${integ.name}" configured via terminal`, entityId: integ.id, entityType: "integration" });
        return res.json({ lines: [line(`INTEGRATION #${integ.id} ADDED — "${integ.name}" [${type}]`, "success")], invalidate: ["integrations", "dashboard"] });
      }
      if (sub === "enable" || sub === "activate") {
        const idRaw = rest[1];
        const id = parseInt(idRaw ?? "");
        if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: integration enable <id>", "muted")] });
        const integ = await db.query.integrationsTable.findFirst({ where: eq(integrationsTable.id, id) });
        if (!integ) return res.json({ lines: [line(`Integration #${id} não encontrada.`, "error")] });
        await db.update(integrationsTable).set({ status: "active" }).where(eq(integrationsTable.id, id));
        return res.json({ lines: [line(`INTEGRATION #${id} ENABLED — "${integ.name}"`, "success")], invalidate: ["integrations", "dashboard"] });
      }
      if (sub === "disable" || sub === "deactivate") {
        const idRaw = rest[1];
        const id = parseInt(idRaw ?? "");
        if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: integration disable <id>", "muted")] });
        const integ = await db.query.integrationsTable.findFirst({ where: eq(integrationsTable.id, id) });
        if (!integ) return res.json({ lines: [line(`Integration #${id} não encontrada.`, "error")] });
        await db.update(integrationsTable).set({ status: "inactive" }).where(eq(integrationsTable.id, id));
        return res.json({ lines: [line(`INTEGRATION #${id} DISABLED — "${integ.name}"`, "warn")], invalidate: ["integrations", "dashboard"] });
      }
      if (sub === "delete" || sub === "remove" || sub === "rm") {
        const idRaw = rest[1];
        const id = parseInt(idRaw ?? "");
        if (!idRaw || isNaN(id)) return res.json({ lines: [line("ID inválido.", "error"), line("Uso: integration delete <id>", "muted")] });
        const integ = await db.query.integrationsTable.findFirst({ where: eq(integrationsTable.id, id) });
        if (!integ) return res.json({ lines: [line(`Integration #${id} não encontrada.`, "error")] });
        await db.delete(integrationsTable).where(eq(integrationsTable.id, id));
        return res.json({ lines: [line(`INTEGRATION #${id} REMOVED — "${integ.name}"`, "warn")], invalidate: ["integrations", "dashboard"] });
      }
      if (sub === "ls" || sub === "list") {
        const integs = await db.query.integrationsTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 10 });
        return res.json({ lines: [sep(), line(`INTEGRATIONS (${integs.length})`, "success"), sep(), ...integs.map((i) => line(`  #${i.id}  ${i.status.padEnd(10)} [${i.type.padEnd(16)}]  ${i.name}`, i.status === "active" ? "success" : "muted")), sep()] });
      }
      return res.json({ lines: [line(`Subcomando inválido: "${sub}"`, "error"), line("Use: integration add | enable | disable | delete | ls", "muted")] });
    }

    if (command === "ls" || command === "list") {
      const sub = rest[0]?.toLowerCase();
      if (!sub || sub === "tasks" || sub === "directives") {
        const tasks = await db.query.tasksTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 10 });
        if (!tasks.length) return res.json({ lines: [line("No directives found.", "muted")] });
        return res.json({ lines: [sep(), line(`DIRECTIVES (last ${tasks.length})`, "success"), sep(), ...tasks.map((t) => line(`  #${String(t.id).padStart(4, "0")}  ${t.status.padEnd(18)} [${t.priority.padEnd(8)}]  ${t.title}`, t.status === "done" ? "success" : t.status === "running" ? "info" : t.status === "failed" ? "error" : t.status === "awaiting_approval" ? "warn" : "muted")), sep()] });
      }
      if (sub === "deploys" || sub === "deployments") {
        const deploys = await db.query.deploymentsTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 8 });
        if (!deploys.length) return res.json({ lines: [line("No deployments found.", "muted")] });
        return res.json({ lines: [sep(), line(`DEPLOYMENTS (last ${deploys.length})`, "success"), sep(), ...deploys.map((d) => line(`  #${d.id}  ${d.status.padEnd(12)} [${d.network.padEnd(16)}]  ${d.name}`, d.status === "success" ? "success" : d.status === "failed" ? "error" : "muted")), sep()] });
      }
      if (sub === "integrations") {
        const integs = await db.query.integrationsTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 8 });
        return res.json({ lines: [sep(), line(`INTEGRATIONS (${integs.length})`, "success"), sep(), ...integs.map((i) => line(`  #${i.id}  ${i.status.padEnd(10)} [${i.type.padEnd(16)}]  ${i.name}`, i.status === "active" ? "success" : "muted")), sep()] });
      }
      return res.json({ lines: [line(`Unknown list target: "${sub}". Try: ls | ls tasks | ls deploys | ls integrations`, "warn")] });
    }

    {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return res.json({ lines: [line(`Command not found: "${command}"`, "error"), line("Type 'help' for available commands.", "muted")] });
      }

      const groq = new Groq({ apiKey: groqKey });

      const [cfg, tasks, deploys, integrations] = await Promise.all([
        db.query.agentConfigTable.findFirst(),
        db.query.tasksTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 5 }),
        db.query.deploymentsTable.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 3 }),
        db.query.integrationsTable.findMany({ where: eq(integrationsTable.status, "active"), limit: 5 }),
      ]);
      const stats = getEngineStats();
      const workers = getWorkerStates();

      const systemContext = `You are SCR3P, an autonomous AI agent orchestration system. You are the terminal interface of the SCR3P Executor — a mission control platform for deploying and managing autonomous AI agents.

Current system state:
- Engine enabled: ${cfg?.isEnabled ?? false}
- Autonomy level: ${cfg?.autonomyLevel ?? "manual"}
- Total cycles run: ${stats.cycleCount}
- Last cycle: ${stats.lastCycleAt ? stats.lastCycleAt.toISOString() : "never"}
- Active tasks: ${tasks.filter(t => t.status === "running").length}
- Pending tasks: ${tasks.filter(t => t.status === "pending").length}
- Done tasks: ${tasks.filter(t => t.status === "done").length}
- Recent tasks: ${tasks.map(t => `#${t.id} "${t.title}" [${t.status}]`).join(", ") || "none"}
- Recent deploys: ${deploys.map(d => `#${d.id} "${d.name}" [${d.status}]`).join(", ") || "none"}
- Active integrations: ${integrations.map(i => `#${i.id} ${i.name} [${i.type}]`).join(", ") || "none"}
- Agent workers: ${workers.map(w => `${w.name}(${w.status})`).join(", ") || "none"}

Available terminal commands:
SYSTEM: status, run, stop, autonomy <level>, goto <section>
AGENT FLEET: fleet on|off|trigger|status|autonomy <level>
DIRECTIVES: create <title> [--cat <cat>] [--priority <p>] [--desc "<d>"], execute <id>, delete <id>, ls
DEPLOYS: deploy create <name> --network <net> [--addr <addr>] [--tx <hash>], deploy delete <id>, ls deploys
INTEGRATIONS: integration add <name> --type <type> [--network <net>] [--endpoint <url>], integration enable <id>, integration disable <id>, integration delete <id>, ls integrations
NAVIGATION: goto home|agent|directives|deploys|integrations

You respond as SCR3P — a sharp, direct, technical AI agent. Keep responses concise and actionable. Use plain text only, no markdown. If the user asks you to do something that maps to a terminal command, suggest the exact command they should type. Answer in the same language the user writes in.`;

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemContext },
          { role: "user", content: raw },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content?.trim() ?? "No response from agent.";
      const replyLines = reply.split("\n").filter(l => l.trim() !== "").map(l => line(l, "info"));

      return res.json({
        lines: [
          line("◈ SCR3P AGENT", "success"),
          ...replyLines,
        ],
      });
    }
  } catch (err: any) {
    return res.json({ lines: [line(`SYSTEM ERROR: ${err?.message ?? "unknown error"}`, "error")] });
  }
});

export default router;
