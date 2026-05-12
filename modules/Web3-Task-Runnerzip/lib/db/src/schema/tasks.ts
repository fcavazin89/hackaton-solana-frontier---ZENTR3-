import { pgTable, text, serial, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taskCategoryEnum = pgEnum("task_category", [
  "smart_contract",
  "frontend",
  "backend",
  "deploy",
  "integration",
  "audit",
  "other",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "running",
  "done",
  "failed",
  "awaiting_approval",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: taskCategoryEnum("category").notNull().default("other"),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  output: text("output"),
  currentStep: text("current_step"),
  stepCount: integer("step_count"),
  stepDone: integer("step_done"),
  assignedWorker: text("assigned_worker"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
