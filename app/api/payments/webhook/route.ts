import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeChargeStatus, addDays } from "@/lib/payments";

async function markPaidByReference(reference: string, raw: any) {
  const { data: charge } = await supabaseAdmin
    .from("payment_charges")
    .select("*")
    .eq("external_reference", reference)
    .single();

  if (!charge) return false;

  const paidUntil = addDays(30);

  await supabaseAdmin.from("payment_charges").update({
    status: "paid",
    paid_at: new Date().toISOString(),
    raw_payload: raw,
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
      last_charge_id: charge.id
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
    notes: "Pagamento confirmado por webhook."
  });

  return true;
}

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const raw = await req.json();

    const reference =
      raw.external_reference ||
      raw.externalReference ||
      raw.data?.external_reference ||
      raw.data?.externalReference ||
      raw.reference ||
      raw.metadata?.external_reference;

    const status = normalizeChargeStatus(raw.status || raw.payment_status || raw.event || raw.data?.status);

    if (reference && status === "paid") {
      const ok = await markPaidByReference(reference, raw);
      return NextResponse.json({ ok, reference, status });
    }

    return NextResponse.json({ ok: true, ignored: true, status, reference });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro no webhook." }, { status: 500 });
  }
}
