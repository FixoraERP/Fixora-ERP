import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

function token() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const { company_id, client_id, service_order_id } = await req.json();
    if (!company_id) return NextResponse.json({ error: "company_id obrigatório." }, { status: 400 });

    const t = token();
    const { data, error } = await supabaseAdmin.from("customer_portal_tokens").insert({
      company_id, client_id: client_id || null, service_order_id: service_order_id || null, token: t
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ token: t, url: `/portal/${t}`, record: data });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao gerar portal." }, { status: 500 });
  }
}
