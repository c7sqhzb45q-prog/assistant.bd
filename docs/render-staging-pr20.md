# Render Staging Deployment — PR #20

This guide explains how to deploy the four services introduced in PR #20 to a
temporary Render staging environment for end-to-end validation before merging
to `main`.

## Services

| Service name | Purpose |
|---|---|
| `assistant-bd-web-pr20` | Next.js demo UI + `/demo` page |
| `assistant-bd-api-pr20` | API Gateway (`/workflows/execute`, `/workflows/history`, `/docs`) |
| `assistant-bd-workflow-engine-pr20` | Workflow engine (`/execute`, `/history`) |
| `assistant-bd-ai-orchestrator-pr20` | AI Orchestrator (`/orchestrate`) |

## How to deploy the Blueprint on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign
   in.
2. Click **New → Blueprint** and connect this repository
   (`c7sqhzb45q-prog/assistant.bd`).
3. Select the **PR #20 head branch** (not `main`) so that the new workflow
   endpoints are included.
4. Render will read `render.yaml` from the repository root and create all four
   services automatically.
5. After the initial deploy, fill in the secret env vars listed below for each
   service.

## Env vars that must be filled manually

The following variables are marked `sync: false` in `render.yaml` and must be
set by hand in the Render dashboard after the blueprint is applied.

### `assistant-bd-ai-orchestrator-pr20`

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (`sk-…`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `OLLAMA_BASE_URL` | *(optional)* Base URL of a local Ollama instance |
| `OLLAMA_MODEL` | *(optional)* Ollama model name; required when `OLLAMA_BASE_URL` is set |

### `assistant-bd-workflow-engine-pr20`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |

### `assistant-bd-api-pr20`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `REFRESH_TOKEN_SECRET` | Secret for signing JWT refresh tokens |
| `FIRECRAWL_API_KEY` | *(optional)* Firecrawl API key for `POST /tools/firecrawl/scrape` |
| `STRIPE_SECRET_KEY` | *(optional)* Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | *(optional)* Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | *(optional)* Stripe Price ID for the Starter plan |
| `STRIPE_PRICE_PRO` | *(optional)* Stripe Price ID for the Pro plan |
| `STRIPE_PRICE_BUSINESS` | *(optional)* Stripe Price ID for the Business plan |

## Inter-service wiring

The `render.yaml` pre-fills the following URLs using Render's predictable
default domain pattern (`<service-name>.onrender.com`):

- **web** → `NEXT_PUBLIC_API_BASE_URL=https://assistant-bd-api-pr20.onrender.com`
- **api** → `WORKFLOW_ENGINE_URL=https://assistant-bd-workflow-engine-pr20.onrender.com`
- **api** → `ORCHESTRATOR_URL=https://assistant-bd-ai-orchestrator-pr20.onrender.com`
- **workflow-engine** → `ORCHESTRATOR_URL=https://assistant-bd-ai-orchestrator-pr20.onrender.com`

No manual changes are needed for these unless you rename a service.

## Testing the staging environment

Once all services are healthy, run the following smoke tests in order.

### 1. Swagger docs

```
GET https://assistant-bd-api-pr20.onrender.com/docs
```

Expect: Swagger UI loads and lists the `workflows` endpoints.

### 2. Health checks

```
GET https://assistant-bd-api-pr20.onrender.com/health
GET https://assistant-bd-workflow-engine-pr20.onrender.com/health
GET https://assistant-bd-ai-orchestrator-pr20.onrender.com/health
```

Expect: `{"status":"ok"}` from each service.

### 3. Workflow execute (end-to-end)

```
POST https://assistant-bd-api-pr20.onrender.com/workflows/execute
Content-Type: application/json

{
  "workflowId": "wf-smoke-test",
  "trigger": { "type": "manual" },
  "steps": [
    {
      "id": "step-1",
      "type": "run_agent",
      "config": { "agentId": "support", "input": "hello" }
    }
  ]
}
```

Expect: a JSON response containing an `executionId` and `status`.

### 4. Workflow history

```
GET https://assistant-bd-api-pr20.onrender.com/workflows/history
```

Expect: a JSON array that includes the execution from step 3.

### 5. Demo page

Open `https://assistant-bd-web-pr20.onrender.com/demo` in a browser.

- Set the API base URL to `https://assistant-bd-api-pr20.onrender.com`.
- Trigger a workflow via the UI form.
- Verify that a result appears without console errors.

## After validation

1. Mark PR #20 as **Ready for review** on GitHub.
2. Complete code review and address any feedback.
3. Merge PR #20 into `main`.
4. Update or create production Render services from `main` and attach the
   `api.assistant.bd` custom domain to the API Gateway service.
5. **Tear down the staging services** — once PR #20 is merged and promoted to
   production, delete the four `-pr20` services from the Render dashboard to
   avoid unnecessary charges:
   - `assistant-bd-web-pr20`
   - `assistant-bd-api-pr20`
   - `assistant-bd-workflow-engine-pr20`
   - `assistant-bd-ai-orchestrator-pr20`

   If you want to keep a staging slot permanently, rename the services (remove
   the `-pr20` suffix) and point them at the `main` branch instead of
   deleting them.
