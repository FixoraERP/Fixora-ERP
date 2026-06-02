import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const { charge_id } = await req.json();
    if (!charge_id) return NextResponse.json({ error: "charge_id obrigatório." }, { status: 400 });

    const { data: charge, error } = await supabaseAdmin.from("payment_charges").select("*").eq("id", charge_id).single();
    if (error || !charge) return NextResponse.json({ error: "Cobrança não encontrada." }, { status: 404 });

    await supabaseAdmin.from("payment_charges").update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq("id", charge_id);

    if (charge.service_order_id) {
      await supabaseAdmin.from("service_orders").update({
        status: "Pago",
        updated_at: new Date().toISOString()
      }).eq("id", charge.service_order_id);
    }

    await supabaseAdmin.from("financial_entries").insert({
      company_id: charge.company_id,
      type: "receivable",
      description: `Pagamento recebido: ${charge.description}`,
      person_name: charge.customer_name,
      due_date: charge.due_date,
      amount: charge.amount,
      status: "Pago",
      notes: `Cobrança ${charge.external_reference} confirmada.`
    });

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao confirmar pagamento da empresa." }, { status: 500 });
  }
}
