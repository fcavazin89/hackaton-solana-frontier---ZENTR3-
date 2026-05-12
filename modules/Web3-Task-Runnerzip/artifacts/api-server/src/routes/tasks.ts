import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, activityTable, taskStepsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  DeleteTaskParams,
  ExecuteTaskParams,
  ListTasksQueryParams,
} from "@workspace/api-zod";
import { executeTaskAutonomously, continueTaskFromStep } from "../lib/agent-engine";

const router = Router();

router.get("/tasks", async (req, res) => {
  const parsed = ListTasksQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  const tasks = await db.query.tasksTable.findMany({
    where: status ? eq(tasksTable.status, status as any) : undefined,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  res.json(tasks.map(serializeTask));
});

router.post("/tasks", async (req, res) => {
  const body = CreateTaskBody.parse(req.body);
  const [task] = await db
    .insert(tasksTable)
    .values({ ...body })
    .returning();

  await db.insert(activityTable).values({
    type: "task_created",
    message: `Task "${task.title}" created`,
    entityId: task.id,
    entityType: "task",
  });

  res.status(201).json(serializeTask(task));
});

router.get("/tasks/:id", async (req, res) => {
  const { id } = GetTaskParams.parse(req.params);
  const task = await db.query.tasksTable.findFirst({
    where: eq(tasksTable.id, id),
  });

  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(serializeTask(task));
});

router.patch("/tasks/:id", async (req, res) => {
  const { id } = UpdateTaskParams.parse(req.params);
  const body = UpdateTaskBody.parse(req.body);

  const [task] = await db
    .update(tasksTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(tasksTable.id, id))
    .returning();

  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(serializeTask(task));
});

router.delete("/tasks/:id", async (req, res) => {
  const { id } = DeleteTaskParams.parse(req.params);
  await db.delete(taskStepsTable).where(eq(taskStepsTable.taskId, id));
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.status(204).send();
});

router.post("/tasks/:id/execute", async (req, res) => {
  const { id } = ExecuteTaskParams.parse(req.params);

  const task = await db.query.tasksTable.findFirst({
    where: eq(tasksTable.id, id),
  });
  if (!task) return res.status(404).json({ error: "Task not found" });

  const [updated] = await db
    .update(tasksTable)
    .set({ status: "pending", updatedAt: new Date() })
    .where(eq(tasksTable.id, id))
    .returning();

  await db.delete(taskStepsTable).where(eq(taskStepsTable.taskId, id));

  void executeTaskAutonomously(id).catch(() => {});

  res.json(serializeTask(updated));
});

router.get("/tasks/:id/steps", async (req, res) => {
  const { id } = GetTaskParams.parse(req.params);
  const steps = await db.query.taskStepsTable.findMany({
    where: eq(taskStepsTable.taskId, id),
    orderBy: (s, { asc }) => [asc(s.stepNumber)],
  });

  res.json(steps.map(serializeStep));
});

router.post("/tasks/:id/steps/:stepId/approve", async (req, res) => {
  const taskId = parseInt(req.params.id);
  const stepId = parseInt(req.params.stepId);

  const step = await db.query.taskStepsTable.findFirst({
    where: and(eq(taskStepsTable.id, stepId), eq(taskStepsTable.taskId, taskId)),
  });
  if (!step) return res.status(404).json({ error: "Step not found" });

  await db.insert(activityTable).values({
    type: "step_approved",
    message: `Step "${step.name}" approved by user`,
    entityId: taskId,
    entityType: "task",
  });

  void continueTaskFromStep(taskId, stepId).catch(() => {});

  const [updated] = await db
    .update(taskStepsTable)
    .set({ status: "approved" })
    .where(eq(taskStepsTable.id, stepId))
    .returning();

  res.json(serializeStep(updated));
});

router.post("/tasks/:id/steps/:stepId/reject", async (req, res) => {
  const taskId = parseInt(req.params.id);
  const stepId = parseInt(req.params.stepId);

  const step = await db.query.taskStepsTable.findFirst({
    where: and(eq(taskStepsTable.id, stepId), eq(taskStepsTable.taskId, taskId)),
  });
  if (!step) return res.status(404).json({ error: "Step not found" });

  const [updated] = await db
    .update(taskStepsTable)
    .set({ status: "rejected", completedAt: new Date() })
    .where(eq(taskStepsTable.id, stepId))
    .returning();

  await db.update(tasksTable)
    .set({ status: "failed", output: `Step "${step.name}" rejected by user.`, updatedAt: new Date() })
    .where(eq(tasksTable.id, taskId));

  await db.insert(activityTable).values({
    type: "step_rejected",
    message: `Step "${step.name}" rejected — task halted`,
    entityId: taskId,
    entityType: "task",
  });

  res.json(serializeStep(updated));
});

function serializeTask(t: typeof tasksTable.$inferSelect) {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function serializeStep(s: typeof taskStepsTable.$inferSelect) {
  return {
    ...s,
    startedAt: s.startedAt?.toISOString() ?? null,
    completedAt: s.completedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

export default router;
