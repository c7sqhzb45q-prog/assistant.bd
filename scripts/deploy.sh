#!/bin/bash

set -euo pipefail

echo "🚀 Deploying assistant.bd to production..."

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

run_ws_script_if_exists() {
  local workspace="$1"
  local script="$2"

  if npm run -w "$workspace" --silent | grep -qE "^  $script$"; then
    if [[ "$PKG_MANAGER" == "pnpm" ]]; then
      pnpm --filter="$workspace" run "$script"
    else
      npm run -w "$workspace" "$script"
    fi
  else
    echo "ℹ️  Skipping $workspace:$script (script not defined)"
  fi
}

rollback_k8s() {
  local namespace="${K8S_NAMESPACE:-assistant-bd}"
  echo "↩️  Rolling back Kubernetes workloads in namespace: $namespace"
  kubectl rollout undo deployment/api-gateway -n "$namespace" || true
  kubectl rollout undo deployment/workflow-engine -n "$namespace" || true
  kubectl rollout undo deployment/ai-orchestrator -n "$namespace" || true
  kubectl rollout undo deployment/web -n "$namespace" || true
}

trap 'echo "❌ Deployment failed"; rollback_k8s' ERR

echo "🔍 Running production quality gates..."
if [[ "$PKG_MANAGER" == "pnpm" ]]; then
  pnpm run lint
  pnpm run type-check
  pnpm run test
  pnpm run build
else
  npm run lint
  npm run type-check
  npm run test
  npm run build
fi

echo "🗄️ Running database migrations (before rollout)..."
run_ws_script_if_exists "@assistant.bd/api-gateway" "migrate"

echo "🐳 Building Docker images..."
compose -f docker-compose.prod.yml build

echo "📤 Pushing images to registry..."
compose -f docker-compose.prod.yml push

echo "🚢 Applying Kubernetes manifests..."
kubectl apply -f infra/kubernetes/

NAMESPACE="${K8S_NAMESPACE:-assistant-bd}"

echo "⏳ Waiting for deployments to become ready..."
kubectl rollout status deployment/api-gateway -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/workflow-engine -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/ai-orchestrator -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/web -n "$NAMESPACE" --timeout=180s

trap - ERR

echo "✅ Deployment complete"
echo "🌐 Application: ${PRODUCTION_URL:-https://app.assistant.bd}"
