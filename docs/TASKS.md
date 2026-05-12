# ZENTR3 — Implementation Task List

> **Version:** 1.0.0
> **Date:** May 11, 2026
> **Author:** Tiago Ferreira Cavazin
> **Hackathon:** Solana Frontier Hackathon 2026
> © 2026 Tiago Ferreira Cavazin. All rights reserved.

---

## Task Status Legend

| Symbol | Status |
|---|---|
| ✅ | Completed |
| 🔄 | In Progress |
| ⏳ | Pending |
| 🚫 | Blocked |

---

## Epic 1 — Monorepo & Infrastructure Setup

| ID | Task | Priority | Status |
|---|---|---|---|
| 1.1 | Initialize pnpm workspace monorepo | P0 | ✅ |
| 1.2 | Configure TypeScript 5.9 with composite builds | P0 | ✅ |
| 1.3 | Set up tsconfig.base.json with path aliases | P0 | ✅ |
| 1.4 | Configure pnpm-workspace.yaml with catalog | P0 | ✅ |
| 1.5 | Set up PostgreSQL + Drizzle ORM (`lib/db`) | P0 | ✅ |
| 1.6 | Define DB schema: `conversations`, `messages`, `agent_tasks` | P0 | ✅ |
| 1.7 | Configure esbuild for ESM API server bundle | P0 | ✅ |
| 1.8 | Set up pino structured logging | P1 | ✅ |
| 1.9 | Configure CORS and Express middleware | P0 | ✅ |

---

## Epic 2 — API Specification & Codegen

| ID | Task | Priority | Status |
|---|---|---|---|
| 2.1 | Write OpenAPI 3.1 spec (`lib/api-spec/openapi.yaml`) | P0 | ✅ |
| 2.2 | Configure Orval for React Query hooks codegen | P0 | ✅ |
| 2.3 | Configure Orval for Zod schema codegen | P0 | ✅ |
| 2.4 | Generate `lib/api-client-react` from OpenAPI spec | P0 | ✅ |
| 2.5 | Generate `lib/api-zod` from OpenAPI spec | P0 | ✅ |
| 2.6 | Fix `lib/api-zod/src/index.ts` post-codegen (single export) | P0 | ✅ |
| 2.7 | Add health check endpoint (`GET /api/healthz`) | P0 | ✅ |

---

## Epic 3 — Google Gemini AI Integration

| ID | Task | Priority | Status |
|---|---|---|---|
| 3.1 | Create `lib/integrations-gemini-ai` package | P0 | ✅ |
| 3.2 | Implement GoogleGenAI client with env var validation | P0 | ✅ |
| 3.3 | Configure `AI_INTEGRATIONS_GEMINI_BASE_URL` env var | P0 | ✅ |
| 3.4 | Configure `AI_INTEGRATIONS_GEMINI_API_KEY` env var | P0 | ✅ |
| 3.5 | Validate Gemini 2.5 Flash model streaming | P0 | ✅ |
| 3.6 | Set max output tokens to 8192 per request | P1 | ✅ |

---

## Epic 4 — Agent System (Backend)

| ID | Task | Priority | Status |
|---|---|---|---|
| 4.1 | Define `AGENT_PROMPTS` map for all 25 agents | P0 | ✅ |
| 4.2 | Implement `POST /api/agents/chat` SSE streaming endpoint | P0 | ✅ |
| 4.3 | Implement conversation history injection into Gemini context | P0 | ✅ |
| 4.4 | Implement `POST /api/agents/plan` multi-agent parallel execution | P0 | ✅ |
| 4.5 | Implement 5-section plan: research, tokenomics, architecture, gtm, compliance | P0 | ✅ |
| 4.6 | Implement `GET /api/agents/tasks` — list tasks | P1 | ✅ |
| 4.7 | Implement `POST /api/agents/tasks` — create task | P1 | ✅ |
| 4.8 | Implement `PATCH /api/agents/tasks/:id` — update task | P1 | ✅ |
| 4.9 | Implement `DELETE /api/agents/tasks/:id` — delete task | P1 | ✅ |
| 4.10 | Add Zod validation on all request bodies | P0 | ✅ |
| 4.11 | Add FORGE3 agent prompt (Solidity + Rust/Anchor) | P0 | ✅ |
| 4.12 | Add STACK3 agent prompt (Slither/Aderyn pipeline) | P0 | ✅ |
| 4.13 | Add SOLANA_FORGE agent (Anchor v0.30+, PDA, CPI) | P0 | ✅ |
| 4.14 | Add SOLANA_AUDITOR agent (Neodyme/OtterSec) | P0 | ✅ |
| 4.15 | Add SOVEREIGN_AA agent (ERC-4337) | P1 | ✅ |
| 4.16 | Add remaining 20 specialized agent prompts | P1 | ✅ |

---

## Epic 5 — Gemini Conversation System (Backend)

| ID | Task | Priority | Status |
|---|---|---|---|
| 5.1 | Implement `GET /api/gemini/conversations` | P0 | ✅ |
| 5.2 | Implement `POST /api/gemini/conversations` | P0 | ✅ |
| 5.3 | Implement `GET /api/gemini/conversations/:id` | P0 | ✅ |
| 5.4 | Implement `DELETE /api/gemini/conversations/:id` | P0 | ✅ |
| 5.5 | Implement `GET /api/gemini/conversations/:id/messages` | P0 | ✅ |
| 5.6 | Implement `POST /api/gemini/conversations/:id/messages` (SSE) | P0 | ✅ |
| 5.7 | Persist conversation history to PostgreSQL | P0 | ✅ |

---

## Epic 6 — Frontend: Command Center (Dashboard)

| ID | Task | Priority | Status |
|---|---|---|---|
| 6.1 | Set up React + Vite project with TypeScript | P0 | ✅ |
| 6.2 | Configure Tailwind CSS with cyberpunk neon theme | P0 | ✅ |
| 6.3 | Install Orbitron + JetBrains Mono fonts | P0 | ✅ |
| 6.4 | Implement Layout component with sidebar navigation | P0 | ✅ |
| 6.5 | Build Dashboard page — 25-agent grid | P0 | ✅ |
| 6.6 | Add ONLINE/OFFLINE status indicators per agent | P0 | ✅ |
| 6.7 | Implement agent card with role description | P0 | ✅ |
| 6.8 | Add navigation to agent chat from dashboard | P0 | ✅ |
| 6.9 | Set up Wouter routing | P0 | ✅ |
| 6.10 | Set up TanStack React Query with QueryClient | P0 | ✅ |
| 6.11 | Implement ProjectProvider context | P1 | ✅ |

---

## Epic 7 — Frontend: Agent Chat

| ID | Task | Priority | Status |
|---|---|---|---|
| 7.1 | Build AgentChat page (`/agent/:id`) | P0 | ✅ |
| 7.2 | Implement SSE streaming message consumption | P0 | ✅ |
| 7.3 | Implement real-time message rendering | P0 | ✅ |
| 7.4 | Add React Markdown renderer with remark-gfm | P0 | ✅ |
| 7.5 | Add Mermaid diagram rendering inline | P0 | ✅ |
| 7.6 | Implement conversation history display | P0 | ✅ |
| 7.7 | Add message input with send on Enter | P0 | ✅ |
| 7.8 | Show agent name and role in chat header | P1 | ✅ |
| 7.9 | Add loading/streaming indicator | P1 | ✅ |

---

## Epic 8 — Frontend: Business Plan Generator

| ID | Task | Priority | Status |
|---|---|---|---|
| 8.1 | Build BusinessPlan page (`/plan`) | P0 | ✅ |
| 8.2 | Implement project name + description form | P0 | ✅ |
| 8.3 | Call `POST /api/agents/plan` and display results | P0 | ✅ |
| 8.4 | Render 5 sections: Research, Tokenomics, Architecture, GTM, Compliance | P0 | ✅ |
| 8.5 | Add PDF export with html2pdf.js / jsPDF | P1 | ✅ |
| 8.6 | Add loading state during parallel generation | P1 | ✅ |
| 8.7 | Render Mermaid diagrams in Architecture section | P1 | ✅ |

---

## Epic 9 — Frontend: Task Board

| ID | Task | Priority | Status |
|---|---|---|---|
| 9.1 | Build TaskBoard page (`/tasks`) | P1 | ✅ |
| 9.2 | Implement Kanban columns: PENDING, IN_PROGRESS, DONE | P1 | ✅ |
| 9.3 | Implement create task form | P1 | ✅ |
| 9.4 | Implement task status update (drag or button) | P1 | ✅ |
| 9.5 | Implement task delete | P1 | ✅ |
| 9.6 | Display priority badges (LOW/MEDIUM/HIGH) | P2 | ✅ |
| 9.7 | Display progress bar per task | P2 | ✅ |

---

## Epic 10 — Frontend: Sprint Board & Roadmap

| ID | Task | Priority | Status |
|---|---|---|---|
| 10.1 | Build SprintBoard page (`/sprint`) | P1 | ✅ |
| 10.2 | Build Roadmap page (`/roadmap`) | P2 | ✅ |
| 10.3 | Implement timeline visualization | P2 | ✅ |

---

## Epic 11 — Frontend: Protocol Simulator

| ID | Task | Priority | Status |
|---|---|---|---|
| 11.1 | Build ProtocolSim page (`/protocol`) | P1 | ✅ |
| 11.2 | Implement live token metrics with Recharts | P1 | ✅ |
| 11.3 | Render Mermaid architecture diagram | P1 | ✅ |
| 11.4 | Add simulation parameter controls | P2 | ✅ |

---

## Epic 12 — Web3 & Smart Account Integration

| ID | Task | Priority | Status |
|---|---|---|---|
| 12.1 | Implement ERC-4337 Smart Account auto-provisioning | P0 | ✅ |
| 12.2 | Configure Base Sepolia testnet environment | P0 | ✅ |
| 12.3 | Configure Solana Testnet environment | P0 | ✅ |
| 12.4 | Auto-provision test tokens on account creation | P0 | ✅ |
| 12.5 | Implement Social Login (Google/Email) | P0 | ✅ |
| 12.6 | Integrate Slither static analysis in STACK3 pipeline | P0 | ✅ |
| 12.7 | Integrate Aderyn static analysis for Solana | P0 | ✅ |
| 12.8 | Implement one-click "Deploy to Testnet" | P0 | ✅ |

---

## Epic 13 — Documentation

| ID | Task | Priority | Status |
|---|---|---|---|
| 13.1 | Write README.md with full stack documentation | P0 | ✅ |
| 13.2 | Write PRD (Product Requirements Document) | P0 | ✅ |
| 13.3 | Write TASKS.md (this document) | P0 | ✅ |
| 13.4 | Write ARCHITECTURE.md | P0 | ✅ |
| 13.5 | Write AGENTS.md (agent catalog) | P1 | ✅ |
| 13.6 | Write CONTRIBUTING.md | P2 | ✅ |
| 13.7 | Write LICENSE file | P0 | ✅ |

---

## Epic 14 — Hackathon Submission

| ID | Task | Priority | Status |
|---|---|---|---|
| 14.1 | Push all code to GitHub repository | P0 | 🔄 |
| 14.2 | Verify all documentation is complete | P0 | 🔄 |
| 14.3 | Test judging path end-to-end | P0 | ⏳ |
| 14.4 | Record demo video | P0 | ⏳ |
| 14.5 | Submit to Solana Frontier Hackathon 2026 | P0 | ⏳ |

---

## Sprint Summary

| Sprint | Epics | Focus |
|---|---|---|
| Sprint 1 | 1, 2, 3 | Infrastructure, API spec, Gemini integration |
| Sprint 2 | 4, 5 | Agent system + Gemini conversation backend |
| Sprint 3 | 6, 7 | Frontend: Dashboard + Agent Chat |
| Sprint 4 | 8, 9, 10, 11 | Frontend: Business Plan, Task Board, Protocol Sim |
| Sprint 5 | 12 | Web3 + Smart Account integration |
| Sprint 6 | 13, 14 | Documentation + Hackathon submission |

---

*© 2026 Tiago Ferreira Cavazin — ZENTR3 | Solana Frontier Hackathon 2026*
