import { FrontDeskWorkspace } from "@/components/appointments/screens/FrontDeskWorkspace";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Front Desk",
  "Real-time escalation queue and today's appointment calendar for clinic staff.",
);

export default function FrontDeskPage() {
  return <FrontDeskWorkspace />;
}
