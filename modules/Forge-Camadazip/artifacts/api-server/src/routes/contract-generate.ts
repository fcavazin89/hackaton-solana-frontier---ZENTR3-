import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router = Router();

const GenerateContractBody = z.object({
  description: z.string().min(1).max(2000),
  platform: z.enum(["evm", "solana"]),
  contractType: z.string().optional(),
});

const EVM_SYSTEM_PROMPT = `You are ContractForge AI, an expert Solidity smart contract developer for the FORGE3 platform.

Your job is to generate production-ready, secure Solidity smart contracts based on a natural language description.

RULES:
- Always output ONLY the raw Solidity code, no markdown, no explanations, no code fences
- Start directly with // SPDX-License-Identifier: MIT
- Use Solidity ^0.8.22
- Use OpenZeppelin v5 when applicable (import from @openzeppelin/contracts)
- Follow best practices: checks-effects-interactions, reentrancy guards, access control
- Add NatSpec comments in Portuguese (/// @notice, /// @dev, /// @param, /// @return)
- The code must be complete and deployable as-is
- Include all necessary imports
- Use clear, descriptive variable and function names in English`;

const SOLANA_SYSTEM_PROMPT = `You are ContractForge AI, an expert Solana smart contract developer for the FORGE3 platform.

Your job is to generate production-ready Rust programs using the Anchor framework based on a natural language description.

RULES:
- Always output ONLY the raw Rust code, no markdown, no explanations, no code fences
- Start directly with use anchor_lang::prelude::*;
- Use Anchor framework patterns (declare_id!, #[program], #[account], #[derive(Accounts)], #[error_code])
- Follow Solana best practices: PDA seeds, rent-exempt accounts, proper CPI
- Add doc comments in Portuguese (/// ) for all public instructions and structs
- The code must be complete and compilable in Solana Playground
- Include all necessary imports from anchor_lang and anchor_spl
- Use declare_id!("11111111111111111111111111111111") as placeholder program ID
- Use clear, descriptive variable and function names in snake_case`;

router.post("/contracts/generate", async (req, res) => {
  const parsed = GenerateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Parâmetros inválidos", details: parsed.error.flatten() });
    return;
  }

  const { description, platform } = parsed.data;
  const systemPrompt = platform === "evm" ? EVM_SYSTEM_PROMPT : SOLANA_SYSTEM_PROMPT;
  const lang = platform === "evm" ? "Solidity" : "Rust/Anchor";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Gere um contrato ${lang} completo para: ${description}`,
        },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error generating contract");
    res.write(`data: ${JSON.stringify({ error: "Erro ao gerar contrato. Tente novamente." })}\n\n`);
    res.end();
  }
});

export default router;
