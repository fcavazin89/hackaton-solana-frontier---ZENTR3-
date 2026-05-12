import { pgTable, text, serial, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/* ─── MVP Validator ─────────────────────────────────────────────────────── */
export const mvpAnalysesTable = pgTable("mvp_analyses", {
  id: serial("id").primaryKey(),
  startup_name: text("startup_name").notNull(),
  description: text("description").notNull(),
  stage: text("stage").notNull(),
  problem_statement: text("problem_statement").notNull(),
  proposed_mvp: text("proposed_mvp").notNull(),
  target_audience: text("target_audience").notNull(),
  fit_stages: jsonb("fit_stages").notNull(),
  validation_strategy: jsonb("validation_strategy").notNull(),
  mvp_type: text("mvp_type").notNull(),
  validation_risks: jsonb("validation_risks").notNull(),
  recommendation: text("recommendation").notNull(),
  recommendation_rationale: text("recommendation_rationale").notNull(),
  next_steps: jsonb("next_steps").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertMvpAnalysisSchema = createInsertSchema(mvpAnalysesTable).omit({ id: true, created_at: true });
export type InsertMvpAnalysis = z.infer<typeof insertMvpAnalysisSchema>;
export type MvpAnalysis = typeof mvpAnalysesTable.$inferSelect;

/* ─── Business Model Architect ──────────────────────────────────────────── */
export const businessModelAnalysesTable = pgTable("business_model_analyses", {
  id: serial("id").primaryKey(),
  startup_name: text("startup_name").notNull(),
  description: text("description").notNull(),
  sector: text("sector").notNull(),
  target_audience: text("target_audience").notNull(),
  value_proposition: text("value_proposition").notNull(),
  existing_revenue: text("existing_revenue"),
  primary_model: jsonb("primary_model").notNull(),
  alternative_models: jsonb("alternative_models").notNull(),
  monetization_strategy: text("monetization_strategy").notNull(),
  cac_ltv_analysis: text("cac_ltv_analysis").notNull(),
  revenue_streams: jsonb("revenue_streams").notNull(),
  competitive_positioning: text("competitive_positioning").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessModelSchema = createInsertSchema(businessModelAnalysesTable).omit({ id: true, created_at: true });
export type InsertBusinessModel = z.infer<typeof insertBusinessModelSchema>;
export type BusinessModelAnalysis = typeof businessModelAnalysesTable.$inferSelect;

/* ─── Pitch Builder ─────────────────────────────────────────────────────── */
export const pitchesTable = pgTable("pitches", {
  id: serial("id").primaryKey(),
  startup_name: text("startup_name").notNull(),
  sector: text("sector").notNull(),
  stage: text("stage").notNull(),
  problem: text("problem").notNull(),
  solution: text("solution").notNull(),
  market_size: text("market_size").notNull(),
  secret_sauce: text("secret_sauce").notNull(),
  team_description: text("team_description").notNull(),
  funding_ask: text("funding_ask").notNull(),
  traction: text("traction"),
  pitch_cover: text("pitch_cover").notNull(),
  pitch_context: text("pitch_context").notNull(),
  pitch_problem: text("pitch_problem").notNull(),
  pitch_market: text("pitch_market").notNull(),
  pitch_solution: text("pitch_solution").notNull(),
  pitch_business_model: text("pitch_business_model").notNull(),
  pitch_traction: text("pitch_traction").notNull(),
  pitch_go_to_market: text("pitch_go_to_market").notNull(),
  pitch_competitors: text("pitch_competitors").notNull(),
  pitch_team: text("pitch_team").notNull(),
  pitch_investment_round: text("pitch_investment_round").notNull(),
  key_metrics: jsonb("key_metrics").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertPitchSchema = createInsertSchema(pitchesTable).omit({ id: true, created_at: true });
export type InsertPitch = z.infer<typeof insertPitchSchema>;
export type Pitch = typeof pitchesTable.$inferSelect;
