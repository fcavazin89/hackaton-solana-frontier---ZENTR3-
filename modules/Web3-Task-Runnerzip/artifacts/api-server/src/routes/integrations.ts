import { Router } from "express";
import { db } from "@workspace/db";
import { integrationsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateIntegrationBody,
  UpdateIntegrationBody,
  DeleteIntegrationParams,
  UpdateIntegrationParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/integrations", async (req, res) => {
  const integrations = await db.query.integrationsTable.findMany({
    orderBy: (i, { desc }) => [desc(i.createdAt)],
  });

  res.json(integrations.map(serializeIntegration));
});

router.post("/integrations", async (req, res) => {
  const body = CreateIntegrationBody.parse(req.body);
  const [integration] = await db
    .insert(integrationsTable)
    .values({ ...body })
    .returning();

  await db.insert(activityTable).values({
    type: "integration_added",
    message: `Integration "${integration.name}" connected`,
    entityId: integration.id,
    entityType: "integration",
  });

  res.status(201).json(serializeIntegration(integration));
});

router.delete("/integrations/:id", async (req, res) => {
  const { id } = DeleteIntegrationParams.parse(req.params);
  const integration = await db.query.integrationsTable.findFirst({
    where: eq(integrationsTable.id, id),
  });

  await db.delete(integrationsTable).where(eq(integrationsTable.id, id));

  if (integration) {
    await db.insert(activityTable).values({
      type: "integration_removed",
      message: `Integration "${integration.name}" disconnected`,
      entityId: id,
      entityType: "integration",
    });
  }

  res.status(204).send();
});

router.patch("/integrations/:id", async (req, res) => {
  const { id } = UpdateIntegrationParams.parse(req.params);
  const body = UpdateIntegrationBody.parse(req.body);

  const [integration] = await db
    .update(integrationsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(integrationsTable.id, id))
    .returning();

  if (!integration) return res.status(404).json({ error: "Integration not found" });
  res.json(serializeIntegration(integration));
});

function serializeIntegration(i: typeof integrationsTable.$inferSelect) {
  return {
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export default router;
