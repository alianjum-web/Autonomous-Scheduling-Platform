import { BillingScreen } from "@/components/common/screens/BillingScreen";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Billing", "Manage your Symptra subscription.");

export default function BillingPage() {
  return <BillingScreen />;
}
