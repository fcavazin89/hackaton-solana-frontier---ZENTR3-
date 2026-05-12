# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Growth — 2AG Web3 Agents (`artifacts/growth`)
- **Preview path**: `/`
- **Description**: Platform with AI agents (2AG) that help Web3 startups grow across community, tokenomics, marketing, traction, analytics, and partnerships.
- **Pages**: Dashboard, Agents, Agent Detail, Tasks, Insights, Projects, Project Detail
- **Theme**: Dark mode, electric violet (#primary) + cyan (#secondary), Space Grotesk + JetBrains Mono fonts

## Database Schema

- `projects` — Web3 startup projects (name, chain, stage, links)
- `agents` — 2AG AI agents (name, type, status, projectId, tasksCompleted, insightsGenerated)
- `tasks` — Agent tasks (title, agentId, projectId, status, priority, category, result)
- `insights` — Agent-generated insights (title, content, agentId, projectId, category, impact)
