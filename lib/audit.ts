import { supabase } from "@/lib/supabase";

export async function logAction(company_id: string, user_name: string, action: string, entity = "", entity_id = "", details = "") {
  try {
    await supabase.from("audit_logs").insert({ company_id, user_name, action, entity, entity_id, details });
  } catch {}
}
