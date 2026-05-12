import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";

export const autonomyLevelEnum = pgEnum("autonomy_level", [
  "manual",
  "supervised",
  "semi_auto",
  "full_auto",
]);

export const agentConfigTable = pgTable("agent_config", {
  id: serial("id").primaryKey(),
  autonomyLevel: autonomyLevelEnum("autonomy_level").notNull().default("manual"),
  maxConcurrentTasks: integer("max_concurrent_tasks").notNull().default(1),
  autoRetryFailed: boolean("auto_retry_failed").notNull().default(false),
  requireApprovalForDeploy: boolean("require_approval_for_deploy").notNull().default(true),
  requireApprovalForMainnet: boolean("require_approval_for_mainnet").notNull().default(true),
  executionIntervalSec: integer("execution_interval_sec").notNull().default(10),
  isEnabled: boolean("is_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AgentConfig = typeof agentConfigTable.$inferSelect;
