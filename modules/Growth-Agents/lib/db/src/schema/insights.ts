import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { agentsTable } from "./agents";
import { projectsTable } from "./projects";

export const insightCategoryEnum = pgEnum("insight_category", ["community", "tokenomics", "marketing", "traction", "analytics", "partnership"]);
export const insightImpactEnum = pgEnum("insight_impact", ["low", "medium", "high"]);

export const insightsTable = pgTable("insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  agentId: integer("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  category: insightCategoryEnum("category").notNull(),
  impact: insightImpactEnum("impact").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInsightSchema = createInsertSchema(insightsTable).omit({ id: true, createdAt: true });
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insightsTable.$inferSelect;
