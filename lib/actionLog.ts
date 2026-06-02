import { supabase } from "@/lib/supabase";

export async function logUserAction(session: any, action: string, module = "", details = "") {
  try {
    if (!session?.company_id) return;
    await supabase.from("user_action_logs").insert({
      company_id: session.company_id,
      user_id: session.user_id,
      user_name: session.full_name || session.username,
      action,
      module,
      details
    });
  } catch {}
}
