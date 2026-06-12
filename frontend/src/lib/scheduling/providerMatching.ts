const UNASSIGNED_LABELS = new Set(["", "General Practice", "Provider"]);

function baseSpecialty(specialty: string): string {
  return specialty.split("·")[0]?.trim() ?? specialty;
}

export interface ProviderMatchFields {
  display_name: string;
  specialty?: string | null;
}

export interface AppointmentProviderFields {
  provider_name?: string | null;
}

/** True when an appointment belongs to this doctor (includes legacy unassigned bookings). */
export function appointmentMatchesProvider(
  appointment: AppointmentProviderFields,
  provider: ProviderMatchFields | undefined,
): boolean {
  if (!provider?.display_name) return false;

  const pname = (appointment.provider_name ?? "General Practice").trim();
  const display = provider.display_name.trim();
  const specialty = (provider.specialty ?? "General Practice").trim();
  const base = baseSpecialty(specialty);

  if (pname === display) return true;
  if (pname === specialty || pname === base) return true;
  if (UNASSIGNED_LABELS.has(pname)) return true;
  return false;
}
