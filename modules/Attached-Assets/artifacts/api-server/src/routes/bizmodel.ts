import { Router } from "express";
import { groq, GROQ_MODEL } from "../lib/groq";
import { db } from "@workspace/db";
import { businessModelAnalysesTable } from "@workspace/db";
import {
  AnalyzeBusinessModelBody,
  GetBusinessModelAnalysisParams,
  ListBusinessModelAnalysesQueryParams,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const bizmodelRouter = Router();

const SYSTEM_PROMPT = `You are the BUSINESS MODEL ARCHITECT, a strategic advisor trained in the InovAtiva Brasil framework and modern digital business models. You analyze startup business structures and recommend the optimal revenue model from categories including: Advertising, Commercial/Marketplace, Subscription/SaaS, P2P, Cooperative, Freemium, Open Source, Data/Transactions, and hybrid combinations.

You MUST return a valid JSON object with EXACTLY this structure (no markdown, no explanation — raw JSON only):
{
  "primary_model": {
    "type": "SaaS / Marketplace / Freemium / etc.",
    "description": "Why this is the best primary model for this startup",
    "fit_score": 87,
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"]
  },
  "alternative_models": [
    {
      "type": "Alternative model type",
      "description": "Brief description",
      "fit_score": 65,
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1"]
    },
    {
      "type": "Another alternative",
      "description": "Brief description",
      "fit_score": 52,
      "pros": ["pro 1"],
      "cons": ["con 1", "con 2"]
    }
  ],
  "monetization_strategy": "Detailed monetization roadmap — how to sequence revenue streams over time",
  "cac_ltv_analysis": "Customer Acquisition Cost vs Lifetime Value analysis and recommendations",
  "revenue_streams": [
    { "name": "Stream name", "description": "Description", "potential": "e.g. High / Medium / Low — $X-Y ARR potential" },
    { "name": "Stream 2", "description": "Description", "potential": "..." }
  ],
  "competitive_positioning": "How the recommended model positions against competitors",
  "recommendations": ["actionable recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4"]
}

fit_score must be an integer 0-100.`;

bizmodelRouter.post("/analyze", async (req, res) => {
  const body = AnalyzeBusinessModelBody.parse(req.body);

  const userMessage = `
Startup Name: ${body.startup_name}
Description: ${body.description}
Sector: ${body.sector}
Target Audience: ${body.target_audience}
Value Proposition: ${body.value_proposition}
${body.existing_revenue ? `Existing Revenue Model: ${body.existing_revenue}` : ""}
  `.trim();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = JSON.parse(raw);

  const [saved] = await db
    .insert(businessModelAnalysesTable)
    .values({
      startup_name: body.startup_name,
      description: body.description,
      sector: body.sector,
      target_audience: body.target_audience,
      value_proposition: body.value_proposition,
      existing_revenue: body.existing_revenue ?? null,
      primary_model: result.primary_model,
      alternative_models: result.alternative_models,
      monetization_strategy: result.monetization_strategy,
      cac_ltv_analysis: result.cac_ltv_analysis,
      revenue_streams: result.revenue_streams,
      competitive_positioning: result.competitive_positioning,
      recommendations: result.recommendations,
    })
    .returning();

  res.json(saved);
});

bizmodelRouter.get("/analyses", async (req, res) => {
  const query = ListBusinessModelAnalysesQueryParams.parse(req.query);
  const limit = query.limit ?? 20;

  const rows = await db
    .select()
    .from(businessModelAnalysesTable)
    .orderBy(desc(businessModelAnalysesTable.created_at))
    .limit(limit);

  res.json({ analyses: rows, total: rows.length });
});

bizmodelRouter.get("/analyses/:id", async (req, res) => {
  const { id } = GetBusinessModelAnalysisParams.parse(req.params);
  const [row] = await db
    .select()
    .from(businessModelAnalysesTable)
    .where(eq(businessModelAnalysesTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Business model analysis not found" });
    return;
  }
  res.json(row);
});

export { bizmodelRouter };
