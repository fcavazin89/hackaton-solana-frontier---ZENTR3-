# ZENTR3 — Architecture Document

> **Version:** 1.0.0
> **Date:** May 11, 2026
> **Author:** Tiago Ferreira Cavazin
> **Hackathon:** Solana Frontier Hackathon 2026
> © 2026 Tiago Ferreira Cavazin. All rights reserved.

---

## 1. System Overview

ZENTR3 is a full-stack Web3 AI platform built as a **pnpm workspace monorepo**. The system consists of two main artifacts (frontend + API server) and four shared libraries, all written in TypeScript.

```
┌─────────────────────────────────────────────────────────────────┐
│                         ZENTR3 Platform                          │
│                                                                   │
│  ┌─────────────────────┐      ┌──────────────────────────────┐  │
│  │   React Frontend    │      │      Express 5 API Server    │  │
│  │   (Vite + TS)       │◄────►│      (Node.js 24 + TS)       │  │
│  │   Port: 25823       │ HTTP │      Port: 8080              │  │
│  │   Route: /          │ SSE  │      Route: /api             │  │
│  └─────────────────────┘      └──────────────┬───────────────┘  │
│                                               │                   │
│  ┌────────────────────────────────────────────▼───────────────┐  │
│  │                    Shared Libraries                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │  lib/db  │ │lib/api-  │ │lib/api-  │ │lib/integra-  │  │  │
│  │  │ Drizzle  │ │  spec    │ │  zod     │ │tions-gemini  │  │  │
│  │  │ Postgres │ │ OpenAPI  │ │  Orval   │ │  @google/    │  │  │
│  │  │          │ │  3.1     │ │ codegen  │ │   genai      │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    External Services                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  PostgreSQL  │  │ Google Gemini│  │  Base Sepolia   │  │  │
│  │  │   Database   │  │  2.5 Flash   │  │  Solana Testnet │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

```
Agent-Stack-Three/                    # Workspace root
├── artifacts/                        # Deployable applications
│   ├── a2g-stack3/                   # React frontend
│   │   ├── src/
│   │   │   ├── pages/                # Route-level components
│   │   │   │   ├── dashboard.tsx     # Agent command center
│   │   │   │   ├── agent-chat.tsx    # SSE streaming chat
│   │   │   │   ├── business-plan.tsx # Multi-agent plan generator
│   │   │   │   ├── task-board.tsx    # Kanban task board
│   │   │   │   ├── sprint-board.tsx  # Agile sprint board
│   │   │   │   ├── roadmap.tsx       # Project roadmap
│   │   │   │   └── protocol-simulator.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   └── layout.tsx        # App shell + navigation
│   │   │   ├── context/
│   │   │   │   └── project-context.tsx
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities
│   │   │   ├── App.tsx               # Router + providers
│   │   │   └── main.tsx              # Entry point
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── api-server/                   # Express API server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── agents/
│   │   │   │   │   └── index.ts      # Agent chat, plan, tasks
│   │   │   │   ├── gemini/
│   │   │   │   │   └── index.ts      # Conversation CRUD
│   │   │   │   ├── health.ts         # Health check
│   │   │   │   └── index.ts          # Route aggregator
│   │   │   ├── lib/
│   │   │   │   └── logger.ts         # Pino logger
│   │   │   ├── app.ts                # Express app setup
│   │   │   └── index.ts              # Server entry point
│   │   ├── build.mjs                 # esbuild config
│   │   └── package.json
│   │
│   └── mockup-sandbox/               # Design mockup environment
│
├── lib/                              # Shared packages
│   ├── api-spec/
│   │   ├── openapi.yaml              # OpenAPI 3.1 (source of truth)
│   │   └── orval.config.ts           # Codegen configuration
│   ├── api-zod/
│   │   └── src/
│   │       ├── index.ts              # export * from "./generated/api"
│   │       └── generated/            # Orval-generated Zod schemas
│   ├── api-client-react/
│   │   └── src/
│   │       ├── index.ts              # React Query hooks
│   │       ├── custom-fetch.ts       # Fetch wrapper
│   │       └── generated/            # Orval-generated hooks
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── conversations.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── agentTasks.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts              # DB client export
│   │   └── drizzle.config.ts
│   └── integrations-gemini-ai/
│       └── src/
│           ├── client.ts             # GoogleGenAI client
│           └── index.ts
│
├── package.json                      # Workspace root
├── pnpm-workspace.yaml               # Workspace + catalog config
└── tsconfig.base.json                # Shared TS config
```

---

## 3. Data Flow

### 3.1 Agent Chat (SSE Streaming)

```
User Input
    │
    ▼
React Frontend (AgentChat page)
    │  POST /api/agents/chat
    │  { agentId, agentRole, message, history }
    ▼
Express API Server
    │  Validate with Zod (AgentChatBody)
    │  Lookup AGENT_PROMPTS[agentRole]
    │  Set SSE headers
    ▼
Google Gemini 2.5 Flash
    │  generateContentStream()
    │  model: "gemini-2.5-flash"
    │  systemInstruction: agent prompt
    │  maxOutputTokens: 8192
    ▼
SSE Stream → Frontend
    │  data: {"content": "chunk"}
    │  data: {"done": true}
    ▼
React Markdown Renderer
    │  remark-gfm
    │  Mermaid diagrams
    ▼
User sees streamed response
```

### 3.2 Multi-Agent Business Plan

```
User Input (projectName + description)
    │
    ▼
POST /api/agents/plan
    │
    ▼
Parallel Execution (Promise.all)
    ├── RESEARCHER agent → market analysis
    ├── TOKENOMICS agent → token economy
    ├── ARCHITECT agent → system architecture + Mermaid
    ├── GTM agent → go-to-market plan
    └── COMPLIANCE agent → regulatory analysis
    │
    ▼
JSON Response { research, tokenomics, architecture, gtm, compliance }
    │
    ▼
Frontend renders 5 sections
    │
    ▼
PDF Export (html2pdf.js / jsPDF)
```

### 3.3 Task Board CRUD

```
Frontend (TaskBoard)
    │
    ├── GET /api/agents/tasks → list tasks
    ├── POST /api/agents/tasks → create task
    ├── PATCH /api/agents/tasks/:id → update status/progress
    └── DELETE /api/agents/tasks/:id → delete task
    │
    ▼
Express → Zod validation → Drizzle ORM → PostgreSQL
    │
    ▼
React Query cache invalidation → UI update
```

---

## 4. API Design

### 4.1 Design Principles
- **OpenAPI-first:** `lib/api-spec/openapi.yaml` is the single source of truth
- **Codegen:** Orval generates both React Query hooks and Zod validation schemas
- **Type safety:** End-to-end TypeScript from DB schema to frontend component
- **Streaming:** SSE (Server-Sent Events) for real-time AI responses

### 4.2 Request Validation Chain

```
HTTP Request
    │
    ▼
Express Router
    │
    ▼
Zod Schema (from @workspace/api-zod)
    │  AgentChatBody.parse(req.body)
    │  Throws ZodError on invalid input
    ▼
Route Handler
    │
    ▼
Drizzle ORM (type-safe queries)
    │
    ▼
PostgreSQL
```

---

## 5. Database Design

### 5.1 Entity Relationship Diagram

```
conversations
┌─────────────────┐
│ id (serial PK)  │
│ title (text)    │
│ created_at      │
└────────┬────────┘
         │ 1:N
         ▼
messages
┌──────────────────────┐
│ id (serial PK)       │
│ conversation_id (FK) │
│ role (text)          │
│ content (text)       │
│ created_at           │
└──────────────────────┘

agent_tasks (independent)
┌──────────────────────────────────────┐
│ id (text PK, auto-generated)         │
│ agent_id (text)                      │
│ title (text)                         │
│ description (text)                   │
│ status (text) DEFAULT 'PENDING'      │
│ priority (text) DEFAULT 'MEDIUM'     │
│ progress (integer) DEFAULT 0         │
│ assigned_to (text)                   │
│ created_at (timestamp)               │
└──────────────────────────────────────┘
```

---

## 6. Frontend Architecture

### 6.1 Component Hierarchy

```
App.tsx
├── QueryClientProvider (TanStack React Query)
├── TooltipProvider (Radix UI)
├── ProjectProvider (custom context)
└── WouterRouter
    └── Layout
        ├── Sidebar navigation
        └── Switch (routes)
            ├── / → Dashboard
            ├── /agent/:id → AgentChat
            ├── /plan → BusinessPlan
            ├── /tasks → TaskBoard
            ├── /sprint → SprintBoard
            ├── /roadmap → Roadmap
            └── /protocol → ProtocolSim
```

### 6.2 State Management

| Layer | Tool | Purpose |
|---|---|---|
| Server state | TanStack React Query | API data fetching, caching, invalidation |
| Global state | React Context (ProjectProvider) | Project-level shared state |
| Form state | React Hook Form + Zod | Form validation and submission |
| Local state | React useState/useReducer | Component-level UI state |

### 6.3 Styling System

- **Base:** Tailwind CSS with custom cyberpunk neon theme
- **Components:** shadcn/ui (Radix UI primitives + Tailwind)
- **Fonts:** Orbitron (headings) + JetBrains Mono (code/data)
- **Theme:** Neon cyan on dark background
- **Animations:** Framer Motion for transitions

---

## 7. Security Architecture

### 7.1 3-Layer Security Pipeline

```
Contract Generation (FORGE3)
    │
    ▼
Layer 1: Static Analysis
    ├── Slither (EVM/Solidity)
    │   └── Reentrancy, integer overflow, access control
    └── Aderyn (Solana/Rust)
        └── Missing ownership checks, PDA misuse
    │
    ▼
Layer 2: Formal Verification
    └── Symbolic execution + invariant checking
    │
    ▼
Layer 3: Gas Report
    └── Optimization analysis
    │
    ▼
Security Score (0-100)
    │
    ▼
Deploy to Testnet (STACK3)
```

### 7.2 Account Abstraction (ERC-4337)

```
User (Social Login)
    │
    ▼
ZENTR3 Platform
    │  Auto-generates Smart Account
    ▼
ERC-4337 Smart Account
    ├── No seed phrase required
    ├── Session key management
    ├── Social recovery
    └── Semantic rule enforcement
    │
    ▼
Base Sepolia / Solana Testnet
```

---

## 8. Build & Deployment

### 8.1 Build Pipeline

```
pnpm run build
    │
    ├── pnpm run typecheck
    │   ├── tsc --build (libs)
    │   └── tsc --noEmit (artifacts)
    │
    └── pnpm -r run build
        ├── Vite build (frontend)
        └── esbuild (API server → ESM bundle)
```

### 8.2 API Server Bundle

- **Tool:** esbuild
- **Format:** ESM (`dist/index.mjs`)
- **Bundled:** `@google/genai` (not external)
- **External:** Node.js built-ins, pino workers

### 8.3 Environment Configuration

```
Production:
  AI_INTEGRATIONS_GEMINI_BASE_URL  → Gemini API base URL
  AI_INTEGRATIONS_GEMINI_API_KEY   → Gemini API key
  DATABASE_URL                     → PostgreSQL connection string
  SESSION_SECRET                   → Session secret (future auth)
  NODE_ENV                         → production
```

---

## 9. Codegen Workflow

```
lib/api-spec/openapi.yaml (edit here)
    │
    ▼
pnpm exec orval --config ./orval.config.ts
    │
    ├── lib/api-zod/src/generated/api.ts
    │   └── Zod schemas for all request/response bodies
    │
    └── lib/api-client-react/src/generated/
        └── React Query hooks for all endpoints
    │
    ▼
IMPORTANT: Revert lib/api-zod/src/index.ts to:
export * from "./generated/api";
```

---

*© 2026 Tiago Ferreira Cavazin — ZENTR3 | Solana Frontier Hackathon 2026*
