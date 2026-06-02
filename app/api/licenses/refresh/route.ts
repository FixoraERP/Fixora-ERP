import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    assertServerSupabaseConfig();

    const { data: companies, error } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("owner_company", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdue = 0;
    let blocked = 0;

    for (const c of companies || []) {
      if (!c.subscription_due_date) continue;
      const due = new Date(c.subscription_due_date);
      due.setHours(0, 0, 0, 0);
      const grace = Number(c.grace_days ?? 3);
      const graceEnd = new Date(due);
      graceEnd.setDate(graceEnd.getDate() + grace);

      if (today > graceEnd) {
        await supabaseAdmin.from("companies").update({
          subscription_status: "blocked",
          blocked: true,
          block_reason: "Assinatura vencida. Renove o plano para continuar."
        }).eq("id", c.id);
        blocked++;
      } else if (today > due) {
        await supabaseAdmin.from("companies").update({
          subscription_status: "overdue",
          blocked: false,
          block_reason: "Assinatura vencida em período de tolerância."
        }).eq("id", c.id);
        overdue++;
      }
    }

    return NextResponse.json({ ok: true, overdue, blocked });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao atualizar licenças." }, { status: 500 });
  }
}
