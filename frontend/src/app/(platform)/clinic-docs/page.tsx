import { ClinicDocsScreen } from "@/components/clinic-docs/screens/ClinicDocsScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Clinic Documents",
  "Upload and manage clinic knowledge base documents for RAG-powered patient intake.",
);

export default function ClinicDocsPage() {
  return <ClinicDocsScreen />;
}
