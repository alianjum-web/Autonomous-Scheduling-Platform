import { LegalPage } from "@/components/common/layout/LegalPage";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="June 5, 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>
        <p>
          Autonomous Scheduling Platform (&ldquo;we,&rdquo; &ldquo;our&rdquo;) provides AI-assisted
          patient intake and scheduling software for healthcare organizations. This policy describes
          how we collect, use, and protect information when you use our services.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Information we process</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account credentials and profile data (email, name, clinic affiliation)</li>
          <li>Patient intake chat content and scheduling preferences</li>
          <li>Appointment metadata (times, confirmation codes, provider assignments)</li>
          <li>Clinic documents uploaded for knowledge-base retrieval</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">How we use data</h2>
        <p>
          Data is used solely to deliver intake, triage, scheduling, and staff workflow features.
          LLM processing occurs server-side through our FastAPI gateway — API keys never reach the
          browser. Structured logs redact PHI fields before storage.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
        <p>
          Depending on jurisdiction, you may request access, correction, or deletion of personal
          data. Contact your clinic administrator or our support team for data subject requests.
        </p>
      </section>
    </LegalPage>
  );
}
