# CAPITAL3 — STACK3 Hub de Agentes

## Overview

pnpm workspace monorepo. CAPITAL3 is a multi-agent AI platform for startup founders covering Web3 funding, MVP validation, business model design, and pitch deck generation.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI GPT-4o via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Brand

- Fonts: Orbitron (headings/mono), Raleway (body)
- Colors: #FFB300 gold primary, #0D0D0D carbon bg, #1A1A1A card, #EDEDED foreground
- Theme: dark carbon grid, gold accents, monospace terminal aesthetic

## Agents

### 1. Funding Agent — CAPITAL3 Core (`/analyze`)
- Web3 startup analysis: tokenomics, funding strategy, risk assessment, 3 valuation scenarios
- Routes: `POST /api/capital3/analyze`, `GET /api/capital3/analyses`, `GET /api/capital3/analyses/:id`, `GET /api/capital3/stats`
- DB table: `analyses`

### 2. MVP Validator (`/mvp`)
- StartSe framework: Problem-Solution FIT, Product-Solution FIT, Product-Market FIT (0-100 scores)
- Validation strategy: experiment design, MVP type recommendation (Concierge/Wizard of Oz/etc.)
- Recommendation: pivot / persist / accelerate
- Routes: `POST /api/mvp/validate`, `GET /api/mvp/analyses`, `GET /api/mvp/analyses/:id`
- DB table: `mvp_analyses`

### 3. Business Model Architect (`/bizmodel`)
- InovAtiva Brasil framework: primary model + alternatives with fit scores
- CAC/LTV analysis, revenue streams, competitive positioning, monetization strategy
- Routes: `POST /api/bizmodel/analyze`, `GET /api/bizmodel/analyses`, `GET /api/bizmodel/analyses/:id`
- DB table: `business_model_analyses`

### 4. Pitch Builder (`/pitch`)
- 11-section investor pitch deck narrative (cover, context, problem, market, solution, biz model, traction, GTM, competitors, team, round)
- Key metrics grid, structured for presentation delivery
- Routes: `POST /api/pitch/build`, `GET /api/pitch/pitches`, `GET /api/pitch/pitches/:id`
- DB table: `pitches`

## Frontend Pages (`artifacts/capital3`)
- `/` — Home with agent hub (4 agent cards) + recent analyses feed
- `/analyze` + `/results/:id` — Funding Agent
- `/mvp` + `/mvp/results/:id` — MVP Validator
- `/bizmodel` + `/bizmodel/results/:id` — Business Model Architect
- `/pitch` + `/pitch/results/:id` — Pitch Builder
- `/history` — searchable analysis history (Funding Agent)
- `/dashboard` — aggregate stats dashboard

## Architecture
- Frontend: React + Vite + Tailwind (dark carbon grid, gold Orbitron theme)
- Backend: Express 5 + Drizzle ORM + PostgreSQL
- AI: OpenAI GPT-4o structured JSON output → saved to DB → served via REST
- API contract: OpenAPI spec → Orval codegen → React Query hooks + Zod validators

## Export System (Funding Agent results)
- PDF via jsPDF (with gold watermark)
- PPTX via pptxgenjs (5-slide deck)
- DOCX via docx package
- All client-side, accessible from result page toolbar

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
