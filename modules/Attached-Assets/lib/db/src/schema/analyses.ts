import { pgTable, text, serial, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  startup_name: text("startup_name").notNull(),
  description: text("description").notNull(),
  target_audience: text("target_audience").notNull(),
  revenue_model: text("revenue_model").notNull(),
  stage: text("stage").notNull(),
  sector: text("sector").notNull(),
  monthly_burn: integer("monthly_burn"),
  existing_capital: integer("existing_capital"),
  funding_strategy: text("funding_strategy").notNull(),
  tokenomics: jsonb("tokenomics").notNull(),
  runway_estimate: text("runway_estimate").notNull(),
  risk_level: text("risk_level").notNull(),
  risk_factors: jsonb("risk_factors").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  scenarios: jsonb("scenarios").notNull(),
  valuation_estimate: text("valuation_estimate").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, created_at: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
