import { pgTable, text, serial, integer, numeric, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const daosTable = pgTable("daos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  mission: text("mission").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  totalSupply: numeric("total_supply", { precision: 20, scale: 4 }).notNull().default("0"),
  status: text("status", { enum: ["active", "paused", "dissolved"] }).notNull().default("active"),
  governanceModel: text("governance_model", { enum: ["token-based", "reputation-based", "multisig", "hybrid"] }).notNull().default("token-based"),
  votingSystem: text("voting_system", { enum: ["simple-majority", "supermajority", "quadratic", "weighted"] }).notNull().default("simple-majority"),
  executionMechanism: text("execution_mechanism", { enum: ["snapshot", "safe-multisig", "on-chain", "hybrid"] }).notNull().default("snapshot"),
  aiRecommendation: jsonb("ai_recommendation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDaoSchema = createInsertSchema(daosTable).omit({ id: true, createdAt: true });
export type InsertDao = z.infer<typeof insertDaoSchema>;
export type Dao = typeof daosTable.$inferSelect;
