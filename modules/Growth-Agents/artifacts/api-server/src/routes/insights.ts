import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, insightsTable } from "@workspace/db";
import {
  CreateInsightBody,
  DeleteInsightParams,
  ListInsightsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/insights", async (req, res): Promise<void> => {
  const query = ListInsightsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.projectId) conditions.push(eq(insightsTable.projectId, query.data.projectId));
  if (query.data.agentId) conditions.push(eq(insightsTable.agentId, query.data.agentId));
  if (query.data.category) conditions.push(eq(insightsTable.category, query.data.category));

  const insights = await db
    .select()
    .from(insightsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(insightsTable.createdAt);
  res.json(insights);
});

router.post("/insights", async (req, res): Promise<void> => {
  const parsed = CreateInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [insight] = await db.insert(insightsTable).values(parsed.data).returning();
  res.status(201).json(insight);
});

router.delete("/insights/:id", async (req, res): Promise<void> => {
  const params = DeleteInsightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [insight] = await db.delete(insightsTable).where(eq(insightsTable.id, params.data.id)).returning();
  if (!insight) {
    res.status(404).json({ error: "Insight not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
