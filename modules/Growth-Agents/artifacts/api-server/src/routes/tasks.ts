import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tasksTable, agentsTable } from "@workspace/db";
import {
  CreateTaskBody,
  UpdateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  ListTasksQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks", async (req, res): Promise<void> => {
  const query = ListTasksQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.agentId) conditions.push(eq(tasksTable.agentId, query.data.agentId));
  if (query.data.projectId) conditions.push(eq(tasksTable.projectId, query.data.projectId));
  if (query.data.status) conditions.push(eq(tasksTable.status, query.data.status));

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(tasksTable.createdAt);
  res.json(tasks);
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.insert(tasksTable).values(parsed.data).returning();
  res.status(201).json(task);
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

router.put("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "completed" && !parsed.data.completedAt) {
    updateData.completedAt = new Date();
  }

  // Update task
  const [task] = await db
    .update(tasksTable)
    .set(updateData)
    .where(eq(tasksTable.id, params.data.id))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Increment agent tasksCompleted if newly completed
  if (parsed.data.status === "completed") {
    await db
      .update(agentsTable)
      .set({ tasksCompleted: task.agentId })
      .where(eq(agentsTable.id, task.agentId));
  }

  res.json(task);
});

export default router;
