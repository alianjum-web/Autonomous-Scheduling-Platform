import { ClinicalImage } from "@/components/common/atoms/ClinicalImage";
import { MarketingCtaGroup } from "@/components/platform/molecules/MarketingCtaGroup";

export function MarketingTeamBannerSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/70">
          <div className="relative aspect-3/1 max-h-72 w-full sm:max-h-80">
            <ClinicalImage asset="team" variant="banner" />
            <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/70 to-background/30" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Built for clinical teams
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Your staff stays in the loop — from intake to escalation
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Front desk, providers, and admins share one real-time workspace with tenant-isolated
              data and role-based access.
            </p>
            <div className="mt-6">
              <MarketingCtaGroup variant="banner" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
