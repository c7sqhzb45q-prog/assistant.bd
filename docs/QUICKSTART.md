# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- npm (pnpm optional)

## Installation

### 1. Clone & Setup

```bash
cd assistant.bd
npm install
```

### 2. Environment Setup

```bash
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

This creates:

- `.env` file with all required variables
- Database initialization script
- Docker Compose configuration

### 3. Update Secrets

Edit `.env` with your actual API keys:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
FIRECRAWL_API_KEY=fc-...
WHATSAPP_ACCESS_TOKEN=...
STRIPE_SECRET_KEY=sk_...
```

### 4. Start Infrastructure

```bash
docker compose up -d   # or docker-compose up -d
```

Verifies:

- ✅ PostgreSQL running on :5432
- ✅ Redis running on :6379
- ✅ Database initialized

### 5. Run Services

```bash
# Terminal 1: API Gateway
npm run -w @assistant.bd/api-gateway dev

# Terminal 2: Workflow Engine
npm run -w @assistant.bd/workflow-engine dev

# Terminal 3: AI Orchestrator
npm run -w @assistant.bd/ai-orchestrator dev

# Terminal 4: Web Dashboard
npm run -w @assistant.bd/web dev
```

Or run all at once:

```bash
npm run dev
```

### 6. Access Applications

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Firecrawl Scrape**: `POST /tools/firecrawl/scrape` (requires `FIRECRAWL_API_KEY` on the API gateway)

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Build active production modules
npm run build:active

# Run tests for active production modules
npm run test:active

# Lint & format
npm run lint:active
npm run format
```

### Working with Specific Services

```bash
# Run specific service
npm run -w @assistant.bd/api-gateway dev

# Build specific service
npm run -w @assistant.bd/api-gateway build

# Test specific service
npm run -w @assistant.bd/api-gateway test
```

### Database

```bash
# Connect to PostgreSQL
psql postgresql://admin:secure_password@localhost:5432/assistant_bd

# View Redis
redis-cli -p 6379
```

### Docker

```bash
# View logs
docker compose logs -f

# Rebuild images
docker compose build --no-cache

# Stop all
docker compose down

# Remove everything (careful!)
docker compose down -v
```

## Project Structure

```
assistant.bd/
├── apps/              # User-facing applications
│   ├── web/          # Next.js dashboard
│   ├── inbox/        # Messaging UI
│   ├── builder/      # Agent builder
│   └── workflow-canvas/ # Workflow automation
├── services/          # Backend microservices
│   ├── api-gateway/  # Main API
│   ├── workflow-engine/ # Automation engine
│   ├── ai-orchestrator/ # AI routing
│   └── ...
├── packages/          # Shared libraries
│   ├── types/        # TypeScript types
│   ├── ai-core/      # LLM wrapper
│   └── ...
├── agents/            # AI agents
│   ├── support-agent/
│   ├── sales-agent/
│   └── ...
└── workflows/         # Automation templates
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker compose ps

# Check connection
psql postgresql://admin:secure_password@localhost:5432/assistant_bd

# View logs
docker compose logs postgres
```

### Redis Connection Error

```bash
# Test Redis connection
redis-cli -p 6379 ping

# View logs
docker compose logs redis
```

### Build Errors

```bash
# Clean everything
npm run clean

# Reinstall
npm install

# Rebuild
npm run build
```

## Next Steps

1. **Create First Workflow** → Go to http://localhost:3000/workflows
2. **Configure Integrations** → WhatsApp, Stripe, etc.
3. **Deploy AI Agent** → Create a support agent
4. **Test End-to-End** → Send a test message

## Need Help?

- **Docs**: See `/docs` folder
- **Issues**: Check GitHub issues
- **Community**: Discord server (link)

---

**Happy building! 🚀**
