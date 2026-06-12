import { MarketingFeaturesSection } from "@/components/platform/organisms/MarketingFeaturesSection";
import { MarketingHeroSection } from "@/components/platform/organisms/MarketingHeroSection";
import { MarketingHowItWorksSection } from "@/components/platform/organisms/MarketingHowItWorksSection";
import { MarketingPricingSection } from "@/components/platform/organisms/MarketingPricingSection";
import { MarketingTeamBannerSection } from "@/components/platform/organisms/MarketingTeamBannerSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Home",
  "AI-first patient intake and autonomous scheduling for high-trust medical and dental clinics.",
);

export default function MarketingHomeScreen() {
  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeroSection />
      <MarketingFeaturesSection />
      <MarketingHowItWorksSection />
      <MarketingTeamBannerSection />
      <MarketingPricingSection />
    </div>
  );
}
