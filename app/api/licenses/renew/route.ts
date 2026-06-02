import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays, makeReference } from "@/lib/payments";

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();

    const { company_id, user_id, plan_id } = await req.json();
    if (!company_id) return NextResponse.json({ error: "company_id obrigatório." }, { status: 400 });

    const { data: company } = await supabaseAdmin.from("companies").select("*").eq("id", company_id).single();
    if (!company) return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });

    const { data: plan } = plan_id
      ? await supabaseAdmin.from("saas_plans").select("*").eq("id", plan_id).single()
      : await supabaseAdmin.from("saas_plans").select("*").eq("name", company.plan || "Pro").single();

    if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

    const { data: gateway } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .eq("company_id", "00000000-0000-0000-0000-000000000001")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const provider = gateway?.provider || "manual";
    const external_reference = makeReference(company_id);
    const due_date = addDays(3);
    let checkout_url = gateway?.api_base_url || "";
    let external_id = "";
    let raw_response:any = { mode: "manual", message: "Cobrança manual/simulada criada para renovação SaaS." };

    if (provider === "mercadopago" && gateway?.access_token) {
      try {
        const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${gateway.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            external_reference,
            notification_url: gateway.notification_url || undefined,
            back_urls: {
              success: gateway.success_url || undefined,
              failure: gateway.failure_url || undefined,
              pending: gateway.success_url || undefined
            },
            items: [{
              title: `Renovação Fixora ERP - ${plan.name}`,
              quantity: 1,
              currency_id: "BRL",
              unit_price: Number(plan.price || 0)
            }],
            payer: { name: company.trade_name || company.name, email: company.email || "" }
          })
        });
        const data = await res.json();
        checkout_url = data.init_point || data.sandbox_init_point || "";
        external_id = String(data.id || "");
        raw_response = data;
      } catch (e:any) {
        raw_response = { error: e.message };
      }
    }

    if (provider === "asaas" && gateway?.access_token) {
      try {
        const base = gateway.sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
        const res = await fetch(`${base}/payments`, {
          method: "POST",
          headers: { "access_token": gateway.access_token, "Content-Type": "application/json" },
          body: JSON.stringify({
            billingType: "UNDEFINED",
            value: Number(plan.price || 0),
            dueDate: due_date,
            description: `Renovação Fixora ERP - ${plan.name}`,
            externalReference: external_reference
          })
        });
        const data = await res.json();
        checkout_url = data.invoiceUrl || data.bankSlipUrl || "";
        external_id = String(data.id || "");
        raw_response = data;
      } catch (e:any) {
        raw_response = { error: e.message };
      }
    }

    const { data: charge, error } = await supabaseAdmin.from("payment_charges").insert({
      company_id,
      plan_id: plan.id,
      provider,
      external_id,
      external_reference,
      customer_name: company.trade_name || company.name,
      customer_email: company.email || "",
      customer_document: company.document || "",
      amount: Number(plan.price || 0),
      description: `Renovação Fixora ERP - Plano ${plan.name}`,
      checkout_url,
      due_date,
      charge_scope: "saas",
      status: "pending",
      raw_response
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin.from("saas_renewal_requests").insert({
      company_id,
      plan_id: plan.id,
      charge_id: charge.id,
      status: "pending",
      amount: Number(plan.price || 0),
      checkout_url,
      requested_by: user_id || null
    });

    return NextResponse.json(charge);
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao renovar plano." }, { status: 500 });
  }
}
