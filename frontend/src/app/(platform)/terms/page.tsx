import { LegalPage } from "@/components/common/layout/LegalPage";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="June 5, 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Acceptance</h2>
        <p>
          By accessing Autonomous Scheduling Platform, you agree to these Terms. If you use the
          service on behalf of a clinic, you represent that you have authority to bind that
          organization.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Permitted use</h2>
        <p>
          The platform is intended for legitimate healthcare scheduling and patient intake. You may
          not misuse AI features for diagnosis, attempt to bypass security controls, or upload
          unlawful content.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Medical disclaimer</h2>
        <p>
          AI responses are informational only and do not constitute medical advice. Patients
          experiencing emergencies must contact emergency services immediately.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Availability</h2>
        <p>
          We strive for high availability but do not guarantee uninterrupted service. Maintenance
          windows and third-party dependencies (Supabase, OpenAI) may affect uptime.
        </p>
      </section>
    </LegalPage>
  );
}
