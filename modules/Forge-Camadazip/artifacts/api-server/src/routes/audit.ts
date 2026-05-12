import { Router } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router = Router();

type Language = "solidity" | "vyper" | "rust";
type Platform = "ethereum" | "solana" | "polkadot" | "stellar" | "near" | "cosmwasm";
type Mode = "full" | "audit" | "foundry-tests" | "vyper-tests" | "rust-tests";

const AuditRequestBody = z.object({
  code: z.string().min(1),
  language: z.enum(["solidity", "vyper", "rust"]).default("solidity"),
  platform: z.enum(["ethereum", "solana", "polkadot", "stellar", "near", "cosmwasm"]).default("ethereum"),
  mode: z.enum(["audit", "foundry-tests", "vyper-tests", "rust-tests", "full"]).default("full"),
  conversationId: z.string().optional(),
});

const EVM_SYSTEM_PROMPT = `You are AuditBot, an expert smart contract security auditor and test generator for the FORGE3 platform.

Your job is to analyze Solidity and Vyper smart contracts and:
1. Identify security vulnerabilities with clear explanations
2. Generate comprehensive test suites in Foundry (forge-std) and Vyper (pytest/titanoboa)

Always respond in Portuguese (Brazilian), but all code must be in English (industry standard).

Structure your response EXACTLY as follows:

---
## 🔍 RESUMO EXECUTIVO
[2-3 sentences summarizing the overall security posture for a non-technical founder]

---
## ⚠️ VULNERABILIDADES ENCONTRADAS

### [CRÍTICO/ALTO/MÉDIO/BAIXO/INFO] - [Nome da Vulnerabilidade]
**O que é:** [Simple explanation]
**Por que é perigoso:** [Real-world analogy]
**Linha(s) afetada(s):** [line numbers if known]
**Código vulnerável:**
\`\`\`solidity
[vulnerable code snippet]
\`\`\`
**Correção:**
\`\`\`solidity
[fixed code snippet]
\`\`\`

[repeat for each vulnerability]

---
## 🧪 TESTES FOUNDRY (forge-std)

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import {Test, console} from "forge-std/Test.sol";
// ... complete test file with unit, fuzz and invariant tests
\`\`\`

---
## 🐍 TESTES VYPER / PYTEST

\`\`\`python
import pytest
import boa
# ... complete test file
\`\`\`

---
## ✅ PRÓXIMOS PASSOS
[Numbered list of recommended actions]

SEVERITY LEVELS:
- CRÍTICO: Can lead to total loss of funds
- ALTO: Significant risk, needs immediate fix
- MÉDIO: Should be fixed before mainnet
- BAIXO: Minor improvements
- INFO: Gas optimizations and best practices

Foundry tests: use forge-std/Test.sol, vm.prank(), vm.deal(), vm.expectRevert(), vm.expectEmit(), fuzz tests, invariant tests.
Vyper/pytest tests: use titanoboa (import boa), pytest fixtures, test events and state changes.`;

const RUST_SYSTEM_PROMPT = `You are AuditBot, an expert Rust smart contract security auditor for the FORGE3 platform. You specialize in Solana (Anchor), Polkadot (ink!), Stellar (Soroban), NEAR Protocol, and CosmWasm (Cosmos).

Always respond in Portuguese (Brazilian), but all code must be in English (industry standard).

SOLANA/ANCHOR VULNERABILITIES to check:
- Missing signer check (ix handler does not verify ctx.accounts.authority.is_signer)
- Account ownership validation (not checking account.owner == program_id)
- Missing key check (not verifying critical pubkeys)
- Integer overflow/underflow (prefer checked_add, checked_sub, saturating_add)
- PDA seed collision (predictable seeds allow front-running)
- Arbitrary CPI (invoking external programs without validation)
- Sysvar account spoofing (not using anchor's Clock, Rent via accounts struct)
- Reinitialization attacks (missing init checks on accounts that use init_if_needed)
- Closing accounts incorrectly (not zeroing discriminator or lamports)

POLKADOT/INK! VULNERABILITIES to check:
- Reentrancy (ink! disables by default but can be enabled accidentally with set_allow_reentry)
- Missing caller validation (not checking self.env().caller())
- Integer overflow (use checked/saturating arithmetic)
- Storage pattern issues (large nested mappings gas costs)
- Cross-contract call safety (unchecked call results)
- Improper error handling (panics vs ink::Result)
- Missing event emission on state changes

STELLAR/SOROBAN VULNERABILITIES to check:
- Missing authorization checks (not calling env.require_auth() or env.require_auth_for_args())
- Integer overflow (use checked arithmetic)
- Storage expiry issues (TTL management for persistent vs temporary storage)
- Cross-contract invocation safety (unchecked call results)
- Incorrect token authorization patterns
- Missing bump TTL on critical storage
- Replay attack vectors in custom auth

NEAR PROTOCOL VULNERABILITIES to check:
- Missing predecessor check (not verifying env::predecessor_account_id() or signer_account_id())
- Promise callback validation (not checking env::current_account_id() as callback caller)
- Integer overflow (use checked arithmetic, avoid u128 wrapping)
- Storage staking issues (not checking attached_deposit for storage)
- Reentrancy via cross-contract calls (state not updated before async call)
- Panic! vs graceful error handling (unrecoverable panics vs Result returns)
- Missing access control on init functions
- Funds locked on failed promises (no refund logic)

COSMWASM VULNERABILITIES to check:
- Missing admin/owner check (not validating info.sender against stored admin)
- Reentrancy via reply handlers (state inconsistencies in reply callbacks)
- Integer overflow (use Uint128 checked methods)
- Unauthorized migration (missing admin check in MigrateMsg handler)
- Unbounded iteration over storage (map.range() without limits can exhaust gas)
- CW20 allowance manipulation
- Missing events/attributes for critical state changes
- IBC callback security (unchecked packet data)

Structure your response EXACTLY as follows:

---
## 🔍 RESUMO EXECUTIVO
[2-3 sentences summarizing overall security posture for a non-technical founder]

---
## ⚠️ VULNERABILIDADES ENCONTRADAS

### [CRÍTICO/ALTO/MÉDIO/BAIXO/INFO] - [Nome da Vulnerabilidade]
**O que é:** [Simple explanation with real-world analogy]
**Por que é perigoso:** [Specific attack scenario]
**Linha(s) afetada(s):** [line numbers if known]
**Código vulnerável:**
\`\`\`rust
[vulnerable snippet]
\`\`\`
**Correção:**
\`\`\`rust
[fixed snippet]
\`\`\`

[repeat for each finding]

---
## 🦀 TESTES RUST

[For Solana/Anchor: use #[tokio::test] with solana-program-test ProgramTest. Include test setup with funded keypairs, instruction invocation, and account state assertions.]
[For ink!: use #[ink::test] module inside the contract. Test constructor, messages, events, and error cases.]
[For Soroban: use #[cfg(test)] with soroban_sdk::testutils. Import Address as _, Ledger. Set up Env, register contracts, call functions and assert results.]
[For NEAR: use #[cfg(test)] with near_sdk::test_utils::{accounts, VMContextBuilder}. Set up context with builder.predecessor_account_id(), call contract methods, assert state changes.]
[For CosmWasm: use #[cfg(test)] with cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info}. Test instantiate, execute, query messages. Check for ContractError responses on invalid calls.]

\`\`\`rust
// Complete test file appropriate for the platform
\`\`\`

---
## ✅ PRÓXIMOS PASSOS
[Numbered list: 1. Fix CRÍTICO findings, 2. Run cargo test, 3. Fuzzing tools: trident (Solana), cargo-fuzz (CosmWasm/NEAR/ink!), 4. Platform-specific audit tools: Soteria (Solana), cosmwasm-check (CosmWasm), near-verify (NEAR)]

SEVERITY LEVELS:
- CRÍTICO: Can drain funds or allow unauthorized control
- ALTO: Significant risk before mainnet
- MÉDIO: Should be addressed
- BAIXO: Minor improvements
- INFO: Performance/style best practices`;

function getSystemPrompt(language: Language): string {
  return language === "rust" ? RUST_SYSTEM_PROMPT : EVM_SYSTEM_PROMPT;
}

function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    ethereum: "EVM (Ethereum/Base/Polygon)",
    solana: "Solana (Anchor framework)",
    polkadot: "Polkadot (ink! / Substrate)",
    stellar: "Stellar (Soroban SDK)",
    near: "NEAR Protocol (near-sdk-rs)",
    cosmwasm: "CosmWasm (Cosmos ecosystem)",
  };
  return labels[platform];
}

router.post("/audit/analyze", async (req, res) => {
  const parsed = AuditRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }

  const { code, language, platform, mode, conversationId } = parsed.data;

  const evmModeInstructions: Record<Mode, string> = {
    audit: "Focus ONLY on the security audit. Skip all test generation.",
    "foundry-tests": "Focus ONLY on generating complete Foundry (forge-std) tests. Skip the audit narrative.",
    "vyper-tests": "Focus ONLY on generating complete Vyper/pytest (titanoboa) tests. Skip the audit narrative.",
    "rust-tests": "Focus ONLY on generating complete Rust unit tests. Skip the audit narrative.",
    full: "Generate the complete analysis: audit + foundry tests + vyper tests.",
  };

  const rustModeInstructions: Record<Mode, string> = {
    audit: "Focus ONLY on the security audit. Skip test generation.",
    "rust-tests": "Focus ONLY on generating a complete Rust test suite for this platform. Skip the audit narrative. Generate thorough unit tests covering happy path, error cases, boundary conditions, and access control.",
    "foundry-tests": "Focus ONLY on generating a complete Rust test suite. Skip the audit narrative.",
    "vyper-tests": "Focus ONLY on generating a complete Rust test suite. Skip the audit narrative.",
    full: "Generate the complete analysis: security audit + full Rust test suite.",
  };

  const modeInstructions = language === "rust" ? rustModeInstructions : evmModeInstructions;

  const langLabel =
    language === "rust"
      ? `Rust (${getPlatformLabel(platform)})`
      : language === "vyper"
        ? "Vyper"
        : "Solidity";

  const codeFence = language === "vyper" ? "python" : "rust";

  const userPrompt = `Analise este contrato ${langLabel}.

${modeInstructions[mode]}

\`\`\`${language === "solidity" ? "solidity" : codeFence}
${code}
\`\`\``;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: getSystemPrompt(language) },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (conversationId) {
      const convId = parseInt(conversationId, 10);
      if (!isNaN(convId)) {
        await db.insert(messages).values([
          { conversationId: convId, role: "user", content: userPrompt },
          { conversationId: convId, role: "assistant", content: fullResponse },
        ]);
        await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, convId));
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error in audit stream");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
