import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router = Router();

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});

const ForgeAgentBody = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  platform: z.enum(["evm", "solana"]),
});

function buildSystemPrompt(platform: string): string {
  const langInfo =
    platform === "evm"
      ? "EVM · Solidity ^0.8.22 · OpenZeppelin v5 · Base / Polygon"
      : "Solana · Rust · Anchor framework · Solana Playground";

  const codeRules =
    platform === "evm"
      ? `- Coloque o contrato Solidity completo em um bloco \`\`\`solidity\\n...\\n\`\`\`
- Use Solidity ^0.8.22, OpenZeppelin v5 quando aplicável
- Siga: checks-effects-interactions, ReentrancyGuard, AccessControl
- Adicione NatSpec em português (/// @notice, /// @dev, /// @param, /// @return)
- Inicie com // SPDX-License-Identifier: MIT`
      : `- Coloque o programa Rust/Anchor completo em um bloco \`\`\`rust\\n...\\n\`\`\`
- Use Anchor framework com declare_id!("11111111111111111111111111111111")
- PDA seeds corretos, contas rent-exempt, validações de signer
- Adicione doc comments em português (///)`;

  return `Você é o **ForgeBot**, agente especialista em engenharia de smart contracts da plataforma FORGE3.

PLATAFORMA ATIVA: ${langInfo}

MISSÃO:
Criar, explicar e iterar sobre smart contracts a partir de comandos em linguagem natural.

REGRAS DE COMPORTAMENTO:
- Responda SEMPRE em português do Brasil
- Seja técnico, direto e objetivo — sem enrolação
- Quando o usuário pedir um contrato, gere o código COMPLETO e funcional
${codeRules}
- Após o código, escreva 2-3 linhas explicando o que foi criado
- Indique onde fazer deploy: ${platform === "evm" ? "Remix (remix.ethereum.org)" : "Solana Playground (beta.solpg.io)"}
- Se o usuário pedir alterações, regenere o contrato COMPLETO com as modificações aplicadas
- Se a pergunta for conceitual (sem pedido de código), responda de forma clara e didática
- Nunca trunque o código — se for longo, gere-o completo de qualquer forma`;
}

router.post("/contracts/forge-agent", async (req, res) => {
  const parsed = ForgeAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Parâmetros inválidos", details: parsed.error.flatten() });
    return;
  }

  const { messages, platform } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: buildSystemPrompt(platform) },
        ...messages,
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
    req.log.error({ err }, "Error in forge agent");
    res.write(`data: ${JSON.stringify({ error: "Erro ao processar. Tente novamente." })}\n\n`);
    res.end();
  }
});

export default router;
