import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deploymentStatusEnum = pgEnum("deployment_status", [
  "pending",
  "deploying",
  "success",
  "failed",
]);

export const deploymentsTable = pgTable("deployments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  network: text("network").notNull(),
  contractAddress: text("contract_address"),
  txHash: text("tx_hash"),
  status: deploymentStatusEnum("status").notNull().default("pending"),
  gasUsed: text("gas_used"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDeploymentSchema = createInsertSchema(deploymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deploymentsTable.$inferSelect;
