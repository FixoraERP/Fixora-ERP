import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays, makeReference } from "@/lib/payments";

async function createProviderLink(provider: string, gateway: any, charge: any) {
  const fallbackUrl = `${gateway?.success_url || ""}` || `/dashboard/subscriptions`;

  if (provider === "manual" || provider === "generic" || !gateway?.active) {
    return {
      checkout_url: gateway?.api_base_url || fallbackUrl || "",
      pix_qr_code: "",
      pix_copy_paste: "",
      external_id: "",
      response: { mode: "manual", message: "Cobrança criada em modo manual/simulado." }
    };
  }

  if (provider === "mercadopago") {
    try {
      const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${gateway.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          external_reference: charge.external_reference,
          notification_url: gateway.notification_url || undefined,
          back_urls: {
            success: gateway.success_url || undefined,
            failure: gateway.failure_url || undefined,
            pending: gateway.success_url || undefined
          },
          items: [{
            title: charge.description,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(charge.amount)
          }],
          payer: {
            name: charge.customer_name,
            email: charge.customer_email
          }
        })
      });
      const data = await res.json();
      return {
        checkout_url: data.init_point || data.sandbox_init_point || "",
        pix_qr_code: "",
        pix_copy_paste: "",
        external_id: String(data.id || ""),
        response: data
      };
    } catch (e:any) {
      return { checkout_url: "", pix_qr_code: "", pix_copy_paste: "", external_id: "", response: { error: e.message } };
    }
  }

  if (provider === "asaas") {
    try {
      const base = gateway.sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
      const res = await fetch(`${base}/payments`, {
        method: "POST",
        headers: {
          "access_token": gateway.access_token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          billingType: "UNDEFINED",
          value: Number(charge.amount),
          dueDate: charge.due_date,
          description: charge.description,
          externalReference: charge.external_reference,
          customer: charge.customer_external_id || undefined
        })
      });
      const data = await res.json();
      return {
        checkout_url: data.invoiceUrl || data.bankSlipUrl || "",
        pix_qr_code: "",
        pix_copy_paste: "",
        external_id: String(data.id || ""),
        response: data
      };
    } catch (e:any) {
      return { checkout_url: "", pix_qr_code: "", pix_copy_paste: "", external_id: "", response: { error: e.message } };
    }
  }

  if (provider === "stripe") {
    return {
      checkout_url: gateway.api_base_url || "",
      pix_qr_code: "",
      pix_copy_paste: "",
      external_id: "",
      response: { message: "Stripe preparado para link externo. Configure Checkout Session em uma etapa futura se desejar." }
    };
  }

  if (provider === "pagseguro") {
    return {
      checkout_url: gateway.api_base_url || "",
      pix_qr_code: "",
      pix_copy_paste: "",
      external_id: "",
      response: { message: "PagSeguro preparado para link externo ou API. Configure URL/token." }
    };
  }

  return {
    checkout_url: gateway?.api_base_url || "",
    pix_qr_code: "",
    pix_copy_paste: "",
    external_id: "",
    response: { message: "Provedor genérico/manual." }
  };
}

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const body = await req.json();
    const { company_id, plan_id, provider, customer_name, customer_email, customer_document, amount, description, due_days } = body;

    if (!company_id || !amount) {
      return NextResponse.json({ error: "company_id e valor são obrigatórios." }, { status: 400 });
    }

    const { data: gateway } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .eq("company_id", "00000000-0000-0000-0000-000000000001")
      .eq("provider", provider || "manual")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const external_reference = makeReference(company_id);
    const due_date = addDays(Number(due_days || 3));

    const chargePayload:any = {
      company_id,
      plan_id: plan_id || null,
      provider: provider || "manual",
      external_reference,
      customer_name: customer_name || "",
      customer_email: customer_email || "",
      customer_document: customer_document || "",
      amount: Number(amount),
      description: description || "Assinatura Fixora ERP",
      due_date,
      status: "pending"
    };

    const providerResult = await createProviderLink(provider || "manual", gateway, chargePayload);

    const { data, error } = await supabaseAdmin.from("payment_charges").insert({
      ...chargePayload,
      checkout_url: providerResult.checkout_url,
      pix_qr_code: providerResult.pix_qr_code,
      pix_copy_paste: providerResult.pix_copy_paste,
      external_id: providerResult.external_id,
      raw_response: providerResult.response
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao criar cobrança." }, { status: 500 });
  }
}
