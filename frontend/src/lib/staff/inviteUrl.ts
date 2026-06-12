export function staffInviteAcceptUrl(token: string): string {
  const path = `/accept-invite?token=${encodeURIComponent(token)}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export async function copyStaffInviteLink(token: string): Promise<boolean> {
  const url = staffInviteAcceptUrl(token);
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
