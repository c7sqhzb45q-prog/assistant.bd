#!/bin/bash

# Production deployment script

set -euo pipefail

echo "🚀 Deploying assistant.bd to production..."

# Choose a package manager (prefer pnpm if it's already installed)
PKG_MANAGER="${PKG_MANAGER:-}"
if [[ -z "$PKG_MANAGER" ]]; then
  if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
  else
    PKG_MANAGER="npm"
  fi
fi

compose() {
  if command -v docker-compose &> /dev/null; then
    docker-compose "$@"
  else
    docker compose "$@"
  fi
}

# Build all services
echo "🔨 Building services..."
if [[ "$PKG_MANAGER" == "pnpm" ]]; then
  pnpm run build
else
  npm run build
fi

# Run migrations
echo "🗄️ Running database migrations..."
if [[ "$PKG_MANAGER" == "pnpm" ]]; then
  pnpm --filter=@assistant.bd/api-gateway run migrate
else
  npm run -w @assistant.bd/api-gateway migrate
fi

# Deploy with Docker
echo "🐳 Building Docker images..."
compose -f docker-compose.prod.yml build

echo "📤 Pushing to registry..."
compose -f docker-compose.prod.yml push

echo "🚢 Deploying to Kubernetes..."
kubectl apply -f infra/kubernetes/

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application: https://app.assistant.bd"
