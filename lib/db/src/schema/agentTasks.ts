import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentTasks = pgTable("agent_tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
  agentId: text("agent_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("PENDING"),
  priority: text("priority").notNull().default("MEDIUM"),
  progress: integer("progress").notNull().default(0),
  assignedTo: text("assigned_to").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
});
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
