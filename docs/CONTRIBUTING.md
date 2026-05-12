# Contributing to ZENTR3

> © 2026 Tiago Ferreira Cavazin. All rights reserved.

---

## Prerequisites

- Node.js 24+
- pnpm (required — npm and yarn are blocked)
- PostgreSQL 15+
- Google Gemini API key

## Setup

```bash
git clone https://github.com/fcavazin89/hackaton-solana-frontier---ZENTR3-.git
cd hackaton-solana-frontier---ZENTR3-
pnpm install
cp .env.example .env   # fill in your env vars
pnpm --filter @workspace/db run push
```

## Development Workflow

```bash
# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (port 25823)
pnpm --filter @workspace/a2g-stack3 run dev

# Typecheck all packages
pnpm run typecheck

# Build all packages
pnpm run build
```

## Adding a New Agent

1. Add the agent ID and system prompt to `AGENT_PROMPTS` in `artifacts/api-server/src/routes/agents/index.ts`
2. Add the agent card to the Dashboard page in `artifacts/a2g-stack3/src/pages/dashboard.tsx`
3. Document the agent in `docs/AGENTS.md`

## Modifying the API

1. Edit `lib/api-spec/openapi.yaml` (source of truth)
2. Run codegen: `cd lib/api-spec && pnpm exec orval --config ./orval.config.ts`
3. **Important:** Revert `lib/api-zod/src/index.ts` to `export * from "./generated/api";` only
4. Implement the new endpoint in `artifacts/api-server/src/routes/`

## Code Style

- TypeScript strict mode enabled
- Prettier for formatting
- Zod for all runtime validation
- Drizzle ORM for all database queries (no raw SQL)

## Important Notes

- **Never** use npm or yarn — pnpm only
- **Never** commit `.env` files
- **Always** run `pnpm run typecheck` before committing
- After any Orval codegen run, manually fix `lib/api-zod/src/index.ts`

---

*© 2026 Tiago Ferreira Cavazin — ZENTR3 | Solana Frontier Hackathon 2026*
