# 🧠 assistant.bd — Best Practices Guide

Welcome to the assistant.bd wiki! This guide documents development standards, architecture patterns, and operational best practices for our AI Operating System.

## 📋 Quick Navigation

- **[Getting Started](#getting-started)** — New contributor setup
- **[Development Standards](#development-standards)** — Code quality & style
- **[Architecture Patterns](#architecture-patterns)** — Service design & communication
- **[API Design](#api-design)** — Endpoint standards & versioning
- **[Workflow Automation](#workflow-automation)** — Building & deploying workflows
- **[Testing Strategy](#testing-strategy)** — Unit, integration & E2E tests
- **[Deployment Guide](#deployment-guide)** — Production deployment checklist
- **[Troubleshooting](#troubleshooting)** — Common issues & solutions
- **[Resources](#resources)** — Documentation & external links

---

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/c7sqhzb45q-prog/assistant.bd.git
cd assistant.bd
npm install
```

### 2. Environment Setup

Copy environment templates:

```bash
cp .env.example .env.local
cp .env.production.example .env.production
```

Edit `.env.local` with your local credentials (PostgreSQL, Redis, OpenAI API key, etc.)

### 3. Start Development

```bash
npm run dev
```

This starts all active services in development mode:
- Web dashboard: `http://localhost:3000`
- API Gateway: `http://localhost:3001` (Swagger UI at `/docs`)
- Workflow Engine health: `http://localhost:3002/health`
- AI Orchestrator health: `http://localhost:3003/health`

### 4. Verify Setup

```bash
npm run lint:active
npm run type-check:active
npm run test:active
```

---

## Development Standards

### Code Quality

**ESLint & Prettier (mandatory)**

Run before committing:

```bash
npm run lint:active        # Check linting
npm run format             # Auto-fix formatting
npm run type-check:active  # TypeScript validation
```

All active services are configured with ESLint + Prettier. Enable auto-format on save in your IDE.

### Commit Messages

Follow **Conventional Commits**:

```
feat: add WhatsApp message batching
fix: resolve AI orchestrator routing bug
docs: update deployment guide
refactor: extract message validation logic
test: add workflow engine trigger tests
```

**Bad:**
```
updated stuff
wip
bug fix
```

### Branch Naming

```
feature/whatsapp-media-support
bugfix/routing-deadlock
docs/api-reference
refactor/service-abstraction
```

### Code Review Checklist

Before requesting review:
- [ ] Code passes linting & type-checking
- [ ] All tests pass (including new tests for features)
- [ ] No console.logs in production code
- [ ] ENV variables documented in `.env.example`
- [ ] Commit messages follow Conventional Commits
- [ ] Changes related to an issue include `Fixes #123` or similar

---

## Architecture Patterns

### Service Communication

**Message Flow:**

```
User (WhatsApp/Email/API)
    ↓
Messaging Service (normalize input)
    ↓
Event Bus (Redis/NATS publish)
    ↓
Workflow Engine (trigger evaluation)
    ↓
AI Orchestrator (agent routing)
    ↓
Agent Service (response generation)
    ↓
CRM Memory (persistence)
    ↓
Action Executor (send reply/email/etc)
```

### Inter-Service Communication

1. **Async (preferred):** Redis pub/sub for non-blocking, decoupled services
2. **Sync (when needed):** HTTP REST with timeout protection
3. **Direct DB:** Only for read-only queries within a service boundary

**Never:**
- Use database polling for events
- Make synchronous calls without timeouts
- Share database tables across services (except shared `users`, `teams` tables)

### Database Schema Isolation

Each service owns its tables:

```sql
-- Messaging Service
CREATE TABLE message_events (...)
CREATE TABLE message_attachments (...)

-- Workflow Engine
CREATE TABLE workflows (...)
CREATE TABLE workflow_executions (...)

-- Shared (central DB)
CREATE TABLE users (...)
CREATE TABLE teams (...)
CREATE TABLE integrations (...)
```

### Error Handling

**Standard response format:**

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;      // "INVALID_INPUT" | "NOT_FOUND" | "SERVICE_ERROR"
    message: string;
    details?: Record<string, any>;
  };
}
```

**Always log errors with context:**

```typescript
logger.error("Workflow execution failed", {
  workflowId,
  executionId,
  step,
  error: err.message,
  stack: err.stack,
});
```

---

## API Design

### REST Endpoints

```
POST   /api/v1/workflows                    # Create workflow
GET    /api/v1/workflows/:id                # Get workflow
PATCH  /api/v1/workflows/:id                # Update workflow
DELETE /api/v1/workflows/:id                # Delete workflow
POST   /api/v1/workflows/:id/execute        # Execute workflow
GET    /api/v1/workflows/:id/executions     # List executions
```

### Versioning

- **API versioning via path:** `/api/v1/`, `/api/v2/` (not headers)
- **Breaking changes require new version**
- **Maintain backward compatibility for 2 releases minimum**

### Request/Response Standards

**Always include:**
- Request ID (UUID) for tracing
- Timestamp of response
- Pagination info (limit, offset, total) for list endpoints

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-06-27T12:00:00Z",
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

### Rate Limiting

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## Workflow Automation

### Building a Workflow

1. **Define Trigger:** Event source (WhatsApp message, webhook, schedule)
2. **Set Conditions:** Logical filters (message contains keyword, user segment, etc.)
3. **Select Actions:** Agent routing, API calls, notifications, data updates
4. **Test:** Run on sample data before publishing
5. **Monitor:** Track execution metrics & error rates

### Example Workflow (Lead Qualification)

```
TRIGGER: New message from WhatsApp
  ↓
CONDITION: Message from unknown contact
  ↓
ACTION: Route to Sales Agent
  ↓
ACTION: Store conversation in CRM
  ↓
ACTION: Notify sales team if high-intent
```

### Workflow Templates

Use provided templates in `workflows/templates/`:
- `lead-generation.json` — Capture & qualify leads
- `support-escalation.json` — Route support issues
- `booking.json` — Schedule appointments
- `ecommerce.json` — Order notifications & follow-ups

### Performance Tuning

- **Batch similar messages** → Reduce orchestrator load
- **Cache agent responses** → Reuse for similar inputs
- **Use workflow conditions** → Filter before AI orchestration (cheaper)
- **Set execution timeouts** → Prevent hanging workflows

---

## Testing Strategy

### Unit Tests (Services)

```bash
npm run test:active
```

Each service should have 80%+ coverage:

```typescript
// services/api-gateway/src/workflows.test.ts
describe("WorkflowService", () => {
  it("should create workflow with valid input", async () => {
    const result = await service.createWorkflow({
      name: "Lead Gen",
      trigger: "webhook",
    });
    expect(result).toHaveProperty("id");
  });

  it("should throw on invalid trigger type", async () => {
    expect(() =>
      service.createWorkflow({ name: "Test", trigger: "invalid" })
    ).toThrow("INVALID_TRIGGER");
  });
});
```

### Integration Tests (Services + DB)

```bash
npm run test:active -- --testPathPattern=integration
```

Test service-to-service communication:

```typescript
// Test workflow engine → AI orchestrator
it("should route to correct agent", async () => {
  const result = await workflowEngine.executeWorkflow(
    { trigger: "support_request" },
    orchestratorClient
  );
  expect(orchestratorClient.route).toHaveBeenCalledWith("support-agent");
});
```

### E2E Tests (Full Stack)

```bash
npm run test:e2e
```

Use Docker Compose for isolated test environment:

```yaml
# docker-compose.test.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: test_db
```

---

## Deployment Guide

### Pre-Deployment Checklist

```bash
# 1. Run all quality gates
npm run lint:active
npm run type-check:active
npm run test:active
npm run build:active

# 2. Build Docker images
docker build -f docker/Dockerfile.api-gateway -t assistant.bd/api-gateway:latest .
docker build -f docker/Dockerfile.workflow-engine -t assistant.bd/workflow-engine:latest .
docker build -f docker/Dockerfile.ai-orchestrator -t assistant.bd/ai-orchestrator:latest .

# 3. Test locally
docker-compose -f docker-compose.prod.yml up -d

# 4. Run health checks
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### Production Deployment

**Via Kubernetes:**

```bash
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmaps/
kubectl apply -f infra/kubernetes/secrets/
kubectl apply -f infra/kubernetes/deployments/
kubectl apply -f infra/kubernetes/services/
```

**Via Terraform (AWS/DigitalOcean):**

```bash
terraform init
terraform plan
terraform apply
```

**Monitoring:**

```bash
# Port-forward Prometheus
kubectl port-forward svc/prometheus 9090:9090

# View Grafana dashboards
# http://localhost:3000 (if exposed)
```

### Rollback Procedure

```bash
# Kubernetes rollout
kubectl rollout history deployment/api-gateway
kubectl rollout undo deployment/api-gateway --to-revision=2

# Docker Compose
docker-compose down
docker pull assistant.bd/api-gateway:previous-tag
docker-compose up -d
```

---

## Troubleshooting

### Service Health Checks

```bash
# Check all services
curl http://localhost:3001/health          # API Gateway
curl http://localhost:3002/health          # Workflow Engine
curl http://localhost:3003/health          # AI Orchestrator

# Expected response:
# {"status": "ok", "timestamp": "2026-06-27T12:00:00Z", "uptime": 3600}
```

### Common Issues

#### 1. Database Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify connection string
echo $DATABASE_URL

# Restart PostgreSQL
docker-compose restart postgres
```

#### 2. Redis Connection Errors

```
Error: Error: getaddrinfo ENOTFOUND redis
```

**Solution:**
```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli ping

# Restart Redis
docker-compose restart redis
```

#### 3. AI Orchestrator Not Routing Correctly

**Debug:**
```bash
# Check orchestrator logs
docker logs assistant-bd-ai-orchestrator

# Verify agent availability
curl http://localhost:3003/agents

# Test routing
curl -X POST http://localhost:3003/route \
  -H "Content-Type: application/json" \
  -d '{"intent": "support", "context": "customer_issue"}'
```

#### 4. Workflow Stuck in Pending State

**Solution:**
```bash
# Check workflow engine status
curl http://localhost:3002/executions/EXECUTION_ID

# Manually trigger retry
curl -X POST http://localhost:3002/executions/EXECUTION_ID/retry

# Check event bus (Redis)
redis-cli MONITOR | grep workflow
```

---

## Resources

### Documentation

- [README.md](../README.md) — Project overview & setup
- [SETUP_SUMMARY.md](../SETUP_SUMMARY.md) — Detailed environment setup
- [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) — Database schema & migrations

### External Links

- **OpenAI API:** https://platform.openai.com/docs
- **Anthropic Claude:** https://docs.anthropic.com
- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **Kubernetes:** https://kubernetes.io/docs
- **Terraform:** https://registry.terraform.io/

### Support

- **Maintainer:** Sojib Ahmmed (mail@sojibahmmed.com)
- **Issues:** https://github.com/c7sqhzb45q-prog/assistant.bd/issues
- **Discussions:** https://github.com/c7sqhzb45q-prog/assistant.bd/discussions

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for pull request guidelines and code review process.

**Happy coding! 🚀**
