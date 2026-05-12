import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { RecommendGovernanceBody } from "@workspace/api-zod";

const router = Router();

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  pt: "Responda SEMPRE em Português do Brasil. Todos os textos de 'recommendation', 'rationale', 'risks', 'nextSteps' e 'proposalTypes' devem estar em Português do Brasil.",
  en: "Always respond in English. All 'recommendation', 'rationale', 'risks', 'nextSteps' and 'proposalTypes' texts must be in English.",
  es: "Responde SIEMPRE en Español. Todos los textos de 'recommendation', 'rationale', 'risks', 'nextSteps' y 'proposalTypes' deben estar en Español.",
};

router.post("/ai/recommend-governance", async (req, res) => {
  const body = RecommendGovernanceBody.parse(req.body);
  const language: string = (req.body.language as string) ?? "pt";
  const langInstruction = LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS.pt;

  const systemPrompt = `You are DAOX, a Web3 governance architect specializing in designing decentralized governance systems for startups.

${langInstruction}

Your job is to analyze a startup's current stage and characteristics and generate a complete, tailored governance structure recommendation.

You must return a valid JSON object matching this exact structure:
{
  "daoModel": "token-based" | "reputation-based" | "multisig" | "hybrid",
  "votingSystem": "simple-majority" | "supermajority" | "quadratic" | "weighted",
  "proposalTypes": ["treasury", "protocol updates", "partnerships", ...],
  "quorum": "10%",
  "executionMechanism": "snapshot" | "safe-multisig" | "on-chain" | "hybrid",
  "recommendation": "short strategic recommendation sentence in the requested language",
  "rationale": "detailed reasoning paragraph in the requested language",
  "risks": ["risk1 in the requested language", "risk2", "risk3"],
  "nextSteps": ["step1 in the requested language", "step2", "step3", "step4"],
  "maturityScore": 1-10
}

Decision rules:
- Early stage (idea/build) + small community (<100) → multisig
- Growth stage + defined token → hybrid DAO
- Scale stage + circulating token + large community (>500) → token-based
- Strong community reputation focus → reputation-based
- Default recommendation: hybrid (safest)

Always avoid token concentration. Recommend minimum 10% quorum. Always include security measures (timelock, multi-sig fallback).`;

  const userPrompt = `Analyze this startup and recommend a governance structure:

Stage: ${body.stage}
Community Size: ${body.communitySize} members
Token Distribution: ${body.tokenDistribution}
Governance Goal: ${body.governanceGoal}
Risk Level: ${body.riskLevel ?? "medium"}

Return ONLY a valid JSON object with the recommendation. ${langInstruction}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const recommendation = JSON.parse(content);

  res.json(recommendation);
});

export default router;
