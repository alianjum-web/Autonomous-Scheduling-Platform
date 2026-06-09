/** HIPAA compliance API contracts (FastAPI /v1/compliance/*). */

export interface BAAStatusResponse {
  baa_signed: boolean;
  tenant_id: string;
}

export interface BAAAcknowledgeResponse extends BAAStatusResponse {
  signed_at?: string;
}
