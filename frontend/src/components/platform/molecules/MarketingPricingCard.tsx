import { MarketingCtaGroup } from "@/components/platform/molecules/MarketingCtaGroup";
import { CardContent } from "@/components/ui/card";

export function MarketingPricingCard() {
  return (
    <CardContent className="flex flex-col items-center gap-6 p-10 text-center sm:p-14">
      <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clinic trial</h3>
      <p className="max-w-lg text-muted-foreground">
        Owner sign-up, full onboarding, doctor invites, and unlimited guest patient bookings on your
        public clinic page.
      </p>
      <MarketingCtaGroup variant="pricing" />
    </CardContent>
  );
}
