import { Router } from "express";
import { db } from "@workspace/db";
import { agentConfigTable, activityTable, tasksTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { UpdateAgentConfigBody } from "@workspace/api-zod";
import { getEngineStats, runCycle, restartLoop, getWorkerStates } from "../lib/agent-engine";

const router = Router();

async function getOrCreateConfig() {
  const existing = await db.query.agentConfigTable.findFirst();
  if (existing) return existing;
  const [created] = await db.insert(agentConfigTable).values({}).returning();
  return created;
}

function serializeWorkers() {
  return getWorkerStates().map((w) => ({
    id: w.id,
    name: w.name,
    role: w.role,
    categories: w.categories,
    status: w.status,
    currentTaskId: w.currentTaskId ?? null,
    currentTaskTitle: w.currentTaskTitle ?? null,
    tasksCompleted: w.tasksCompleted,
    lastActiveAt: w.lastActiveAt?.toISOString() ?? null,
  }));
}

async function buildStatusPayload(cfg: Awaited<ReturnType<typeof getOrCreateConfig>>) {
  const stats = getEngineStats();
  const [pending] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "pending"));
  const [running] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "running"));
  const [awaiting] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "awaiting_approval"));

  return {
    isRunning: cfg.isEnabled && cfg.autonomyLevel !== "manual",
    autonomyLevel: cfg.autonomyLevel,
    lastCycleAt: stats.lastCycleAt?.toISOString() ?? null,
    cycleCount: stats.cycleCount,
    tasksProcessedTotal: stats.tasksProcessedTotal,
    pendingTaskCount: pending?.count ?? 0,
    runningTaskCount: running?.count ?? 0,
    awaitingApprovalCount: awaiting?.count ?? 0,
    nextCycleIn: stats.nextCycleIn,
    workers: serializeWorkers(),
  };
}

router.get("/agent/config", async (req, res) => {
  const cfg = await getOrCreateConfig();
  res.json({ ...cfg, updatedAt: cfg.updatedAt.toISOString() });
});

router.patch("/agent/config", async (req, res) => {
  const body = UpdateAgentConfigBody.parse(req.body);
  const cfg = await getOrCreateConfig();

  const [updated] = await db
    .update(agentConfigTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(agentConfigTable.id, cfg.id))
    .returning();

  if (body.executionIntervalSec) {
    restartLoop(body.executionIntervalSec);
  }

  res.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
});

router.get("/agent/status", async (req, res) => {
  const cfg = await getOrCreateConfig();
  res.json(await buildStatusPayload(cfg));
});

router.post("/agent/trigger", async (req, res) => {
  await runCycle();
  const cfg = await getOrCreateConfig();

  await db.insert(activityTable).values({
    type: "agent_cycle",
    message: "Agent cycle triggered manually",
    entityType: "agent",
  });

  res.json(await buildStatusPayload(cfg));
});

export default router;
