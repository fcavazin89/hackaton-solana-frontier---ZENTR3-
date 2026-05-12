import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTypeEnum = pgEnum("activity_type", [
  "task_created",
  "task_executed",
  "task_done",
  "task_failed",
  "task_awaiting",
  "deployment_created",
  "deployment_success",
  "deployment_failed",
  "integration_added",
  "integration_removed",
  "agent_cycle",
  "step_approved",
  "step_rejected",
]);

export const activityEntityTypeEnum = pgEnum("activity_entity_type", [
  "task",
  "deployment",
  "integration",
  "agent",
]);

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: activityTypeEnum("type").notNull(),
  message: text("message").notNull(),
  entityId: integer("entity_id"),
  entityType: activityEntityTypeEnum("entity_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
