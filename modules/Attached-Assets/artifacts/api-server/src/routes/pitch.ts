import { Router } from "express";
import { groq, GROQ_MODEL } from "../lib/groq";
import { db } from "@workspace/db";
import { pitchesTable } from "@workspace/db";
import {
  BuildPitchBody,
  GetPitchParams,
  ListPitchesQueryParams,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const pitchRouter = Router();

const SYSTEM_PROMPT = `You are the PITCH BUILDER, an expert startup pitch coach trained in the InovAtiva Brasil pitch framework. You craft compelling, investor-ready pitch narratives across all 10 sections of a complete pitch deck. You understand how to adapt the pitch for different audiences: investors, partners, team members, and clients. You focus on strong storytelling, clear problem/solution framing, and credible market sizing.

You MUST return a valid JSON object with EXACTLY this structure (no markdown, no explanation — raw JSON only):
{
  "pitch_cover": "The cover slide narrative — one powerful hook sentence that captures the startup's essence",
  "pitch_context": "Context slide — the macro trend or market shift creating the opportunity. 2-3 sentences.",
  "pitch_problem": "Problem slide — the specific pain point, who suffers it, quantify the cost. Clear and visceral.",
  "pitch_market": "Market slide — TAM/SAM/SOM breakdown narrative, go from macro to niche. Include market sizing rationale.",
  "pitch_solution": "Solution slide — how the product solves the problem. Lead with outcomes, not features.",
  "pitch_business_model": "Business model slide — how you make money, pricing model, unit economics",
  "pitch_traction": "Traction slide — current metrics, milestones achieved, growth indicators",
  "pitch_go_to_market": "Go-to-market slide — acquisition strategy, channels, first 100 customers approach",
  "pitch_competitors": "Competitors slide — competitive landscape, differentiation, why you win",
  "pitch_team": "Team slide — founder stories, relevant expertise, why this team, advisors",
  "pitch_investment_round": "Investment round slide — amount raising, use of funds breakdown, milestones this round unlocks",
  "key_metrics": [
    { "label": "TAM", "value": "$2.4B" },
    { "label": "Target ARR Y1", "value": "$850K" },
    { "label": "Round Size", "value": "$1.5M" },
    { "label": "Runway", "value": "18 months" }
  ]
}

Each pitch section should be 2-4 compelling sentences optimized for presentation delivery. key_metrics should have 4-6 items with realistic numbers.`;

pitchRouter.post("/build", async (req, res) => {
  const body = BuildPitchBody.parse(req.body);

  const userMessage = `
Startup Name: ${body.startup_name}
Sector: ${body.sector}
Stage: ${body.stage}
Problem: ${body.problem}
Solution: ${body.solution}
Market Size: ${body.market_size}
Secret Sauce / Differentiator: ${body.secret_sauce}
Team Description: ${body.team_description}
Funding Ask: ${body.funding_ask}
${body.traction ? `Traction: ${body.traction}` : "Traction: Pre-revenue, early stage"}
  `.trim();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = JSON.parse(raw);

  const [saved] = await db
    .insert(pitchesTable)
    .values({
      startup_name: body.startup_name,
      sector: body.sector,
      stage: body.stage,
      problem: body.problem,
      solution: body.solution,
      market_size: body.market_size,
      secret_sauce: body.secret_sauce,
      team_description: body.team_description,
      funding_ask: body.funding_ask,
      traction: body.traction ?? null,
      pitch_cover: result.pitch_cover,
      pitch_context: result.pitch_context,
      pitch_problem: result.pitch_problem,
      pitch_market: result.pitch_market,
      pitch_solution: result.pitch_solution,
      pitch_business_model: result.pitch_business_model,
      pitch_traction: result.pitch_traction,
      pitch_go_to_market: result.pitch_go_to_market,
      pitch_competitors: result.pitch_competitors,
      pitch_team: result.pitch_team,
      pitch_investment_round: result.pitch_investment_round,
      key_metrics: result.key_metrics,
    })
    .returning();

  res.json(saved);
});

pitchRouter.get("/pitches", async (req, res) => {
  const query = ListPitchesQueryParams.parse(req.query);
  const limit = query.limit ?? 20;

  const rows = await db
    .select()
    .from(pitchesTable)
    .orderBy(desc(pitchesTable.created_at))
    .limit(limit);

  res.json({ pitches: rows, total: rows.length });
});

pitchRouter.get("/pitches/:id", async (req, res) => {
  const { id } = GetPitchParams.parse(req.params);
  const [row] = await db
    .select()
    .from(pitchesTable)
    .where(eq(pitchesTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Pitch not found" });
    return;
  }
  res.json(row);
});

export { pitchRouter };
