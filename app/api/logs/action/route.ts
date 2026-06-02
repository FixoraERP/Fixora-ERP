import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const body = await req.json();
    const { company_id, user_id, action, module, details } = body;
    if (!company_id || !action) return NextResponse.json({ error: "company_id e action são obrigatórios." }, { status: 400 });
    const { error } = await supabaseAdmin.from("user_action_logs").insert({
      company_id, user_id: user_id || null, action, module: module || "", details: details || {}
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao registrar log." }, { status: 500 });
  }
}
