# ZENTR3 — Agentic Operating System for Web3 Founders

> **Solana Frontier Hackathon 2026**
> © 2026 Tiago Ferreira Cavazin. All rights reserved.

---

## 🧠 What is ZENTR3?

ZENTR3 is an **Agentic Operating System** designed for non-technical Web3 founders. It leverages a multi-agent orchestration layer to translate business intent into secure, audited, and deployed protocols in under 48 hours.

> **Core Philosophy:** We bridge the "execution gap" by providing a co-founder narrative that handles code generation (Forge3), infrastructure (Stack3), and security audits automatically.

---

## 🚀 Live Demo

| Resource | URL |
|---|---|
| Platform | [https://app.zentr3.app](https://agent-stack-three--consultorcavazi.replit.app) |
| Authentication | Social Login (Google or Email) |
| Networks | Base Sepolia + Solana Testnet |
| Support | (https://www.linkedin.com/in/tiagoferreiracavazin/) |

> No external wallet (MetaMask/Phantom) required. The system auto-generates a **Smart Account (ERC-4337)** for each user.

---

## 🤖 The Agent Swarm - FUTURE ROADMAP 

ZENTR3 runs **25 specialized AI agents** powered by Google Gemini 2.5 Flash, each with a distinct role in the startup-building pipeline:

| Agent | Role | Capability |
|---|---|---|
| **BR1DG3** | The Initiator | Translates business ideas into structured protocols |
| **FORGE3** | Protocol Engineer | Generates Solidity (EVM) & Rust/Anchor (Solana) contracts |
| **STACK3** | Infra & Security Guard | Manages deployment pipeline + Slither/Aderyn audits |
| **RESEARCHER** | Market Research | Trends, competitors, ecosystem health |
| **TOKENOMICS** | Token Architect | Economic models, vesting, supply/demand |
| **COMPLIANCE** | Legal & Compliance | Regulatory frameworks, RWA, ERC-8004 |
| **ARCHITECT** | Technical Architect | Microservice architecture + Mermaid diagrams |
| **GTM** | Go-to-Market | 4Ps, AARRR, Flywheel, Viral Loops |
| **SOLANA_FORGE** | Solana Engineer | Anchor v0.30+, PDA, CPI, SPL-Token |
| **SOLANA_AUDITOR** | Solana Auditor | Neodyme/OtterSec audit frameworks |
| **BLUEPRINT** | Strategy Architect | PRDs, Business Plans, UML/BPM diagrams |
| **ERP** | ERP Agent | Executive/Tactical/Operational management |
| **CRM** | CRM Specialist | Funnels, campaigns, brand identity |
| **PM** | Product Manager | Roadmaps, User Stories, dApp prioritization |
| **SCRUM** | Scrum Master | Sprint planning, Agile velocity |
| **PO** | Product Owner | Backlog grooming, stakeholder management |
| **PROJECT_AUDITOR** | Project Auditor | Technical, Economical, Legal, Strategic audit |
| **ANALYST** | Token Analyst | ROI/IRR/NPV, adoption projections |
| **RISK** | Risk Architect | ECDM, Lyapunov Operators, HEICTOR protocols |
| **POV** | Utility Validator | Proof of Value protocol design |
| **OVP** | Ontology Architect | Knowledge Graphs, OWL/DL, semantic value flows |
| **STRESS_TESTER** | Protocol Stress Tester | Attack simulations, resilience scoring |
| **META_ARCHITECT** | Meta-Protocol Architect | Cross-chain governance frameworks |
| **SOVEREIGN_AA** | Account Abstraction Engineer | ERC-4337 sovereign accounts, session keys |
| **GRAPH_RMVP** | Graph Protocol Architect | DAG-based state machines, composable primitives |
| **SOCIAL_MEDIA** | Social Media Strategist | Twitter/Discord growth, influencer frameworks |
| **INVESTOR_RELATIONS** | IR Specialist | Pitch decks, investor memos, due diligence |


---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    ZENTR3 Platform                       │
├──────────────────────┬──────────────────────────────────┤
│   Frontend (React)   │        API Server (Express 5)    │
│   Port: 25823        │        Port: 8080                │
│   /                  │        /api                      │
├──────────────────────┴──────────────────────────────────┤
│              pnpm Workspace Monorepo                     │
├──────────┬──────────┬──────────┬────────────────────────┤
│  lib/db  │ lib/api- │ lib/api- │ lib/integrations-      │
│ (Drizzle)│   spec   │   zod    │    gemini-ai           │
│ Postgres │ OpenAPI  │  Orval   │  Google Gemini 2.5     │
└──────────┴──────────┴──────────┴────────────────────────┘
```

### Monorepo Structure

```
Agent-Stack-Three/
├── artifacts/
│   ├── a2g-stack3/          # React frontend (Vite)
│   │   └── src/
│   │       ├── pages/       # Dashboard, AgentChat, BusinessPlan, TaskBoard...
│   │       ├── components/  # UI components (shadcn/ui + Radix)
│   │       ├── context/     # ProjectProvider
│   │       └── hooks/       # React Query hooks
│   ├── api-server/          # Express 5 API
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── agents/  # Agent chat, plan, tasks CRUD
│   │       │   └── gemini/  # Conversation management
│   │       └── lib/         # Logger (pino)
│   └── mockup-sandbox/      # Design mockup environment
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec (source of truth)
│   ├── api-zod/             # Zod schemas (Orval codegen)
│   ├── api-client-react/    # React Query hooks (Orval codegen)
│   ├── db/                  # Drizzle ORM + PostgreSQL schema
│   └── integrations-gemini-ai/ # Google Gemini AI client
├── package.json             # Workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## 🛠️ Tech Stack

### Language & Runtime
| Technology | Version |
|---|---|
| TypeScript | ~5.9.2 |
| Node.js | 24 |
| pnpm | latest |

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 19 (catalog) | UI framework |
| Vite | catalog | Build tool |
| Tailwind CSS | catalog | Styling |
| shadcn/ui + Radix UI | ^1.x | Component library |
| Wouter | ^3.3.5 | Client-side routing |
| TanStack React Query | catalog | Server state management |
| Framer Motion | catalog | Animations |
| Mermaid | ^11.14.0 | Architecture diagrams |
| React Markdown | ^10.1.0 | Markdown rendering |
| Recharts | ^2.15.2 | Data visualization |
| React Hook Form | ^7.55.0 | Form management |
| Zod | catalog | Schema validation |
| Lucide React | catalog | Icons |
| html2pdf.js | ^0.14.0 | PDF export |
| jsPDF | ^4.2.1 | PDF generation |

### Backend
| Library | Version | Purpose |
|---|---|---|
| Express | ^5 | API framework |
| Pino | ^9 | Structured logging |
| pino-http | ^10 | HTTP request logging |
| CORS | ^2 | Cross-origin resource sharing |
| Cookie Parser | ^1.4.7 | Cookie handling |
| esbuild | ^0.27.3 | ESM bundle build |

### Database & ORM
| Library | Version | Purpose |
|---|---|---|
| PostgreSQL | latest | Primary database |
| Drizzle ORM | catalog | Type-safe ORM |
| drizzle-zod | catalog | Schema → Zod bridge |

### AI & Integrations
| Library | Version | Purpose |
|---|---|---|
| @google/genai | bundled | Google Gemini 2.5 Flash |
| Gemini 2.5 Flash | — | LLM for all 25 agents |

### API & Codegen
| Tool | Purpose |
|---|---|
| OpenAPI 3.1 | API specification (source of truth) |
| Orval | Codegen: OpenAPI → React Query hooks + Zod schemas |

### Blockchain & Web3
| Standard | Purpose |
|---|---|
| ERC-4337 | Account Abstraction (Smart Accounts) |
| ERC-6551 | Token Bound Accounts |
| ERC-4626 | Yield Vaults |
| ERC-2981 | Royalties |
| ERC-8004 | RWA Verification |
| OpenZeppelin 5.x | Secure contract base |
| Anchor v0.30+ | Solana program framework |
| Slither | EVM static analysis |
| Aderyn | Rust/Solana static analysis |

---

## 📄 Key Pages

| Route | Page | Description |
|---|---|---|
| `/` | Command Center | 25-agent deployment grid with ONLINE/OFFLINE status |
| `/agent/:id` | Agent Chat | SSE streaming chat with each specialized agent |
| `/plan` | Business Plan | Multi-agent startup plan generator |
| `/tasks` | Task Board | Kanban-style agent task management |
| `/sprint` | Sprint Board | Agile sprint planning board |
| `/roadmap` | Roadmap | Project roadmap visualization |
| `/protocol` | Protocol Sim | Live token metrics + Mermaid architecture diagram |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/gemini/conversations` | List all conversations |
| `POST` | `/api/gemini/conversations` | Create a new conversation |
| `GET` | `/api/gemini/conversations/:id` | Get conversation with messages |
| `DELETE` | `/api/gemini/conversations/:id` | Delete a conversation |
| `GET` | `/api/gemini/conversations/:id/messages` | List messages |
| `POST` | `/api/gemini/conversations/:id/messages` | Send message (SSE stream) |
| `POST` | `/api/agents/chat` | Chat with a specific agent (SSE stream) |
| `POST` | `/api/agents/plan` | Generate multi-agent business plan |
| `GET` | `/api/agents/tasks` | List all agent tasks |
| `POST` | `/api/agents/tasks` | Create a new agent task |
| `PATCH` | `/api/agents/tasks/:id` | Update an agent task |
| `DELETE` | `/api/agents/tasks/:id` | Delete an agent task |

---

## 🗄️ Database Schema

### `conversations`
| Column | Type | Description |
|---|---|---|
| `id` | serial PK | Auto-increment ID |
| `title` | text | Conversation title |
| `created_at` | timestamp | Creation timestamp |

### `messages`
| Column | Type | Description |
|---|---|---|
| `id` | serial PK | Auto-increment ID |
| `conversation_id` | integer FK | References conversations |
| `role` | text | `user` or `assistant` |
| `content` | text | Message content |
| `created_at` | timestamp | Creation timestamp |

### `agent_tasks`
| Column | Type | Description |
|---|---|---|
| `id` | text PK | Auto-generated `task-{timestamp}-{random}` |
| `agent_id` | text | Agent identifier |
| `title` | text | Task title |
| `description` | text | Task description |
| `status` | text | `PENDING`, `IN_PROGRESS`, `DONE` |
| `priority` | text | `LOW`, `MEDIUM`, `HIGH` |
| `progress` | integer | 0–100 progress percentage |
| `assigned_to` | text | Assigned agent/user |
| `created_at` | timestamp | Creation timestamp |

---

## ⚙️ Environment Variables

```env
# Google Gemini AI Integration
AI_INTEGRATIONS_GEMINI_BASE_URL=<your-gemini-base-url>
AI_INTEGRATIONS_GEMINI_API_KEY=<your-gemini-api-key>

# Database
DATABASE_URL=<your-postgresql-connection-string>

# Auth (future use)
SESSION_SECRET=<your-session-secret>
```

---

## 🏃 Getting Started

### Prerequisites
- Node.js 24+
- pnpm
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/fcavazin89/hackaton-solana-frontier---ZENTR3-.git
cd hackaton-solana-frontier---ZENTR3-

# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Build all packages
pnpm run build
```

### Development

```bash
# Run frontend (port 25823)
pnpm --filter @workspace/a2g-stack3 run dev

# Run API server (port 8080)
pnpm --filter @workspace/api-server run dev
```

### Useful Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API hooks/Zod schemas from OpenAPI spec
cd lib/api-spec && pnpm exec orval --config ./orval.config.ts
# IMPORTANT: After codegen, revert lib/api-zod/src/index.ts to:
# export * from "./generated/api";

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push
```

---

## 🔒 Security Pipeline (3-Layer)

ZENTR3's strategic moat is its **3-Layer Security Pipeline**:

1. **Static Analysis** — Slither (EVM) + Aderyn (Solana) run automatically on every generated contract
2. **Formal Verification** — Symbolic execution and invariant checking
3. **Gas Report** — Optimization analysis before deployment

This ensures non-technical founders deploy code as secure as a manually audited protocol, at a fraction of the cost and time.

---

## 🗺️ Recommended Judging Path (Solana Frontier Hackathon 2026)

1. **The Initiation** — Prompt the BR1DG3 agent with a business idea (e.g., *"I want a community-owned vault with a 2% withdrawal fee"*)
2. **The Engineering** — Observe Forge3 drafting the architecture and contracts instantly
3. **The Security Gate** — Review the automated audit report and security narratives generated by Stack3
4. **The Execution** — Finalize the deployment to testnet and interact with the protocol via the auto-generated dashboard

---

## 📋 License & Intellectual Property

```
Copyright © 2026 Tiago Ferreira Cavazin
Date: May 11, 2026

All rights reserved. This project, including all source code, documentation,
architecture designs, agent prompts, and associated intellectual property,
is the exclusive property of Tiago Ferreira Cavazin.

Unauthorized reproduction, distribution, or use of any part of this project
without explicit written permission from the author is strictly prohibited.

Project: ZENTR3 — Agentic Operating System for Web3 Founders
Hackathon: Solana Frontier Hackathon 2026
Contact: founder@zentr3.app
```

Members: 

Valter Lobo: https://www.linkedin.com/in/valterlobo/ Co-Founder

Tiago F. Cavazin: https://www.linkedin.com/in/tiagoferreiracavazin/ Founder
---

*Built with ❤️ for the Solana Frontier Hackathon 2026 by Tiago Ferreira Cavazin*
