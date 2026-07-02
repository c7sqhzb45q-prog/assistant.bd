# 🧠 assistant.bd

[![CI](https://github.com/c7sqhzb45q-prog/assistant.bd/actions/workflows/ci.yml/badge.svg)](https://github.com/c7sqhzb45q-prog/assistant.bd/actions/workflows/ci.yml)

Monorepo for an AI-enabled automation platform.

> Current state: **MVP baseline in progress**. This repository contains a working core plus multiple scaffolded roadmap modules.

---

## ✅ Implemented vs scaffolded

| Area | Module | Status | Notes |
|---|---|---|---|
| App | `apps/web` | ✅ Active | Next.js app with home + billing test UI |
| Service | `services/api-gateway` | ✅ Active | NestJS API with health/docs + billing endpoints |
| Service | `services/workflow-engine` | ✅ Active | Workflow execution core + health/metrics |
| Service | `services/ai-orchestrator` | ✅ Active | Basic orchestrator service |
| Package | `packages/types` | ✅ Active | Shared TypeScript types |
| Package | `packages/ai-core` | ✅ Active | Shared AI abstraction package |
| Apps/Services/Packages (others) | e.g. inbox, builder, auth, crm, messaging, analytics, memory, queue | 🧱 Scaffolded | Placeholder directories or minimal stubs only |

Scaffolded modules are **not production-ready** and should be treated as roadmap items.

---

## 🏗️ Repository structure

```text
apps/
  web/                active
  admin/ builder/ inbox/ landing/ workflow-canvas/ todo-app/   scaffolded
services/
  api-gateway/ workflow-engine/ ai-orchestrator/               active
  auth-service/ crm-service/ messaging-service/ billing-service/
  analytics-service/ event-bus/                                scaffolded
packages/
  types/ ai-core/                                              active
  memory/ connectors/ queue/ logger/ utils/                    scaffolded
```

---

## 🚀 Local development

### 1) Install

```bash
npm ci
```

### 2) Run active modules

```bash
npm run dev
```

### 3) Useful endpoints

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/health`
- API docs: `http://localhost:3001/docs`

---

## 🧪 Quality checks used by CI

```bash
npm run lint:active
npm run type-check:active
npm run test:active
npm run build:active
```

`test:active` currently uses `jest --passWithNoTests` in active services, so lack of test files does not fail CI.

---

## 🔐 Environment notes

- Use `.env.example` for local development values.
- `docker-compose.yml` is local/dev only.
- Use `.env.production.example` + `docker-compose.prod.yml` for production-style configuration.
- Do **not** use placeholder defaults/secrets outside local development.
- Optional self-hosted Ollama support is available in `services/ai-orchestrator` via `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.

The web billing page accepts either:
- `NEXT_PUBLIC_API_BASE_URL` (preferred)
- `NEXT_PUBLIC_API_URL` (compatibility)

### Optional: run Ollama locally for ai-orchestrator

```bash
ollama serve
ollama pull llama3.1:8b
```

Then set:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

Test inference (server-side endpoint):

```bash
curl -X POST http://localhost:3003/ollama/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Reply with: ok"}'
```

---

## 📚 Key docs

- Project navigation: [`INDEX.md`](./INDEX.md)
- Setup status summary: [`SETUP_SUMMARY.md`](./SETUP_SUMMARY.md)
- Quick start: [`docs/QUICKSTART.md`](./docs/QUICKSTART.md)
- Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Agents guide: [`docs/AGENTS.md`](./docs/AGENTS.md)

---

## ⚠️ Out of scope in this repo alone

Production integrations that still require external accounts/credentials include billing providers, messaging providers, hosted infrastructure, and operational/legal/compliance setup.

---

## ⚖️ License

MIT — see [`LICENSE`](./LICENSE).
