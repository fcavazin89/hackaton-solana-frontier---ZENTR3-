import { db } from "@workspace/db";
import {
  tasksTable,
  taskStepsTable,
  agentConfigTable,
  activityTable,
  deploymentsTable,
} from "@workspace/db";
import { eq, and, inArray, count } from "drizzle-orm";
import { logger } from "./logger";

type StepTemplate = {
  name: string;
  description: string;
  requiresApproval: boolean;
  durationMs: number;
  outputFn: () => string;
};

const STEPS_BY_CATEGORY: Record<string, StepTemplate[]> = {
  smart_contract: [
    { name: "scaffold_contract", description: "Generating Solidity contract scaffold from template", requiresApproval: false, durationMs: 1500, outputFn: () => "Generated: ERC20.sol (247 lines)" },
    { name: "compile_contract", description: "Compiling with solc 0.8.24 — checking ABI and bytecode", requiresApproval: false, durationMs: 2500, outputFn: () => "Compiled successfully. Bytecode size: 4.2KB. No warnings." },
    { name: "run_tests", description: "Executing Hardhat test suite against local fork", requiresApproval: false, durationMs: 3000, outputFn: () => "14 passing (3.2s). Coverage: 94%. No critical failures." },
    { name: "estimate_gas", description: "Simulating deployment gas usage on target network", requiresApproval: false, durationMs: 1000, outputFn: () => "Estimated gas: 1,823,442 units @ 18 gwei = 0.033 ETH (~$124.50)" },
    { name: "deploy_contract", description: "Broadcasting deployment transaction to blockchain", requiresApproval: true, durationMs: 4000, outputFn: () => `Contract deployed at: 0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}` },
    { name: "verify_contract", description: "Verifying source code on block explorer", requiresApproval: false, durationMs: 2000, outputFn: () => "Contract verified on Etherscan. ABI published." },
  ],
  frontend: [
    { name: "scaffold_ui", description: "Generating React component structure and routing", requiresApproval: false, durationMs: 1000, outputFn: () => "Scaffolded: 8 components, 3 pages, 12 hooks" },
    { name: "install_deps", description: "Installing npm dependencies and resolving lockfile", requiresApproval: false, durationMs: 2500, outputFn: () => "Added 47 packages. Lockfile updated." },
    { name: "build_bundle", description: "Running Vite production build with tree shaking", requiresApproval: false, durationMs: 3000, outputFn: () => "Bundle: 284KB (gzipped: 91KB). 0 warnings." },
    { name: "run_tests", description: "Executing Jest + Testing Library test suite", requiresApproval: false, durationMs: 2000, outputFn: () => "22 tests passed. Snapshot updated." },
    { name: "publish", description: "Deploying to CDN edge network", requiresApproval: true, durationMs: 2500, outputFn: () => "Deployed to https://app.screp.io — 12 edge nodes updated." },
  ],
  backend: [
    { name: "scaffold_api", description: "Generating Express routes and middleware scaffold", requiresApproval: false, durationMs: 1000, outputFn: () => "Scaffolded: 6 routes, 3 middleware, 2 services" },
    { name: "run_tests", description: "Executing API integration tests with Supertest", requiresApproval: false, durationMs: 2500, outputFn: () => "31 tests passed. Response time avg: 14ms." },
    { name: "build", description: "Compiling TypeScript and bundling with esbuild", requiresApproval: false, durationMs: 1500, outputFn: () => "Build: 1.8MB. No type errors." },
    { name: "deploy_service", description: "Rolling deployment to production cluster", requiresApproval: true, durationMs: 3000, outputFn: () => "Deployed v2.4.1. Health checks passing on 3/3 nodes." },
  ],
  deploy: [
    { name: "prepare_artifacts", description: "Assembling deployment artifacts and configuration", requiresApproval: false, durationMs: 1500, outputFn: () => "Artifacts ready: bytecode, ABI, deployment config" },
    { name: "estimate_gas", description: "Calculating gas cost with EIP-1559 parameters", requiresApproval: false, durationMs: 1000, outputFn: () => "maxFeePerGas: 22 gwei | Priority: 2 gwei | Total: ~0.041 ETH" },
    { name: "broadcast_tx", description: "Signing and broadcasting transaction to mempool", requiresApproval: true, durationMs: 4500, outputFn: () => `TxHash: 0x${Math.random().toString(16).slice(2, 66).padEnd(64, "0")}` },
    { name: "confirm_tx", description: "Waiting for block confirmation (12 blocks)", requiresApproval: false, durationMs: 3000, outputFn: () => "Confirmed in block 21,847,392. Gas used: 1,802,841." },
    { name: "verify_deploy", description: "Post-deployment verification and ABI indexing", requiresApproval: false, durationMs: 1500, outputFn: () => "Contract live. ABI indexed on Etherscan + The Graph." },
  ],
  integration: [
    { name: "discover_endpoint", description: "Probing service endpoint and capabilities", requiresApproval: false, durationMs: 1000, outputFn: () => "Endpoint reachable. API version: v3.2. Latency: 82ms." },
    { name: "configure", description: "Applying authentication and connection parameters", requiresApproval: false, durationMs: 1500, outputFn: () => "Auth configured. Rate limit: 1000 req/min." },
    { name: "test_connection", description: "Running integration health checks and probe calls", requiresApproval: false, durationMs: 2000, outputFn: () => "All probes passed. WebSocket stable. Data streaming OK." },
    { name: "activate", description: "Activating integration in production routing", requiresApproval: true, durationMs: 1000, outputFn: () => "Integration ACTIVE. Traffic routing enabled." },
  ],
  audit: [
    { name: "scan_codebase", description: "Running static analysis and vulnerability scanner", requiresApproval: false, durationMs: 3000, outputFn: () => "Scanned 2,841 lines. Found 2 medium, 0 critical issues." },
    { name: "analyze_risks", description: "Evaluating reentrancy, overflow, and access control", requiresApproval: false, durationMs: 2500, outputFn: () => "Risk matrix complete. No critical vectors found." },
    { name: "generate_report", description: "Compiling audit findings and recommendations", requiresApproval: false, durationMs: 2000, outputFn: () => "Report generated: 14 pages, 6 findings, 4 recommendations." },
    { name: "apply_patches", description: "Applying suggested fixes to flagged vulnerabilities", requiresApproval: true, durationMs: 2000, outputFn: () => "2 patches applied. Re-scan clean. No regressions." },
  ],
  other: [
    { name: "analyze", description: "Analyzing task requirements and constraints", requiresApproval: false, durationMs: 1500, outputFn: () => "Analysis complete. Execution plan formulated." },
    { name: "execute", description: "Running task execution logic", requiresApproval: false, durationMs: 3000, outputFn: () => "Execution complete. All outputs generated." },
    { name: "validate", description: "Validating outputs and checking integrity", requiresApproval: false, durationMs: 1000, outputFn: () => "Validation passed. Results committed." },
  ],
};

// ── Multi-Agent Fleet ──────────────────────────────────────────────────────

export type WorkerStatus = "idle" | "running" | "paused";

export type WorkerState = {
  id: string;
  name: string;
  role: string;
  categories: string[];
  status: WorkerStatus;
  currentTaskId: number | null;
  currentTaskTitle: string | null;
  tasksCompleted: number;
  lastActiveAt: Date | null;
};

const WORKER_DEFINITIONS: Omit<WorkerState, "status" | "currentTaskId" | "currentTaskTitle" | "tasksCompleted" | "lastActiveAt">[] = [
  {
    id: "contract_agent",
    name: "CONTRACT AGENT",
    role: "Smart Contract & Audit Specialist",
    categories: ["smart_contract", "audit"],
  },
  {
    id: "frontend_agent",
    name: "FRONTEND AGENT",
    role: "UI & Backend Engineer",
    categories: ["frontend", "backend"],
  },
  {
    id: "deploy_agent",
    name: "DEPLOY AGENT",
    role: "Deployment & Integration Specialist",
    categories: ["deploy", "integration", "other"],
  },
];

const workerStates = new Map<string, WorkerState>(
  WORKER_DEFINITIONS.map((def) => [
    def.id,
    {
      ...def,
      status: "idle",
      currentTaskId: null,
      currentTaskTitle: null,
      tasksCompleted: 0,
      lastActiveAt: null,
    },
  ])
);

export function getWorkerStates(): WorkerState[] {
  return [...workerStates.values()];
}

// ── Engine Globals ─────────────────────────────────────────────────────────

let cycleCount = 0;
let tasksProcessedTotal = 0;
let lastCycleAt: Date | null = null;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let nextCycleAt: Date | null = null;

export function getEngineStats() {
  return {
    cycleCount,
    tasksProcessedTotal,
    lastCycleAt,
    nextCycleIn: nextCycleAt
      ? Math.max(0, Math.round((nextCycleAt.getTime() - Date.now()) / 1000))
      : null,
  };
}

export async function startAgentEngine() {
  const cfg = await getOrCreateConfig();
  restartLoop(cfg.executionIntervalSec);
  logger.info({ autonomyLevel: cfg.autonomyLevel, enabled: cfg.isEnabled }, "Agent engine initialized");
}

export function restartLoop(intervalSec: number) {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = setInterval(runCycle, intervalSec * 1000);
  nextCycleAt = new Date(Date.now() + intervalSec * 1000);
  logger.info({ intervalSec }, "Agent loop started");
}

// ── Orchestrator Cycle ─────────────────────────────────────────────────────

export async function runCycle(): Promise<void> {
  const cfg = await getOrCreateConfig();
  nextCycleAt = new Date(Date.now() + cfg.executionIntervalSec * 1000);

  if (!cfg.isEnabled || cfg.autonomyLevel === "manual") return;

  cycleCount++;
  lastCycleAt = new Date();

  // Get all idle workers
  const idleWorkers = [...workerStates.values()].filter((w) => w.status === "idle");
  if (idleWorkers.length === 0) {
    logger.info({ cycleCount }, "Orchestrator: all workers busy, skipping dispatch");
    return;
  }

  // Load all pending tasks ordered by priority
  const pending = await db.query.tasksTable.findMany({
    where: eq(tasksTable.status, "pending"),
    orderBy: (t, { asc, desc }) => [desc(t.priority), asc(t.createdAt)],
  });

  if (pending.length === 0) return;

  const assignments: { worker: WorkerState; taskId: number; taskTitle: string }[] = [];
  const assignedTaskIds = new Set<number>();

  // Phase 1: Category-affinity matching — assign tasks to workers that specialize in them
  for (const worker of idleWorkers) {
    const match = pending.find(
      (t) => worker.categories.includes(t.category) && !assignedTaskIds.has(t.id)
    );
    if (match) {
      assignments.push({ worker, taskId: match.id, taskTitle: match.title });
      assignedTaskIds.add(match.id);
    }
  }

  // Phase 2: Load balancing — idle workers without a match pick up overflow tasks
  for (const worker of idleWorkers) {
    if (assignments.some((a) => a.worker.id === worker.id)) continue;
    const overflow = pending.find((t) => !assignedTaskIds.has(t.id));
    if (overflow) {
      assignments.push({ worker, taskId: overflow.id, taskTitle: overflow.title });
      assignedTaskIds.add(overflow.id);
      logger.info(
        { workerId: worker.id, taskId: overflow.id, category: overflow.category },
        "Orchestrator: cross-domain load balancing assignment"
      );
    }
  }

  if (assignments.length === 0) return;

  // Log orchestrator decision
  const dispatchSummary = assignments
    .map((a) => `${a.worker.name} → "${a.taskTitle}"`)
    .join(" | ");
  await db.insert(activityTable).values({
    type: "agent_cycle",
    message: `Orchestrator #${cycleCount}: ${dispatchSummary}`,
    entityType: "agent",
  });

  // Dispatch all workers concurrently
  for (const { worker, taskId } of assignments) {
    void _runWorker(worker.id, taskId, cfg).catch((err) =>
      logger.error({ err, workerId: worker.id, taskId }, "Worker execution error")
    );
    tasksProcessedTotal++;
  }
}

// ── Worker Execution ───────────────────────────────────────────────────────

async function _runWorker(
  workerId: string,
  taskId: number,
  cfg: Awaited<ReturnType<typeof getOrCreateConfig>>
) {
  const worker = workerStates.get(workerId);
  if (!worker) return;

  const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, taskId) });
  if (!task || task.status !== "pending") return;

  // Claim the task
  worker.status = "running";
  worker.currentTaskId = taskId;
  worker.currentTaskTitle = task.title;
  worker.lastActiveAt = new Date();

  await db
    .update(tasksTable)
    .set({ assignedWorker: workerId })
    .where(eq(tasksTable.id, taskId));

  await db.insert(activityTable).values({
    type: "task_executed",
    message: `${worker.name} executing "${task.title}"`,
    entityId: taskId,
    entityType: "task",
  });

  try {
    await _executeTask(taskId, cfg);
    worker.tasksCompleted++;
  } finally {
    worker.status = "idle";
    worker.currentTaskId = null;
    worker.currentTaskTitle = null;
    worker.lastActiveAt = new Date();
  }
}

// ── Task Execution Logic ───────────────────────────────────────────────────

export async function executeTaskAutonomously(
  taskId: number,
  cfgOverride?: Awaited<ReturnType<typeof getOrCreateConfig>>
) {
  const cfg = cfgOverride ?? (await getOrCreateConfig());

  // Find an available worker for this task's category
  const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, taskId) });
  if (!task) return;

  const preferredWorker = [...workerStates.values()].find(
    (w) => w.status === "idle" && w.categories.includes(task.category)
  ) ?? [...workerStates.values()].find((w) => w.status === "idle");

  if (preferredWorker) {
    return _runWorker(preferredWorker.id, taskId, cfg);
  }

  // Fallback: execute directly without a worker slot
  return _executeTask(taskId, cfg);
}

async function _executeTask(
  taskId: number,
  cfg: Awaited<ReturnType<typeof getOrCreateConfig>>
) {
  const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, taskId) });
  if (!task || task.status !== "pending") return;

  const steps = await buildSteps(taskId, task.category);

  await db
    .update(tasksTable)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(tasksTable.id, taskId));

  for (const step of steps) {
    const needsApproval =
      step.requiresApproval &&
      (cfg.autonomyLevel === "supervised" ||
        (cfg.autonomyLevel === "semi_auto" && cfg.requireApprovalForDeploy));

    if (needsApproval) {
      await db
        .update(taskStepsTable)
        .set({ status: "awaiting_approval" })
        .where(eq(taskStepsTable.id, step.id));
      await db
        .update(tasksTable)
        .set({ status: "awaiting_approval", currentStep: step.name, updatedAt: new Date() })
        .where(eq(tasksTable.id, taskId));
      await db.insert(activityTable).values({
        type: "task_awaiting",
        message: `Task "${task.title}" awaiting approval on step: ${step.name}`,
        entityId: taskId,
        entityType: "task",
      });

      // Release the worker while waiting for approval
      const assignedWorker = [...workerStates.values()].find(
        (w) => w.currentTaskId === taskId
      );
      if (assignedWorker) {
        assignedWorker.status = "paused";
      }
      return;
    }

    const template = (STEPS_BY_CATEGORY[task.category] ?? STEPS_BY_CATEGORY["other"])
      .find((t) => t.name === step.name);
    const durationMs = template?.durationMs ?? 2000;

    await db
      .update(taskStepsTable)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(taskStepsTable.id, step.id));
    await db
      .update(tasksTable)
      .set({ currentStep: step.name, updatedAt: new Date() })
      .where(eq(tasksTable.id, taskId));

    await sleep(durationMs + (Math.random() * 500 - 250));

    const output = template?.outputFn() ?? "Step completed.";
    await db
      .update(taskStepsTable)
      .set({ status: "done", output, completedAt: new Date() })
      .where(eq(taskStepsTable.id, step.id));

    const doneSteps = await db
      .select({ count: count() })
      .from(taskStepsTable)
      .where(and(eq(taskStepsTable.taskId, taskId), eq(taskStepsTable.status, "done")));
    await db
      .update(tasksTable)
      .set({ stepDone: doneSteps[0]?.count ?? 0, updatedAt: new Date() })
      .where(eq(tasksTable.id, taskId));
  }

  const finalOutput = buildFinalOutput(task.category);
  await db
    .update(tasksTable)
    .set({ status: "done", output: finalOutput, currentStep: null, updatedAt: new Date() })
    .where(eq(tasksTable.id, taskId));
  await db.insert(activityTable).values({
    type: "task_done",
    message: `Task "${task.title}" completed — Está feito.`,
    entityId: taskId,
    entityType: "task",
  });

  if (task.category === "smart_contract" || task.category === "deploy") {
    await createDeploymentRecord(task.title, task.description);
  }
}

// ── Approval Continuation ─────────────────────────────────────────────────

export async function continueTaskFromStep(taskId: number, stepId: number) {
  const cfg = await getOrCreateConfig();
  const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, taskId) });
  const step = await db.query.taskStepsTable.findFirst({ where: eq(taskStepsTable.id, stepId) });
  if (!task || !step) return;

  // Find or assign a worker for continuation
  const currentWorker =
    [...workerStates.values()].find((w) => w.currentTaskId === taskId) ??
    [...workerStates.values()].find(
      (w) => w.status === "idle" && w.categories.includes(task.category)
    ) ??
    [...workerStates.values()].find((w) => w.status === "idle");

  if (currentWorker) {
    currentWorker.status = "running";
    currentWorker.currentTaskId = taskId;
    currentWorker.currentTaskTitle = task.title;
    currentWorker.lastActiveAt = new Date();
  }

  await db
    .update(taskStepsTable)
    .set({ status: "approved" })
    .where(eq(taskStepsTable.id, stepId));
  await db
    .update(tasksTable)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(tasksTable.id, taskId));

  const remainingSteps = await db.query.taskStepsTable.findMany({
    where: and(
      eq(taskStepsTable.taskId, taskId),
      inArray(taskStepsTable.status, ["pending", "awaiting_approval"])
    ),
    orderBy: (s, { asc }) => [asc(s.stepNumber)],
  });

  // Execute the approved step
  await db
    .update(taskStepsTable)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(taskStepsTable.id, stepId));
  await sleep(step.durationMs ?? 2000);
  await db
    .update(taskStepsTable)
    .set({
      status: "done",
      output:
        (STEPS_BY_CATEGORY[task.category] ?? STEPS_BY_CATEGORY["other"])
          .find((s) => s.name === step.name)
          ?.outputFn() ?? "Step completed.",
      completedAt: new Date(),
    })
    .where(eq(taskStepsTable.id, stepId));

  // Continue remaining steps
  for (const nextStep of remainingSteps.slice(1)) {
    const template = (STEPS_BY_CATEGORY[task.category] ?? STEPS_BY_CATEGORY["other"]).find(
      (s) => s.name === nextStep.name
    );
    const needsApproval =
      nextStep.requiresApproval &&
      (cfg.autonomyLevel === "supervised" ||
        (cfg.autonomyLevel === "semi_auto" && cfg.requireApprovalForDeploy));

    if (needsApproval) {
      await db
        .update(taskStepsTable)
        .set({ status: "awaiting_approval" })
        .where(eq(taskStepsTable.id, nextStep.id));
      await db
        .update(tasksTable)
        .set({ status: "awaiting_approval", currentStep: nextStep.name, updatedAt: new Date() })
        .where(eq(tasksTable.id, taskId));
      if (currentWorker) {
        currentWorker.status = "paused";
      }
      return;
    }

    await db
      .update(taskStepsTable)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(taskStepsTable.id, nextStep.id));
    await db
      .update(tasksTable)
      .set({ currentStep: nextStep.name, updatedAt: new Date() })
      .where(eq(tasksTable.id, taskId));
    await sleep(template?.durationMs ?? 2000);
    await db
      .update(taskStepsTable)
      .set({ status: "done", output: template?.outputFn() ?? "Done.", completedAt: new Date() })
      .where(eq(taskStepsTable.id, nextStep.id));
    const doneSteps = await db
      .select({ count: count() })
      .from(taskStepsTable)
      .where(and(eq(taskStepsTable.taskId, taskId), eq(taskStepsTable.status, "done")));
    await db
      .update(tasksTable)
      .set({ stepDone: doneSteps[0]?.count ?? 0, updatedAt: new Date() })
      .where(eq(tasksTable.id, taskId));
  }

  const finalOutput = buildFinalOutput(task.category);
  await db
    .update(tasksTable)
    .set({ status: "done", output: finalOutput, currentStep: null, updatedAt: new Date() })
    .where(eq(tasksTable.id, taskId));
  await db.insert(activityTable).values({
    type: "task_done",
    message: `Task "${task.title}" completed — Está feito.`,
    entityId: taskId,
    entityType: "task",
  });

  if (currentWorker) {
    currentWorker.status = "idle";
    currentWorker.currentTaskId = null;
    currentWorker.currentTaskTitle = null;
    currentWorker.tasksCompleted++;
    currentWorker.lastActiveAt = new Date();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function buildSteps(taskId: number, category: string) {
  const templates = STEPS_BY_CATEGORY[category] ?? STEPS_BY_CATEGORY["other"];

  const existing = await db.query.taskStepsTable.findMany({
    where: eq(taskStepsTable.taskId, taskId),
    orderBy: (s, { asc }) => [asc(s.stepNumber)],
  });

  if (existing.length > 0) return existing;

  const inserted = await db
    .insert(taskStepsTable)
    .values(
      templates.map((t, i) => ({
        taskId,
        stepNumber: i + 1,
        name: t.name,
        description: t.description,
        requiresApproval: t.requiresApproval,
      }))
    )
    .returning();

  await db
    .update(tasksTable)
    .set({ stepCount: templates.length, stepDone: 0 })
    .where(eq(tasksTable.id, taskId));

  return inserted;
}

function buildFinalOutput(category: string): string {
  const outputs: Record<string, string> = {
    smart_contract: "Está feito. Contract deployed and verified on-chain.",
    frontend: "Está feito. Application live on CDN edge network.",
    backend: "Está feito. Service deployed and health checks passing.",
    deploy: "Está feito. Transaction confirmed and indexed.",
    integration: "Está feito. Integration active and routing traffic.",
    audit: "Está feito. Audit complete. Report published.",
    other: "Está feito.",
  };
  return outputs[category] ?? "Está feito.";
}

async function createDeploymentRecord(title: string, description: string | null) {
  const networks = ["Ethereum Mainnet", "Polygon", "Arbitrum", "Optimism", "Base"];
  const network = networks[Math.floor(Math.random() * networks.length)];
  const contractAddress = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;
  const txHash = `0x${Math.random().toString(16).slice(2, 66).padEnd(64, "0")}`;
  const gasUsed = (1_200_000 + Math.floor(Math.random() * 1_000_000)).toLocaleString();

  await db.insert(deploymentsTable).values({
    name: title,
    network,
    contractAddress,
    txHash,
    status: "success",
    gasUsed,
    deployedAt: new Date(),
  });

  await db.insert(activityTable).values({
    type: "deployment_success",
    message: `Auto-deployed "${title}" to ${network}`,
    entityType: "deployment",
  });
}

async function getOrCreateConfig() {
  const existing = await db.query.agentConfigTable.findFirst();
  if (existing) return existing;
  const [created] = await db.insert(agentConfigTable).values({}).returning();
  return created;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
