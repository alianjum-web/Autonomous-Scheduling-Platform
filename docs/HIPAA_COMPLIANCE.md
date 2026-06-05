# Section 5.3 — Pre-Launch HIPAA Compliance Checklist

| | |
|---|---|
| **Version** | 1.0 — Production Ready |
| **Classification** | CONFIDENTIAL |
| **Review Cycle** | Quarterly |
| **Generated** | June 05, 2026 |
| **Compliance** | HIPAA · GDPR |

---

## Checklist

Complete every item **before processing real patient data** in production. Record completion date and owner in your compliance tracker.

| # | Control | Verification | Owner | Status |
|---|---|---|---|---|
| 1 | **Business Associate Agreement (BAA)** | Execute BAA with Supabase, OpenAI, Vercel, Railway, and Sentry. Store signed copies in compliance vault. | Compliance PM | ☐ |
| 2 | **Data Encryption at Rest** | Confirm Supabase project uses AES-256 (default). Confirm Upstash Redis uses `rediss://` TLS endpoints. | DevOps | ☐ |
| 3 | **Data Encryption in Transit** | TLS 1.3 on all provider connections. HSTS on Next.js ([`vercel.json`](../frontend/vercel.json)) and FastAPI ([`main.py`](../backend/app/main.py)). | DevOps | ☐ |
| 4 | **Access Controls** | Enforce MFA on Supabase, Vercel, Railway, GitHub, and Sentry. Map `clinic_role` JWT claims to least-privilege RLS policies. | Security | ☐ |
| 5 | **Audit Logging** | Run [`scripts/compliance/verify-audit-triggers.sql`](../scripts/compliance/verify-audit-triggers.sql) — triggers on `patient_sessions` and `appointments` must exist; `audit_logs` must be append-only. | Backend Lead | ☐ |
| 6 | **PHI in Logs** | Run [`scripts/compliance/scan-logs-for-phi.sh`](../scripts/compliance/scan-logs-for-phi.sh) against deployed logs — **must return 0 matches**. CI runs codebase scan on every PR. | Security | ☐ |
| 7 | **OpenAI Data Processing** | Enable **Zero Data Retention** in OpenAI org settings + BAA. API calls use `store=False` via [`openai_client.py`](../backend/app/adapters/openai_client.py). | Backend Lead | ☐ |
| 8 | **Breach Notification Plan** | Document and distribute [`BREACH_NOTIFICATION.md`](./BREACH_NOTIFICATION.md) — 60-day HIPAA notification procedure. | Compliance PM | ☐ |
| 9 | **Workforce Training** | All staff complete HIPAA awareness training before system access. Record training dates. | HR / Compliance | ☐ |
| 10 | **Vulnerability Scan** | Run [`scripts/compliance/run-zap-baseline.sh`](../scripts/compliance/run-zap-baseline.sh) against staging/production API. Remediate critical/high findings. | Security | ☐ |
| 11 | **Penetration Test** | Third-party pen test on FastAPI service and Supabase RLS policies. Remediation plan for findings. | Security | ☐ |
| 12 | **Disaster Recovery** | Test Supabase point-in-time recovery (PITR) — target RTO **< 1 hour**. Document restore runbook below. | DevOps | ☐ |

---

## Verification Commands

### PHI log scan (deployed environments)

```bash
# Railway
railway logs --service fastapi-triage > /tmp/api.log
./scripts/compliance/scan-logs-for-phi.sh /tmp/api.log

# Must exit 0 with "PASS: No PHI patterns found"
```

### Audit trigger verification (Supabase SQL editor)

```bash
# Paste and run scripts/compliance/verify-audit-triggers.sql
```

### Codebase PHI logging scan (CI + local)

```bash
./scripts/compliance/scan-codebase-for-phi-logging.sh
```

### OpenAI Zero Data Retention

1. OpenAI Dashboard → Settings → **Data controls** → enable Zero Data Retention
2. Confirm BAA is active for your organization
3. Verify `OPENAI_ZERO_DATA_RETENTION=true` in Railway env (default)

---

## Disaster Recovery Runbook

| Step | Action | Target |
|---|---|---|
| 1 | Identify incident scope (data loss, region outage) | T+0 min |
| 2 | Pause new patient intake (feature flag or maintenance page) | T+15 min |
| 3 | Open Supabase Dashboard → Database → Backups → **Restore to point in time** | T+30 min |
| 4 | Re-run migrations if restoring to fresh project | T+45 min |
| 5 | Verify RLS policies, audit triggers, and Realtime publications | T+60 min |
| 6 | Smoke test `/health`, triage session, booking flow | T+75 min |
| 7 | Document incident in compliance log | T+24 hr |

**RTO target:** < 1 hour to restored read/write  
**RPO target:** Supabase PITR granularity (typically minutes on Pro plan)

---

## Provider BAA Contacts

| Provider | BAA Path | Notes |
|---|---|---|
| Supabase | Dashboard → Settings → Legal | HIPAA add-on on Team/Enterprise |
| OpenAI | [OpenAI Enterprise / API BAA](https://openai.com/enterprise-privacy) | Required for ZDR |
| Vercel | Enterprise agreement | Contact sales for HIPAA BAA |
| Railway | Enterprise / custom agreement | Contact sales |
| Sentry | Business plan BAA | PHI scrubbing enabled in this codebase |

---

## Quarterly Review

Re-run this checklist every quarter. Update emergency keyword list (clinical review), rotate secrets, and re-scan production logs for PHI.

**Document prepared by:** Staff Technical Architect & HIPAA/GDPR Compliance PM
