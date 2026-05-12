import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const agentTypeEnum = pgEnum("agent_type", ["community", "tokenomics", "marketing", "traction", "analytics", "partnership"]);
export const agentStatusEnum = pgEnum("agent_status", ["active", "idle", "paused"]);

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: agentTypeEnum("type").notNull(),
  description: text("description"),
  status: agentStatusEnum("status").notNull().default("idle"),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  insightsGenerated: integer("insights_generated").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
