import { Router } from "express";
import { db } from "@workspace/db";
import { membersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { AddMemberBody, AddMemberParams, ListMembersParams, RemoveMemberParams } from "@workspace/api-zod";

const router = Router();

router.get("/daos/:daoId/members", async (req, res) => {
  const { daoId } = ListMembersParams.parse({ daoId: req.params.daoId });
  const members = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.daoId, daoId))
    .orderBy(membersTable.joinedAt);

  const totalSupplyByDao = members.reduce(
    (sum, m) => sum + Number(m.tokenBalance),
    0,
  );

  res.json(
    members.map((m) => ({
      ...m,
      tokenBalance: Number(m.tokenBalance),
      votingPower:
        totalSupplyByDao > 0
          ? (Number(m.tokenBalance) / totalSupplyByDao) * 100
          : 0,
    })),
  );
});

router.post("/daos/:daoId/members", async (req, res) => {
  const { daoId } = AddMemberParams.parse({ daoId: req.params.daoId });
  const body = AddMemberBody.parse(req.body);

  const [member] = await db
    .insert(membersTable)
    .values({
      daoId,
      name: body.name,
      walletAddress: body.walletAddress,
      role: body.role,
      tokenBalance: String(body.tokenBalance),
    })
    .returning();

  const allMembers = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.daoId, daoId));
  const totalSupply = allMembers.reduce((sum, m) => sum + Number(m.tokenBalance), 0);

  res.status(201).json({
    ...member!,
    tokenBalance: Number(member!.tokenBalance),
    votingPower: totalSupply > 0 ? (Number(member!.tokenBalance) / totalSupply) * 100 : 0,
  });
});

router.delete("/daos/:daoId/members/:memberId", async (req, res) => {
  const { daoId, memberId } = RemoveMemberParams.parse({
    daoId: req.params.daoId,
    memberId: req.params.memberId,
  });
  await db
    .delete(membersTable)
    .where(and(eq(membersTable.daoId, daoId), eq(membersTable.id, memberId)));
  res.status(204).send();
});

export default router;
