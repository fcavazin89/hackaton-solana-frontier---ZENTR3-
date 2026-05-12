import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { daosTable } from "./daos";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  daoId: integer("dao_id").notNull().references(() => daosTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["governance", "treasury", "membership", "protocol", "other"] }).notNull().default("governance"),
  status: text("status", { enum: ["draft", "active", "passed", "rejected", "executed"] }).notNull().default("draft"),
  creatorName: text("creator_name").notNull(),
  quorum: numeric("quorum", { precision: 20, scale: 4 }).notNull().default("50"),
  forVotes: numeric("for_votes", { precision: 20, scale: 4 }).notNull().default("0"),
  againstVotes: numeric("against_votes", { precision: 20, scale: 4 }).notNull().default("0"),
  abstainVotes: numeric("abstain_votes", { precision: 20, scale: 4 }).notNull().default("0"),
  votingStartsAt: timestamp("voting_starts_at").notNull(),
  votingEndsAt: timestamp("voting_ends_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({ id: true, createdAt: true, forVotes: true, againstVotes: true, abstainVotes: true });
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
