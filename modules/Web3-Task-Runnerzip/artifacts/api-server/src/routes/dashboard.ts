import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, deploymentsTable, integrationsTable, activityTable, agentConfigTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const [tasks, deployments, integrations, agentCfg] = await Promise.all([
    db.select({ status: tasksTable.status, count: sql<number>`count(*)::int` })
      .from(tasksTable)
      .groupBy(tasksTable.status),
    db.select({ status: deploymentsTable.status, count: sql<number>`count(*)::int` })
      .from(deploymentsTable)
      .groupBy(deploymentsTable.status),
    db.select({ status: integrationsTable.status, count: sql<number>`count(*)::int` })
      .from(integrationsTable)
      .groupBy(integrationsTable.status),
    db.query.agentConfigTable.findFirst(),
  ]);

  const taskMap = Object.fromEntries(tasks.map((t) => [t.status, t.count]));
  const deployMap = Object.fromEntries(deployments.map((d) => [d.status, d.count]));
  const integMap = Object.fromEntries(integrations.map((i) => [i.status, i.count]));

  res.json({
    totalTasks: tasks.reduce((s, t) => s + t.count, 0),
    runningTasks: taskMap["running"] ?? 0,
    doneTasks: taskMap["done"] ?? 0,
    failedTasks: taskMap["failed"] ?? 0,
    awaitingApprovalTasks: taskMap["awaiting_approval"] ?? 0,
    totalDeployments: deployments.reduce((s, d) => s + d.count, 0),
    successDeployments: deployMap["success"] ?? 0,
    activeIntegrations: integMap["active"] ?? 0,
    totalIntegrations: integrations.reduce((s, i) => s + i.count, 0),
    agentAutonomy: agentCfg?.autonomyLevel ?? "manual",
  });
});

router.get("/dashboard/activity", async (req, res) => {
  const activity = await db.query.activityTable.findMany({
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit: 20,
  });

  res.json(
    activity.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    }))
  );
});

export default router;
