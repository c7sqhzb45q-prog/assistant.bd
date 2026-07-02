# ✅ assistant.bd Setup Summary (Current State)

This document records what is currently usable in-repo without external accounts, and what remains scaffolded.

---

## Implemented now (inside this repository)

### Active app
- `apps/web` — Next.js MVP shell with status-oriented home page and billing test UI.

### Active services
- `services/api-gateway` — NestJS service with health/docs and billing-related API routes.
- `services/workflow-engine` — Workflow execution service with health/metrics endpoints.
- `services/ai-orchestrator` — Orchestrator service baseline.

### Active shared packages
- `packages/types`
- `packages/ai-core`

---

## Scaffolded / roadmap modules

The following are not fully implemented and should not be treated as production-ready:

- Apps: `admin`, `builder`, `inbox`, `landing`, `workflow-canvas`, `todo-app`
- Services: `auth-service`, `crm-service`, `messaging-service`, `billing-service`, `analytics-service`, `event-bus`
- Packages: `memory`, `connectors`, `queue`, `logger`, `utils`
- Agents and workflow template directories under `agents/` and `workflows/` are mostly scaffold-level.

---

## Local setup (active modules)

```bash
npm ci
npm run dev
```

### Active verification commands

```bash
npm run lint:active
npm run type-check:active
npm run test:active
npm run build:active
```

### Local endpoints

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/health`
- API docs: `http://localhost:3001/docs`

---

## Environment and safety notes

- `.env.example` is a broad template and includes variables for roadmap integrations.
- `docker-compose.yml` is for local/dev only.
- `.env.production.example` intentionally has blank required values.
- Do not deploy placeholder secrets/keys to any shared or production environment.

Web billing page compatibility:
- Preferred: `NEXT_PUBLIC_API_BASE_URL`
- Also supported: `NEXT_PUBLIC_API_URL`

---

## What remains out of scope for repo-only work

These require external accounts/credentials/infrastructure and are not completed by code changes alone:

- Live billing/payment provider setup
- Messaging provider setup
- Hosted production infrastructure and domain/TLS
- Compliance/legal/operational readiness
