import { Router } from "express";
import { db } from "@workspace/db";
import { daosTable, membersTable, proposalsTable, votesTable } from "@workspace/db";
import { eq, count, avg, sql } from "drizzle-orm";
import { GetDaoStatsParams, GetDaoActivityParams } from "@workspace/api-zod";

const router = Router();

router.get("/daos/:id/stats", async (req, res) => {
  const { id } = GetDaoStatsParams.parse({ id: req.params.id });

  const [dao] = await db.select().from(daosTable).where(eq(daosTable.id, id));
  if (!dao) return res.status(404).json({ error: "DAO not found" });

  const [memberRow] = await db
    .select({ count: count() })
    .from(membersTable)
    .where(eq(membersTable.daoId, id));

  const proposals = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.daoId, id));

  const activeProposals = proposals.filter((p) => p.status === "active").length;
  const passedProposals = proposals.filter((p) => p.status === "passed").length;
  const rejectedProposals = proposals.filter((p) => p.status === "rejected").length;

  let totalVotesCast = 0;
  let avgParticipationRate = 0;

  if (proposals.length > 0) {
    for (const p of proposals) {
      totalVotesCast += Number(p.forVotes) + Number(p.againstVotes) + Number(p.abstainVotes);
    }
    avgParticipationRate = totalVotesCast / proposals.length;
  }

  const members = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.daoId, id));
  const treasuryBalance = members.reduce((sum, m) => sum + Number(m.tokenBalance), 0);

  res.json({
    daoId: id,
    totalMembers: memberRow?.count ?? 0,
    activeProposals,
    passedProposals,
    rejectedProposals,
    totalVotesCast,
    avgParticipationRate,
    treasuryBalance,
    tokenSymbol: dao.tokenSymbol,
  });
});

router.get("/daos/:id/activity", async (req, res) => {
  const { id } = GetDaoActivityParams.parse({ id: req.params.id });

  const proposals = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.daoId, id))
    .orderBy(sql`${proposalsTable.createdAt} DESC`)
    .limit(5);

  const members = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.daoId, id))
    .orderBy(sql`${membersTable.joinedAt} DESC`)
    .limit(5);

  const votes = await db
    .select({ v: votesTable, p: proposalsTable })
    .from(votesTable)
    .innerJoin(proposalsTable, eq(votesTable.proposalId, proposalsTable.id))
    .where(eq(proposalsTable.daoId, id))
    .orderBy(sql`${votesTable.castAt} DESC`)
    .limit(5);

  const events: Array<{
    id: number;
    type: string;
    description: string;
    actorName: string;
    timestamp: Date;
  }> = [];

  let eventId = 1;
  for (const p of proposals) {
    events.push({
      id: eventId++,
      type: "proposal_created",
      description: `Proposal "${p.title}" was created`,
      actorName: p.creatorName,
      timestamp: p.createdAt,
    });
  }

  for (const m of members) {
    events.push({
      id: eventId++,
      type: "member_joined",
      description: `${m.name} joined the DAO as ${m.role}`,
      actorName: m.name,
      timestamp: m.joinedAt,
    });
  }

  for (const { v, p } of votes) {
    events.push({
      id: eventId++,
      type: "vote_cast",
      description: `Vote cast ${v.choice} on "${p.title}"`,
      actorName: v.memberName,
      timestamp: v.castAt,
    });
  }

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  res.json(events.slice(0, 10));
});

router.get("/governance/overview", async (req, res) => {
  const daos = await db.select().from(daosTable);
  const [memberRow] = await db.select({ count: count() }).from(membersTable);
  const proposals = await db.select().from(proposalsTable).orderBy(sql`${proposalsTable.createdAt} DESC`);

  const activeProposals = proposals.filter((p) => p.status === "active").length;
  let totalVotesCast = 0;
  for (const p of proposals) {
    totalVotesCast += Number(p.forVotes) + Number(p.againstVotes) + Number(p.abstainVotes);
  }
  const avgParticipationRate = proposals.length > 0 ? totalVotesCast / proposals.length : 0;

  const daosList = await Promise.all(
    daos.map(async (dao) => {
      const [mr] = await db.select({ count: count() }).from(membersTable).where(eq(membersTable.daoId, dao.id));
      const [pr] = await db.select({ count: count() }).from(proposalsTable).where(eq(proposalsTable.daoId, dao.id));
      return { ...dao, totalSupply: Number(dao.totalSupply), memberCount: mr?.count ?? 0, proposalCount: pr?.count ?? 0 };
    }),
  );

  const recentProposals = proposals.slice(0, 5).map((p) => ({
    ...p,
    quorum: Number(p.quorum),
    forVotes: Number(p.forVotes),
    againstVotes: Number(p.againstVotes),
    abstainVotes: Number(p.abstainVotes),
    totalVotes: Number(p.forVotes) + Number(p.againstVotes) + Number(p.abstainVotes),
  }));

  res.json({
    totalDaos: daos.length,
    totalMembers: memberRow?.count ?? 0,
    totalProposals: proposals.length,
    activeProposals,
    totalVotesCast,
    avgParticipationRate,
    recentProposals,
  });
});

export default router;
