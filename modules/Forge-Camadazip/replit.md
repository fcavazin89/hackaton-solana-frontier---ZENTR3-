# FORGE3 — Engenharia

## Overview

FORGE3 é uma plataforma de agentes A2G (Agent-to-Guide) que ajuda pessoas sem conhecimento técnico a entender e construir infraestrutura de engenharia e Web3. Faz parte da CAMADA — CONSTRUÇÃO (CRIAR).

pnpm workspace monorepo usando TypeScript.

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
- **AI**: OpenAI via Replit AI Integrations (gpt-5.1, streaming SSE)
- **Web3**: @openzeppelin/wizard (geração de contratos Solidity)

## Módulos

### Agentes A2G (AI Chat)
- **ArquiBot** (`arch-001`) — Arquitetura técnica: microsserviços, APIs, bancos de dados
- **SmartBot** (`contract-002`) — Smart contracts, Web3, blockchain, ERC-4337
- **InfraBot** (`infra-003`) — Infraestrutura, DevOps, containers, CI/CD

Todos respondem em português, com linguagem simples para não-técnicos.

### Camada Web3 — The Forge
- **Contract Forge** (`/web3/forge`) — Gerador de contratos Solidity via OpenZeppelin Wizard: ERC-20, ERC-721, ERC-1155, Governor DAO. Configuração em tempo real, deploy no Remix IDE.
- **Smart Account** (`/web3/identity`) — Demonstração de ERC-4337 Account Abstraction. Login social via Privy/Dynamic, tesouraria Safe (Gnosis) multi-sig.
- **L2 Networks** (`/web3/networks`) — Comparativo Base vs Polygon vs Optimism vs Arbitrum. Gas <$0.01, guia de escolha por caso de uso.

## Arquitetura

```
artifacts/api-server/     # Express 5 API (porta 8080, path /api)
  src/routes/
    agents.ts             # GET /agents, GET /agents/:id — 3 A2G agents com system prompts
    conversations.ts      # CRUD de conversas
    openai-chat.ts        # POST /openai/conversations/:id/messages (SSE streaming)
    stats.ts              # GET /stats/overview

artifacts/forge3/         # React + Vite (porta 21699, path /)
  src/pages/
    home.tsx              # Command Center — lista agentes e stats
    agent-detail.tsx      # Detalhe do agente + conversas recentes
    chat-interface.tsx    # Chat com SSE streaming
    conversations.tsx     # Histórico de todas as conversas
    web3-hub.tsx          # The Forge — hub da camada Web3
    contract-forge.tsx    # Gerador OpenZeppelin — Solidity em tempo real
    smart-account.tsx     # ERC-4337 Smart Account identity
    networks.tsx          # Comparativo L2 networks

lib/
  db/                     # Drizzle ORM — tabelas: conversations, messages
  api-spec/               # OpenAPI YAML + Orval codegen config
  api-client-react/       # Hooks React gerados pelo Orval
  api-zod/                # Schemas Zod gerados pelo Orval
  integrations-openai-ai-server/  # Cliente OpenAI server-side
  integrations-openai-ai-react/   # Hooks React para voice/audio
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Env Vars

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — secret for sessions
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL (auto-set)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy key (auto-set)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
