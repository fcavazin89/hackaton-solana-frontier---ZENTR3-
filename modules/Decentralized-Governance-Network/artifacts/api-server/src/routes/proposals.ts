import { Router } from "express";
import { db } from "@workspace/db";
import { proposalsTable, votesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListProposalsParams,
  ListProposalsQueryParams,
  CreateProposalParams,
  CreateProposalBody,
  GetProposalParams,
  CastVoteParams,
  CastVoteBody,
  GetProposalResultsParams,
} from "@workspace/api-zod";

const router = Router();

function formatProposal(p: typeof proposalsTable.$inferSelect) {
  return {
    ...p,
    quorum: Number(p.quorum),
    forVotes: Number(p.forVotes),
    againstVotes: Number(p.againstVotes),
    abstainVotes: Number(p.abstainVotes),
    totalVotes:
      Number(p.forVotes) + Number(p.againstVotes) + Number(p.abstainVotes),
  };
}

router.get("/daos/:daoId/proposals", async (req, res) => {
  const { daoId } = ListProposalsParams.parse({ daoId: req.params.daoId });
  const query = ListProposalsQueryParams.parse(req.query);

  let proposals = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.daoId, daoId))
    .orderBy(proposalsTable.createdAt);

  if (query.status) {
    proposals = proposals.filter((p) => p.status === query.status);
  }

  res.json(proposals.map(formatProposal));
});

router.post("/daos/:daoId/proposals", async (req, res) => {
  const { daoId } = CreateProposalParams.parse({ daoId: req.params.daoId });
  const body = CreateProposalBody.parse(req.body);

  const [proposal] = await db
    .insert(proposalsTable)
    .values({
      daoId,
      title: body.title,
      description: body.description,
      type: body.type,
      status: "active",
      creatorName: body.creatorName,
      quorum: String(body.quorum),
      votingStartsAt: new Date(body.votingStartsAt),
      votingEndsAt: new Date(body.votingEndsAt),
    })
    .returning();

  res.status(201).json(formatProposal(proposal!));
});

router.get("/daos/:daoId/proposals/:proposalId", async (req, res) => {
  const { daoId, proposalId } = GetProposalParams.parse({
    daoId: req.params.daoId,
    proposalId: req.params.proposalId,
  });

  const [proposal] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.daoId, daoId),
        eq(proposalsTable.id, proposalId),
      ),
    );

  if (!proposal) return res.status(404).json({ error: "Proposal not found" });
  res.json(formatProposal(proposal));
});

router.post("/daos/:daoId/proposals/:proposalId/vote", async (req, res) => {
  const { daoId, proposalId } = CastVoteParams.parse({
    daoId: req.params.daoId,
    proposalId: req.params.proposalId,
  });
  const body = CastVoteBody.parse(req.body);

  const [vote] = await db
    .insert(votesTable)
    .values({
      proposalId,
      memberName: body.memberName,
      choice: body.choice,
      weight: String(body.weight),
    })
    .returning();

  const weightNum = String(body.weight);

  if (body.choice === "for") {
    await db
      .update(proposalsTable)
      .set({ forVotes: sql`${proposalsTable.forVotes} + ${weightNum}` })
      .where(eq(proposalsTable.id, proposalId));
  } else if (body.choice === "against") {
    await db
      .update(proposalsTable)
      .set({ againstVotes: sql`${proposalsTable.againstVotes} + ${weightNum}` })
      .where(eq(proposalsTable.id, proposalId));
  } else {
    await db
      .update(proposalsTable)
      .set({ abstainVotes: sql`${proposalsTable.abstainVotes} + ${weightNum}` })
      .where(eq(proposalsTable.id, proposalId));
  }

  res.status(201).json({
    ...vote!,
    weight: Number(vote!.weight),
  });
});

router.get("/daos/:daoId/proposals/:proposalId/results", async (req, res) => {
  const { daoId, proposalId } = GetProposalResultsParams.parse({
    daoId: req.params.daoId,
    proposalId: req.params.proposalId,
  });

  const [proposal] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.daoId, daoId),
        eq(proposalsTable.id, proposalId),
      ),
    );

  if (!proposal) return res.status(404).json({ error: "Proposal not found" });

  const votes = await db
    .select()
    .from(votesTable)
    .where(eq(votesTable.proposalId, proposalId))
    .orderBy(votesTable.castAt);

  const forVotes = Number(proposal.forVotes);
  const againstVotes = Number(proposal.againstVotes);
  const abstainVotes = Number(proposal.abstainVotes);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  const quorum = Number(proposal.quorum);
  const quorumReached = totalVotes >= quorum;
  const passed = quorumReached && forVotes > againstVotes;

  res.json({
    proposalId,
    forVotes,
    againstVotes,
    abstainVotes,
    totalVotes,
    quorum,
    quorumReached,
    passed,
    participationRate: totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0,
    votes: votes.map((v) => ({ ...v, weight: Number(v.weight) })),
  });
});

export default router;
