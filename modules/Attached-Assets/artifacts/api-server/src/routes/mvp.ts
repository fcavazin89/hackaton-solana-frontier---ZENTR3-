import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { groq, GROQ_MODEL } from "../lib/groq";
import { db } from "@workspace/db";
import { mvpAnalysesTable } from "@workspace/db";
import { ValidateMvpBody, GetMvpAnalysisParams, ListMvpAnalysesQueryParams } from "@workspace/api-zod";

const mvpRouter = Router();

const SYSTEM_PROMPT = `You are the MVP VALIDATOR, an expert startup coach trained in the StartSe innovation framework and Lean Startup methodology. You specialize in validating Minimum Viable Products, assessing Problem-Solution FIT, Product-Solution FIT, and Product-Market FIT. Your role is to give founders an honest, structured assessment of their MVP strategy and validation approach.

You MUST return a valid JSON object with EXACTLY this structure (no markdown, no explanation — raw JSON only):
{
  "fit_stages": {
    "problem_solution": {
      "score": 72,
      "assessment": "Clear problem identification but limited customer validation evidence",
      "evidence": "What evidence exists (or is missing) for this FIT",
      "gaps": ["gap 1", "gap 2"]
    },
    "product_solution": {
      "score": 45,
      "assessment": "MVP concept addresses core pain points but lacks differentiation",
      "evidence": "What evidence exists (or is missing) for this FIT",
      "gaps": ["gap 1", "gap 2"]
    },
    "product_market": {
      "score": 30,
      "assessment": "Early stage — market willingness to pay not yet validated",
      "evidence": "What evidence exists (or is missing) for this FIT",
      "gaps": ["gap 1", "gap 2"]
    }
  },
  "validation_strategy": {
    "approach": "Recommended overall validation approach description",
    "experiments": ["experiment 1", "experiment 2", "experiment 3", "experiment 4"],
    "tactics": ["tactic 1 (e.g. Concierge MVP)", "tactic 2 (e.g. Landing Page)", "tactic 3 (e.g. Pre-order)"]
  },
  "mvp_type": "e.g. Concierge MVP / Wizard of Oz / Landing Page / Prototype",
  "validation_risks": ["risk 1", "risk 2", "risk 3"],
  "recommendation": "persist",
  "recommendation_rationale": "Detailed rationale for the persist/pivot/accelerate recommendation",
  "next_steps": ["next step 1", "next step 2", "next step 3", "next step 4"]
}

Scores are 0-100 integers. recommendation must be exactly one of: pivot, persist, accelerate.`;

mvpRouter.post("/validate", async (req, res) => {
  const body = ValidateMvpBody.parse(req.body);

  const userMessage = `
Startup Name: ${body.startup_name}
Description: ${body.description}
Stage: ${body.stage}
Problem Statement: ${body.problem_statement}
Proposed MVP: ${body.proposed_mvp}
Target Audience: ${body.target_audience}
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
    .insert(mvpAnalysesTable)
    .values({
      startup_name: body.startup_name,
      description: body.description,
      stage: body.stage,
      problem_statement: body.problem_statement,
      proposed_mvp: body.proposed_mvp,
      target_audience: body.target_audience,
      fit_stages: result.fit_stages,
      validation_strategy: result.validation_strategy,
      mvp_type: result.mvp_type,
      validation_risks: result.validation_risks,
      recommendation: result.recommendation,
      recommendation_rationale: result.recommendation_rationale,
      next_steps: result.next_steps,
    })
    .returning();

  res.json(saved);
});

mvpRouter.get("/analyses", async (req, res) => {
  const query = ListMvpAnalysesQueryParams.parse(req.query);
  const limit = query.limit ?? 20;

  const rows = await db
    .select()
    .from(mvpAnalysesTable)
    .orderBy(desc(mvpAnalysesTable.created_at))
    .limit(limit);

  res.json({ analyses: rows, total: rows.length });
});

mvpRouter.get("/analyses/:id", async (req, res) => {
  const { id } = GetMvpAnalysisParams.parse(req.params);
  const [row] = await db
    .select()
    .from(mvpAnalysesTable)
    .where(eq(mvpAnalysesTable.id, id));

  if (!row) {
    res.status(404).json({ error: "MVP analysis not found" });
    return;
  }
  res.json(row);
});

export { mvpRouter };
