import { StatusScreen } from "@/components/common/screens/StatusScreen";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "System Status",
  "Live platform health checks for API, database, Redis, and OpenAI services.",
);

export default function StatusPage() {
  return <StatusScreen />;
}
