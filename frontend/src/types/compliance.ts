/** HIPAA compliance API contracts (FastAPI /v1/compliance/*). */

export interface BAAStatusResponse {
  tenant_id: string;
  baa_signed: boolean;
  signed_at: string | null;
  /** When true, unsigned clinics cannot use AI triage or document embedding. */
  enforcement_enabled: boolean;
  environment: string;
  /** True when BAA is signed OR enforcement is off (e.g. local dev). */
  ai_features_available: boolean;
}

export interface BAAAcknowledgeResponse extends BAAStatusResponse {
  message?: string;
}

export interface ComplianceAuditEntry {
  id: string;
  action: string;
  actor_id: string | null;
  resource_type: string;
  resource_id: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface ComplianceReportResponse {
  baa: BAAStatusResponse;
  recent_audit: ComplianceAuditEntry[];
}
