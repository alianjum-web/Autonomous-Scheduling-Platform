# HIPAA Breach Notification Procedure

**Classification:** CONFIDENTIAL  
**Effective:** June 05, 2026  
**Review:** Quarterly

---

## 1. Purpose

This procedure defines how the organization responds to a breach of unsecured Protected Health Information (PHI) in compliance with **45 CFR §§ 164.400–414** (60-day notification requirement).

---

## 2. Definitions

- **Breach:** Impermissible use or disclosure of PHI that compromises security or privacy (presumed unless demonstrated otherwise per §164.402).
- **Unsecured PHI:** PHI not rendered unusable/unreadable via encryption or destruction per HHS guidance.
- **Covered Entity / Business Associate:** This platform operates as a BA to clinic covered entities; clinics remain responsible for patient notification unless delegated by contract.

---

## 3. Incident Response Timeline

| Phase | Deadline | Actions |
|---|---|---|
| **Detection & Containment** | 0–24 hours | Isolate affected systems, revoke compromised credentials, preserve logs (PHI-redacted exports only) |
| **Risk Assessment** | 1–10 days | Determine if breach occurred; assess probability PHI was compromised; document factors per §164.402(2) |
| **Internal Notification** | 1–5 days | Notify Compliance PM, Privacy Officer, Legal, and Technical Architect |
| **Covered Entity Notification** | **≤ 60 days** from discovery | Notify each affected covered entity (clinic) with required elements per §164.404(c) |
| **HHS Notification** | **≤ 60 days** | If ≥ 500 individuals in a state/jurisdiction: notify HHS concurrently. If < 500: annual log submission |
| **Individual Notification** | **≤ 60 days** | Covered entity notifies affected individuals (delegated per BAA) |
| **Media Notification** | **≤ 60 days** | If ≥ 500 residents of a state/jurisdiction affected |

---

## 4. Required Breach Notice Content

Each notification must include:

1. Brief description of what happened, including date of breach and discovery date
2. Types of unsecured PHI involved (e.g., names, phone numbers, appointment dates)
3. Steps individuals should take to protect themselves
4. Description of investigation and mitigation measures taken
5. Contact procedures for questions (toll-free number, email, website)

---

## 5. Technical Investigation Checklist

- [ ] Query `audit_logs` for unauthorized mutations during incident window
- [ ] Review Supabase auth logs and failed JWT validations
- [ ] Run `scripts/compliance/scan-logs-for-phi.sh` on exported logs — document any PHI exposure
- [ ] Check Sentry events (PHI-scrubbed) for anomalous error spikes
- [ ] Verify RLS policies were active on affected tables
- [ ] Rotate all service-role keys, JWT secrets, and API keys if compromise suspected

---

## 6. Documentation & Retention

Maintain a **Breach Log** (append-only) with:

| Field | Description |
|---|---|
| Incident ID | UUID |
| Discovery date | Date breach was discovered |
| Notification dates | CE, HHS, individual (as applicable) |
| Individuals affected | Count and jurisdiction |
| PHI types | Categories involved |
| Root cause | Technical and procedural |
| Remediation | Actions taken |

Retain breach documentation **≥ 6 years** per HIPAA.

---

## 7. Contacts

| Role | Responsibility |
|---|---|
| Compliance PM | Owns notification timeline and regulatory filings |
| Privacy Officer | Risk assessment and notice content review |
| Technical Architect | Containment, forensics, and remediation |
| Legal Counsel | BAA obligations and media/HHS filings |

---

## 8. Training

All workforce members with system access must acknowledge this procedure during HIPAA onboarding and annual refresher training.
