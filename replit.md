# A2G STACK3 — Web3 AI Agent Command Center

## Overview

pnpm workspace monorepo using TypeScript. Full-stack Web3 AI agent platform with 24 specialized agents powered by Gemini AI, SSE streaming chat, business plan generator, task board, and protocol simulator.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Orbitron + JetBrains Mono fonts, neon cyan cyberpunk theme)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Google Gemini via Replit AI Integration (`@workspace/integrations-gemini-ai`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)

## Artifacts

| Artifact | Path | Port | Description |
|---|---|---|---|
| `artifacts/a2g-stack3` | `/` | 25823 | React frontend — agent command center UI |
| `artifacts/api-server` | `/api` | 8080 | Express API server |

## Key Pages

- **Command Center** (`/`) — 24-agent deployment grid with ONLINE/OFFLINE status
- **Agent Chat** (`/chat/:agentId`) — SSE streaming chat with each agent
- **Business Plan** (`/business-plan`) — Multi-agent plan generator
- **Task Board** (`/tasks`) — Kanban-style agent task board
- **Protocol Sim** (`/protocol-sim`) — Live token metrics + Mermaid architecture diagram

## Key API Endpoints

- `GET /api/healthz` — Health check
- `GET/POST /api/gemini/conversations` — Conversation CRUD
- `POST /api/agents/chat` (SSE) — Stream chat with an agent
- `POST /api/agents/plan` — Generate multi-agent business plan
- `GET/POST/PATCH /api/agents/tasks` — Agent task board CRUD

## DB Schema (lib/db/src/schema/)

- `conversations` — Gemini conversation sessions
- `messages` — Per-conversation messages
- `agentTasks` — Agent task board items (Kanban)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `cd lib/api-spec && pnpm exec orval --config ./orval.config.ts` — regenerate API hooks/Zod schemas (then manually fix `lib/api-zod/src/index.ts` to `export * from "./generated/api";` only)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Important Notes

- `lib/api-zod/src/index.ts` must stay as `export * from "./generated/api";` ONLY — orval codegen adds bad extra exports that must be reverted after any codegen run
- `@google/genai` is NOT in the esbuild external list (it gets bundled into the API server)
- AI integration env vars: `AI_INTEGRATIONS_GEMINI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY`
- SESSION_SECRET env var is set for future auth use

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
