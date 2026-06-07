import { HelpScreen } from "@/components/common/screens/HelpScreen";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Help Center",
  "Guides and FAQs for patient intake, scheduling, and clinic staff workflows.",
);

export default function HelpPage() {
  return <HelpScreen />;
}
