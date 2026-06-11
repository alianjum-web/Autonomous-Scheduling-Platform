import { ClinicBookingHero } from "@/components/booking/molecules/ClinicBookingHero";
import type { PublicClinic } from "@/lib/booking/publicClinicApi";

interface ClinicBookingLandingProps {
  clinic: PublicClinic;
}

export function ClinicBookingLanding({ clinic }: ClinicBookingLandingProps) {
  return <ClinicBookingHero clinic={clinic} />;
}
