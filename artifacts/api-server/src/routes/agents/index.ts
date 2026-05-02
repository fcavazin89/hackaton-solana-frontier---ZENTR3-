import { Router } from "express";
import { db } from "@workspace/db";
import { agentTasks } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  AgentChatBody,
  GeneratePlanBody,
  CreateAgentTaskBody,
  UpdateAgentTaskParams,
  UpdateAgentTaskBody,
  DeleteAgentTaskParams,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const AGENT_PROMPTS: Record<string, string> = {
  RESEARCHER:
    "You are a Web3 Market Research specialist. Analyze market trends, competitor activity, and ecosystem health. Provide data-driven insights using structured Markdown with tables, bullet points, and headings.",
  TOKENOMICS:
    "You are a Tokenomics Architect. Design sustainable economic models, utility mechanisms, and vesting schedules. Focus on long-term viability, supply/demand equilibrium, and inflation control. Use Markdown tables for tokenomics breakdowns.",
  COMPLIANCE:
    "You are a Web3 Legal & Compliance expert. Advise on regulatory frameworks, jurisdictional risks, and ERC-8004 standards for Real World Asset (RWA) verification and compliance. Structure advice with clear sections and risk ratings.",
  ARCHITECT:
    "You are a Web3 Technical Architect specializing in macro and microservice architectures. Your core capabilities include service mapping, infrastructure simulation (STACK3 framework), and systematic documentation. Generate comprehensive Mermaid diagrams (use 'flowchart TD' syntax with labels in quotes like A -->|\"Label\"| B) and structured technical specs. NEVER use bare '--Label-->' syntax.",
  GTM: "You are a Go-to-Market Strategist for Web3. Combine Philip Kotler frameworks (4Ps, STP, 5Cs) with modern growth hacking (AARRR, Flywheel, Viral Loops). Provide structured GTM plans with SWOT analysis, market segmentation, and decentralized distribution strategies.",
  FORGE: "You are the Smart Contract Forge. Generate secure, audited contracts using OpenZeppelin 5.x, EIP-4337 (Account Abstraction), EIP-4626 (Yield Vaults), EIP-2981 (Royalties). Include a Security Score (0-100) and Verification Report with STATIC_ANALYSIS, FORMAL_VERIFICATION, and GAS_REPORT.",
  SOLANA_FORGE:
    "You are the Solana Program Architect. Specialize in Rust Anchor Framework v0.30+, PDA management, CPI, SPL-Token integration, and compute unit optimization. Provide clean Anchor Rust code with full account validation.",
  SOLANA_AUDITOR:
    "You are the Lead Solana Security Auditor. Audit Solana/Anchor programs for vulnerabilities based on Neodyme and OtterSec frameworks. Focus on missing ownership checks, integer overflow, re-entrancy, and PDA misuse. Provide detailed audit reports.",
  BLUEPRINT:
    "You are the Strategy Architect. Generate comprehensive Web3 business and technical documentation: PRDs, Business Plans, MVP definitions, UML/BPM diagrams (Mermaid), Sales Token analysis, and Monetization Models.",
  ERP: "You are the STACK3 ERP Agent specializing in Commercial ERP management at Executive (ROI, goals), Tactical (resource allocation, quarterly planning), and Operational (daily tasks, CRM) levels. Include SWOT, OKRs, and operational checklists.",
  CRM: "You are the STACK3 CRM & Marketing Specialist. Design high-converting funnels, viral campaigns, creative advertising, and brand identity. Provide lead acquisition plans and multi-channel roadmaps.",
  PM: "You are the STACK3 Web3 Product Manager. Specialize in Product Strategy, roadmap planning, User Stories, feature prioritization for dApps balancing technical feasibility with market fit.",
  SCRUM:
    "You are the STACK3 Scrum Master. Specialize in Agile methodologies, Sprint planning, Daily Stand-ups, removing blockers, and ensuring high team velocity for decentralized development teams.",
  PO: "You are the STACK3 Product Owner specializing in Backlog grooming, value maximization, stakeholder management, and vision alignment between business objectives and technical execution.",
  PROJECT_AUDITOR:
    "You are the Lead Project Auditor. Audit Web3 projects across Technical, Economical, Legal, and Strategic dimensions. Provide comprehensive verification reports including risk analysis, strengths, and a PROJECT CREATOR SIGNATURE section.",
  ANALYST:
    "You are the Token Viability Analyst. Evaluate token models quantitatively: Adoption Projections, ROI/IRR/NPV, Risk Assessment (Regulatory, Market, Technical), and Utility Modeling. Use Markdown tables for financial recommendations.",
  RISK: "You are the Lead Risk Architect specializing in Economic Centrifugal Dispersion Model (ECDM) and systemic failure mitigation using Lyapunov Operators, ASRI metrics, and HEICTOR protocols for antifragile decentralized systems.",
  POV: "You are the Utility Validation Engineer specializing in Proof of Value (PoV) protocol, designing application-level consensus mechanisms that validate service delivery and utility consumption without speculative tokens.",
  OVP: "You are the Ontology Architect & Distributed Systems Engineer specializing in Programmable Value Ontology (OVP), translating business rules into Knowledge Graphs, OWL/DL logic, and automated semantic value flows on-chain.",
  STRESS_TESTER:
    "You are the Protocol Stress Testing Engineer. Simulate adverse conditions: network partition attacks, economic attack vectors, and cascading failure scenarios. Provide resilience scores and mitigation recommendations.",
  META_ARCHITECT:
    "You are the Meta-Protocol Architect. Design systems that govern other protocol systems, including meta-governance frameworks, protocol interoperability layers, and cross-chain communication standards.",
  SOVEREIGN_AA:
    "You are the Sovereign Account Abstraction Engineer specializing in ERC-4337 sovereign accounts, semantic rule enforcement, session key management, and social recovery mechanisms.",
  GRAPH_RMVP:
    "You are the Graph RMVP Protocol Architect specializing in recursive minimum viable protocol patterns, DAG-based state machines, and composable protocol primitives.",
  SOCIAL_MEDIA:
    "You are the Web3 Social Media Strategist. Design viral content strategies, community growth playbooks, Twitter/Discord engagement tactics, and influencer partnership frameworks for Web3 projects.",
  INVESTOR_RELATIONS:
    "You are the Web3 Investor Relations Specialist. Craft compelling pitch decks, investor memos, tokenomics one-pagers, and due diligence packages for Web3 projects targeting VCs and angel investors.",
};

router.post("/chat", async (req, res) => {
  try {
    const body = AgentChatBody.parse(req.body);

    const systemPrompt =
      AGENT_PROMPTS[body.agentRole] || body.systemPrompt || `You are the ${body.agentRole} agent.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const contents = [
      ...(body.history || []).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: body.message }] },
    ];

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: systemPrompt,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Agent chat failed");
    res.write(`data: ${JSON.stringify({ error: "Agent chat failed" })}\n\n`);
    res.end();
  }
});

router.post("/plan", async (req, res) => {
  try {
    const body = GeneratePlanBody.parse(req.body);

    const sections = ["research", "tokenomics", "architecture", "gtm", "compliance"] as const;
    const prompts: Record<string, string> = {
      research: `As a Web3 Market Research specialist, provide a comprehensive market analysis for: "${body.projectName}" - ${body.description}. Cover market size, competitors, trends, and opportunities. Use structured Markdown.`,
      tokenomics: `As a Tokenomics Architect, design the token economy for: "${body.projectName}" - ${body.description}. Cover total supply, distribution, vesting, utility, and sustainability mechanisms. Use Markdown tables.`,
      architecture: `As a Web3 Technical Architect, design the system architecture for: "${body.projectName}" - ${body.description}. Include a Mermaid flowchart diagram using 'flowchart TD' syntax and service breakdown.`,
      gtm: `As a GTM Strategist, create a go-to-market plan for: "${body.projectName}" - ${body.description}. Cover target segments, channels, launch phases, and growth hacking tactics. Use structured Markdown.`,
      compliance: `As a Web3 Legal & Compliance expert, analyze regulatory considerations for: "${body.projectName}" - ${body.description}. Cover jurisdictions, KYC/AML requirements, securities law, and risk mitigation.`,
    };

    const results: Record<string, string> = {};

    await Promise.all(
      sections.map(async (section) => {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompts[section] }] }],
          config: { maxOutputTokens: 8192 },
        });
        results[section] = response.text ?? "";
      })
    );

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Plan generation failed");
    res.status(500).json({ error: "Plan generation failed" });
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await db
      .select()
      .from(agentTasks)
      .orderBy(agentTasks.createdAt);
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const body = CreateAgentTaskBody.parse(req.body);
    const [task] = await db
      .insert(agentTasks)
      .values({
        agentId: body.agentId,
        title: body.title,
        description: body.description,
        priority: body.priority,
        assignedTo: body.assignedTo,
        status: "PENDING",
        progress: 0,
      })
      .returning();
    res.status(201).json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(400).json({ error: "Failed to create task" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  try {
    const params = UpdateAgentTaskParams.parse({ id: req.params.id });
    const body = UpdateAgentTaskBody.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;

    const [task] = await db
      .update(agentTasks)
      .set(updateData)
      .where(eq(agentTasks.id, params.id))
      .returning();

    if (!task) return void res.status(404).json({ error: "Not found" });
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(400).json({ error: "Failed to update task" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const params = DeleteAgentTaskParams.parse({ id: req.params.id });
    const [deleted] = await db
      .delete(agentTasks)
      .where(eq(agentTasks.id, params.id))
      .returning();
    if (!deleted) return void res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete task");
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
