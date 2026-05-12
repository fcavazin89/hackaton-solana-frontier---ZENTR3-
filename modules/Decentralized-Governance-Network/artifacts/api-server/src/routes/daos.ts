import { Router } from "express";
import { db } from "@workspace/db";
import { daosTable, insertDaoSchema } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { proposalsTable, membersTable } from "@workspace/db";
import {
  CreateDaoBody,
  GetDaoParams,
  UpdateDaoParams,
  UpdateDaoBody,
  DeleteDaoParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/daos", async (req, res) => {
  const daos = await db.select().from(daosTable).orderBy(daosTable.createdAt);

  const result = await Promise.all(
    daos.map(async (dao) => {
      const [memberRow] = await db
        .select({ count: count() })
        .from(membersTable)
        .where(eq(membersTable.daoId, dao.id));
      const [proposalRow] = await db
        .select({ count: count() })
        .from(proposalsTable)
        .where(eq(proposalsTable.daoId, dao.id));
      return {
        ...dao,
        totalSupply: Number(dao.totalSupply),
        memberCount: memberRow?.count ?? 0,
        proposalCount: proposalRow?.count ?? 0,
      };
    }),
  );

  res.json(result);
});

router.post("/daos", async (req, res) => {
  const body = CreateDaoBody.parse(req.body);
  const [dao] = await db
    .insert(daosTable)
    .values({
      name: body.name,
      description: body.description,
      mission: body.mission,
      tokenSymbol: body.tokenSymbol,
      totalSupply: String(body.totalSupply),
      status: body.status ?? "active",
      governanceModel: (body.governanceModel as "token-based" | "reputation-based" | "multisig" | "hybrid") ?? "token-based",
      votingSystem: (body.votingSystem as "simple-majority" | "supermajority" | "quadratic" | "weighted") ?? "simple-majority",
      executionMechanism: (body.executionMechanism as "snapshot" | "safe-multisig" | "on-chain" | "hybrid") ?? "snapshot",
    })
    .returning();

  res.status(201).json({
    ...dao,
    totalSupply: Number(dao!.totalSupply),
    memberCount: 0,
    proposalCount: 0,
  });
});

router.get("/daos/:id", async (req, res) => {
  const { id } = GetDaoParams.parse({ id: req.params.id });
  const [dao] = await db.select().from(daosTable).where(eq(daosTable.id, id));
  if (!dao) return res.status(404).json({ error: "DAO not found" });

  const [memberRow] = await db
    .select({ count: count() })
    .from(membersTable)
    .where(eq(membersTable.daoId, id));
  const [proposalRow] = await db
    .select({ count: count() })
    .from(proposalsTable)
    .where(eq(proposalsTable.daoId, id));

  res.json({
    ...dao,
    totalSupply: Number(dao.totalSupply),
    memberCount: memberRow?.count ?? 0,
    proposalCount: proposalRow?.count ?? 0,
  });
});

router.put("/daos/:id", async (req, res) => {
  const { id } = UpdateDaoParams.parse({ id: req.params.id });
  const body = UpdateDaoBody.parse(req.body);
  const [dao] = await db
    .update(daosTable)
    .set({
      name: body.name,
      description: body.description,
      mission: body.mission,
      tokenSymbol: body.tokenSymbol,
      totalSupply: String(body.totalSupply),
      ...(body.status ? { status: body.status } : {}),
    })
    .where(eq(daosTable.id, id))
    .returning();

  if (!dao) return res.status(404).json({ error: "DAO not found" });

  const [memberRow] = await db
    .select({ count: count() })
    .from(membersTable)
    .where(eq(membersTable.daoId, id));
  const [proposalRow] = await db
    .select({ count: count() })
    .from(proposalsTable)
    .where(eq(proposalsTable.daoId, id));

  res.json({
    ...dao,
    totalSupply: Number(dao.totalSupply),
    memberCount: memberRow?.count ?? 0,
    proposalCount: proposalRow?.count ?? 0,
  });
});

router.delete("/daos/:id", async (req, res) => {
  const { id } = DeleteDaoParams.parse({ id: req.params.id });
  await db.delete(daosTable).where(eq(daosTable.id, id));
  res.status(204).send();
});

export default router;
