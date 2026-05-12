import { Router } from "express";
import { db } from "@workspace/db";
import { deploymentsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateDeploymentBody,
  UpdateDeploymentBody,
  GetDeploymentParams,
  UpdateDeploymentParams,
  DeleteDeploymentParams,
  ListDeploymentsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/deployments", async (req, res) => {
  const parsed = ListDeploymentsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  const deployments = await db.query.deploymentsTable.findMany({
    where: status ? eq(deploymentsTable.status, status) : undefined,
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  });

  res.json(deployments.map(serializeDeployment));
});

router.post("/deployments", async (req, res) => {
  const body = CreateDeploymentBody.parse(req.body);
  const [deployment] = await db
    .insert(deploymentsTable)
    .values({ ...body })
    .returning();

  await db.insert(activityTable).values({
    type: "deployment_created",
    message: `Deployment "${deployment.name}" created on ${deployment.network}`,
    entityId: deployment.id,
    entityType: "deployment",
  });

  res.status(201).json(serializeDeployment(deployment));
});

router.get("/deployments/:id", async (req, res) => {
  const { id } = GetDeploymentParams.parse(req.params);
  const deployment = await db.query.deploymentsTable.findFirst({
    where: eq(deploymentsTable.id, id),
  });

  if (!deployment) return res.status(404).json({ error: "Deployment not found" });
  res.json(serializeDeployment(deployment));
});

router.patch("/deployments/:id", async (req, res) => {
  const { id } = UpdateDeploymentParams.parse(req.params);
  const body = UpdateDeploymentBody.parse(req.body);

  const updateData: Partial<typeof deploymentsTable.$inferInsert> = {
    ...body,
    updatedAt: new Date(),
  };

  if (body.deployedAt) {
    updateData.deployedAt = new Date(body.deployedAt);
  }

  const [deployment] = await db
    .update(deploymentsTable)
    .set(updateData)
    .where(eq(deploymentsTable.id, id))
    .returning();

  if (!deployment) return res.status(404).json({ error: "Deployment not found" });

  if (body.status === "success") {
    await db.insert(activityTable).values({
      type: "deployment_success",
      message: `Deployment "${deployment.name}" succeeded on ${deployment.network}`,
      entityId: id,
      entityType: "deployment",
    });
  } else if (body.status === "failed") {
    await db.insert(activityTable).values({
      type: "deployment_failed",
      message: `Deployment "${deployment.name}" failed`,
      entityId: id,
      entityType: "deployment",
    });
  }

  res.json(serializeDeployment(deployment));
});

router.delete("/deployments/:id", async (req, res) => {
  const { id } = DeleteDeploymentParams.parse(req.params);
  await db.delete(deploymentsTable).where(eq(deploymentsTable.id, id));
  res.status(204).send();
});

function serializeDeployment(d: typeof deploymentsTable.$inferSelect) {
  return {
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    deployedAt: d.deployedAt?.toISOString() ?? null,
  };
}

export default router;
