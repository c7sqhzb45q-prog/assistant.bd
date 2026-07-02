# 🗂️ assistant.bd Navigation Index

This index reflects the **actual current implementation state**.

---

## 1) Start here

1. [`README.md`](./README.md) — High-level status and active modules
2. [`SETUP_SUMMARY.md`](./SETUP_SUMMARY.md) — What is implemented now vs scaffolded
3. [`docs/QUICKSTART.md`](./docs/QUICKSTART.md) — Local run instructions

---

## 2) Active modules

### Apps
- [`apps/web`](./apps/web) — Active Next.js app

### Services
- [`services/api-gateway`](./services/api-gateway) — Active API gateway
- [`services/workflow-engine`](./services/workflow-engine) — Active workflow engine
- [`services/ai-orchestrator`](./services/ai-orchestrator) — Active orchestrator

### Packages
- [`packages/types`](./packages/types) — Active shared types
- [`packages/ai-core`](./packages/ai-core) — Active AI core package

---

## 3) Scaffolded / roadmap modules

These directories exist but are not fully implemented:

- Apps: `apps/admin`, `apps/builder`, `apps/inbox`, `apps/landing`, `apps/workflow-canvas`, `apps/todo-app`
- Services: `services/auth-service`, `services/crm-service`, `services/messaging-service`, `services/billing-service`, `services/analytics-service`, `services/event-bus`
- Packages: `packages/memory`, `packages/connectors`, `packages/queue`, `packages/logger`, `packages/utils`

Treat these as placeholders unless explicitly implemented.

---

## 4) Config and tooling

- [`package.json`](./package.json) — Workspace scripts + active CI scripts
- [`tsconfig.json`](./tsconfig.json) — Shared TypeScript base config for services/packages
- [`turbo.json`](./turbo.json) — Turborepo pipeline config
- [`docker-compose.yml`](./docker-compose.yml) — Local/dev stack
- [`docker-compose.prod.yml`](./docker-compose.prod.yml) — Production-oriented compose template
- [`.env.example`](./.env.example) — Local env template
- [`.env.production.example`](./.env.production.example) — Production env template (no defaults)

---

## 5) Practical commands

```bash
# Install
npm ci

# Run active development workflows
npm run dev

# Active CI-equivalent checks
npm run lint:active
npm run type-check:active
npm run test:active
npm run build:active
```

---

## 6) Related docs

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/AGENTS.md`](./docs/AGENTS.md)
- [`docs/QUICKSTART.md`](./docs/QUICKSTART.md)
