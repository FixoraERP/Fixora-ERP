import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const { company_id, blocked, reason } = await req.json();

    if (!company_id) {
      return NextResponse.json({ error: "company_id ausente." }, { status: 400 });
    }

    const status = blocked ? "blocked" : "active";

    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        blocked: Boolean(blocked),
        block_reason: reason || "",
        subscription_status: status
      })
      .eq("id", company_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin
      .from("company_subscriptions")
      .update({
        blocked: Boolean(blocked),
        block_reason: reason || "",
        status
      })
      .eq("company_id", company_id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro ao alterar bloqueio." }, { status: 500 });
  }
}
