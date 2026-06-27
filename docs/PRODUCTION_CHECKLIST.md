# Production Readiness Checklist

- [ ] CI green on `lint:active`, `type-check:active`, `test:active`, `build:active`
- [ ] Secret scan passing
- [ ] Dependency audit check passing (critical vulnerabilities)
- [ ] Runtime required environment variables configured for production
- [ ] Database migration plan reviewed and tested in staging
- [ ] Health and readiness endpoints verified for all active services
- [ ] Observability configured (Prometheus scrape + alerts)
- [ ] Rollback commands validated in staging
- [ ] Backup and restore run validated
- [ ] Deployment executed with `/home/runner/work/assistant.bd/assistant.bd/scripts/deploy.sh`
