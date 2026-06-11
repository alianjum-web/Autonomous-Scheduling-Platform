import { createClient } from "@/lib/supabase/client";

export async function acceptStaffInvite(token: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_staff_invite", {
    p_token: token,
  });

  if (error) throw new Error(error.message);
  if (typeof data !== "string" || !data) {
    throw new Error("Could not accept invite.");
  }

  await supabase.auth.refreshSession();
  return data;
}
