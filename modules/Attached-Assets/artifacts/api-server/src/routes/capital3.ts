import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import {
  AnalyzeStartupBody,
  GetAnalysisParams,
  ListAnalysesQueryParams,
} from "@workspace/api-zod";
import { eq, desc, sql } from "drizzle-orm";

const capital3Router = Router();

const SYSTEM_PROMPT = `You are CAPITAL3, a world-class Web3 funding and tokenomics expert with 15 years of experience structuring token launches, seed rounds, and DeFi protocols. Your role is to design sustainable, investable financial structures for Web3 startups.

Analyze the provided startup details and generate a comprehensive financial blueprint. Be precise, realistic, and authoritative. Base your analysis on real Web3 market conditions.

You MUST return a valid JSON object with EXACTLY this structure (no markdown, no explanation — raw JSON only):
{
  "funding_strategy": "detailed funding strategy description",
  "tokenomics": {
    "total_supply": "e.g. 100,000,000",
    "distribution": {
      "team": "e.g. 18%",
      "investors": "e.g. 22%",
      "community": "e.g. 40%",
      "treasury": "e.g. 12%",
      "ecosystem": "e.g. 8%"
    },
    "vesting_schedule": "detailed vesting schedule description",
    "token_utility": "description of token utility and use cases"
  },
  "revenue_model": "detailed revenue model description",
  "runway_estimate": "e.g. 18 months",
  "risk_level": "one of: low, medium, high, very-high",
  "risk_factors": ["risk 1", "risk 2", "risk 3", "risk 4"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"],
  "scenarios": [
    {
      "name": "conservative",
      "target_raise": "e.g. $500,000",
      "valuation": "e.g. $3,000,000",
      "timeline": "e.g. 6 months",
      "probability": "e.g. 65%"
    },
    {
      "name": "moderate",
      "target_raise": "e.g. $1,500,000",
      "valuation": "e.g. $8,000,000",
      "timeline": "e.g. 9 months",
      "probability": "e.g. 40%"
    },
    {
      "name": "aggressive",
      "target_raise": "e.g. $5,000,000",
      "valuation": "e.g. $25,000,000",
      "timeline": "e.g. 12 months",
      "probability": "e.g. 15%"
    }
  ],
  "valuation_estimate": "e.g. $5,000,000 - $10,000,000"
}`;

capital3Router.post("/capital3/analyze", async (req, res) => {
  const parseResult = AnalyzeStartupBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
    return;
  }

  const input = parseResult.data;

  const userPrompt = `Analyze this Web3 startup:

Name: ${input.startup_name}
Description: ${input.description}
Target Audience: ${input.target_audience}
Revenue Model: ${input.revenue_model}
Funding Stage: ${input.stage}
Sector: ${input.sector}
${input.monthly_burn ? `Monthly Burn Rate: $${input.monthly_burn.toLocaleString()}` : ""}
${input.existing_capital ? `Existing Capital: $${input.existing_capital.toLocaleString()}` : ""}

Generate a complete financial blueprint for this startup including tokenomics structure, funding strategy, revenue model analysis, runway estimation, risk assessment, and funding scenarios. Return raw JSON only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    let analysis: Record<string, unknown>;
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      req.log.error({ content }, "Failed to parse AI response as JSON");
      res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
      return;
    }

    const [saved] = await db
      .insert(analysesTable)
      .values({
        startup_name: input.startup_name,
        description: input.description,
        target_audience: input.target_audience,
        revenue_model: input.revenue_model,
        stage: input.stage,
        sector: input.sector,
        monthly_burn: input.monthly_burn ?? null,
        existing_capital: input.existing_capital ?? null,
        funding_strategy: String(analysis.funding_strategy ?? ""),
        tokenomics: analysis.tokenomics as Record<string, unknown>,
        runway_estimate: String(analysis.runway_estimate ?? ""),
        risk_level: String(analysis.risk_level ?? "medium"),
        risk_factors: analysis.risk_factors as string[],
        recommendations: analysis.recommendations as string[],
        scenarios: analysis.scenarios as Record<string, unknown>[],
        valuation_estimate: String(analysis.valuation_estimate ?? ""),
      })
      .returning();

    res.json({
      ...saved,
      tokenomics: saved.tokenomics,
      risk_factors: saved.risk_factors,
      recommendations: saved.recommendations,
      scenarios: saved.scenarios,
      created_at: saved.created_at.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error analyzing startup");
    res.status(500).json({ error: "Failed to analyze startup. Please try again." });
  }
});

capital3Router.get("/capital3/analyses", async (req, res) => {
  const parseResult = ListAnalysesQueryParams.safeParse(req.query);
  const limit = parseResult.success ? (parseResult.data.limit ?? 20) : 20;
  const offset = parseResult.success ? (parseResult.data.offset ?? 0) : 0;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(analysesTable)
      .orderBy(desc(analysesTable.created_at))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(analysesTable),
  ]);

  res.json({
    analyses: rows.map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
    })),
    total: countResult[0]?.count ?? 0,
  });
});

capital3Router.get("/capital3/analyses/:id", async (req, res) => {
  const parseResult = GetAnalysisParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const row = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, parseResult.data.id))
    .limit(1);

  if (!row[0]) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json({
    ...row[0],
    created_at: row[0].created_at.toISOString(),
  });
});

capital3Router.get("/capital3/stats", async (req, res) => {
  const all = await db.select().from(analysesTable);

  const by_stage: Record<string, number> = {};
  const by_sector: Record<string, number> = {};
  const by_risk_level: Record<string, number> = {};
  let totalRunwayMonths = 0;
  let runwayCount = 0;

  for (const a of all) {
    by_stage[a.stage] = (by_stage[a.stage] ?? 0) + 1;
    by_sector[a.sector] = (by_sector[a.sector] ?? 0) + 1;
    by_risk_level[a.risk_level] = (by_risk_level[a.risk_level] ?? 0) + 1;

    const months = parseFloat(a.runway_estimate);
    if (!isNaN(months)) {
      totalRunwayMonths += months;
      runwayCount++;
    }
  }

  res.json({
    total_analyses: all.length,
    by_stage,
    by_sector,
    by_risk_level,
    avg_runway_months: runwayCount > 0 ? Math.round(totalRunwayMonths / runwayCount) : 0,
  });
});

export default capital3Router;
