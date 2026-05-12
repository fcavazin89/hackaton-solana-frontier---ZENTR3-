import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const integrationTypeEnum = pgEnum("integration_type", [
  "rpc_provider",
  "wallet",
  "oracle",
  "storage",
  "indexer",
  "bridge",
  "dex",
  "other",
]);

export const integrationStatusEnum = pgEnum("integration_status", [
  "active",
  "inactive",
  "error",
]);

export const integrationsTable = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: integrationTypeEnum("type").notNull().default("other"),
  network: text("network"),
  endpoint: text("endpoint"),
  status: integrationStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIntegrationSchema = createInsertSchema(integrationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrationsTable.$inferSelect;
