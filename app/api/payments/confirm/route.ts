import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays } from "@/lib/payments";

async function activateCompany(charge: any) {
  const paidUntil = addDays(30);

  await supabaseAdmin.from("payment_charges").update({
    status: "paid",
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", charge.id);

  await supabaseAdmin.from("companies").update({
    subscription_status: "active",
    subscription_due_date: paidUntil,
    blocked: false,
    block_reason: ""
  }).eq("id", charge.company_id);

  const { data: sub } = await supabaseAdmin
    .from("company_subscriptions")
    .select("*")
    .eq("company_id", charge.company_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (sub?.id) {
    await supabaseAdmin.from("company_subscriptions").update({
      status: "active",
      due_date: paidUntil,
      paid_until: paidUntil,
      blocked: false,
      block_reason: "",
      last_charge_id: charge.id,
      updated_at: new Date().toISOString()
    }).eq("id", sub.id);
  }

  await supabaseAdmin.from("subscription_payments").insert({
    company_id: charge.company_id,
    subscription_id: sub?.id || null,
    charge_id: charge.id,
    amount: charge.amount,
    due_date: charge.due_date,
    paid_at: new Date().toISOString(),
    status: "paid",
    payment_method: charge.provider,
    reference: charge.external_reference,
    notes: "Pagamento confirmado e assinatura renovada por 30 dias."
  });
}

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const { charge_id, external_reference } = await req.json();

    let query = supabaseAdmin.from("payment_charges").select("*");
    if (charge_id) query = query.eq("id", charge_id);
    else if (external_reference) query = query.eq("external_reference", external_reference);
    else return NextResponse.json({ error: "charge_id ou external_reference obrigatório." }, { status: 400 });

    const { data: charge, error } = await query.single();

    if (error || !charge) return NextResponse.json({ error: "Cobrança não encontrada." }, { status: 404 });

    await activateCompany(charge);

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao confirmar pagamento." }, { status: 500 });
  }
}
