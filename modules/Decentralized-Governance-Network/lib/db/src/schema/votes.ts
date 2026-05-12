import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { proposalsTable } from "./proposals";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposalsTable.id, { onDelete: "cascade" }),
  memberName: text("member_name").notNull(),
  choice: text("choice", { enum: ["for", "against", "abstain"] }).notNull(),
  weight: numeric("weight", { precision: 20, scale: 4 }).notNull().default("1"),
  castAt: timestamp("cast_at").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votesTable).omit({ id: true, castAt: true });
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;
