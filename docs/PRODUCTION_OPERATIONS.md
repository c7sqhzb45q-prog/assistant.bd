# Production Operations Guide

## Environment split

- Development runtime: `/home/runner/work/assistant.bd/assistant.bd/docker-compose.yml`
- Production runtime: `/home/runner/work/assistant.bd/assistant.bd/docker-compose.prod.yml`
- Kubernetes manifests: `/home/runner/work/assistant.bd/assistant.bd/infra/kubernetes`
- Terraform runtime secret and namespace bootstrap: `/home/runner/work/assistant.bd/assistant.bd/infra/terraform`

## Promotion flow (staging -> production)

1. Merge to `main` with green CI (`lint`, `type-check`, `test`, `build`, security gates).
2. Deploy to staging namespace first using the same manifests/images.
3. Run smoke checks:
   - `/health` and `/health/ready` for API gateway.
   - `/health` and `/ready` for worker services.
4. Run migration in staging and verify no backward incompatibility.
5. Promote the same image tags to production.

## Migration and deployment ordering guarantees

Deployment order is enforced by `/home/runner/work/assistant.bd/assistant.bd/scripts/deploy.sh`:

1. quality gates (`lint`, `type-check`, `test`, `build`)
2. database migration (if `migrate` script exists)
3. image build/push
4. Kubernetes apply
5. rollout health verification

## Rollback

If rollout fails, deployment script triggers automatic rollback for:
- `api-gateway`
- `workflow-engine`
- `ai-orchestrator`
- `web`

Manual rollback:

```bash
kubectl rollout undo deployment/api-gateway -n assistant-bd
kubectl rollout undo deployment/workflow-engine -n assistant-bd
kubectl rollout undo deployment/ai-orchestrator -n assistant-bd
kubectl rollout undo deployment/web -n assistant-bd
```

## Backup and restore

### PostgreSQL backup

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

### PostgreSQL restore

```bash
psql "$DATABASE_URL" < backup.sql
```

### Redis snapshot

Use persistent volume snapshots from your platform and verify restore in staging before production use.

## Incident response

1. Declare severity and assign incident commander.
2. Capture impact scope (API, workflow execution, orchestration, web).
3. Check alerts from `/home/runner/work/assistant.bd/assistant.bd/infra/monitoring/alerts.yml`.
4. Restore service via rollback if release-related.
5. Post-incident: root cause, mitigation, follow-up issue.
