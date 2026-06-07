import { LegalPage } from "@/components/common/layout/LegalPage";

export const metadata = { title: "HIPAA Notice" };

export default function HipaaNoticePage() {
  return (
    <LegalPage title="HIPAA & Security Notice" lastUpdated="June 5, 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">HIPAA-aware design</h2>
        <p>
          This platform is architected for HIPAA-aligned deployments: tenant isolation via Row Level
          Security, PHI-safe structured logging, server-side LLM proxying, and audit-ready data
          models. A signed Business Associate Agreement (BAA) with infrastructure and AI providers
          is required before processing real Protected Health Information in production.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Security controls</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>JWT-based authentication with tenant_id injected at login</li>
          <li>Encrypted data in transit (TLS) and at rest (Supabase managed storage)</li>
          <li>Distributed Redis locks to protect scheduling integrity</li>
          <li>Emergency keyword detection overriding AI responses when needed</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Pre-launch checklist</h2>
        <p>
          Before go-live with live PHI, complete the checklist in our HIPAA compliance documentation:
          enable OpenAI Zero Data Retention, execute Supabase BAA, run PHI log scans, and configure
          breach notification procedures.
        </p>
      </section>
    </LegalPage>
  );
}
