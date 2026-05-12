import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks";

export const stepStatusEnum = pgEnum("step_status", [
  "pending",
  "running",
  "awaiting_approval",
  "approved",
  "rejected",
  "done",
  "failed",
  "skipped",
]);

export const taskStepsTable = pgTable("task_steps", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: stepStatusEnum("status").notNull().default("pending"),
  output: text("output"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskStep = typeof taskStepsTable.$inferSelect;
