export const paymentProviders = [
  { value: "manual", label: "Manual / Simulado" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "asaas", label: "Asaas" },
  { value: "infinitepay", label: "InfinitePay" },
  { value: "stripe", label: "Stripe" },
  { value: "pagseguro", label: "PagSeguro" },
  { value: "pix", label: "Pix" },
  { value: "external_link", label: "Link externo" }
];

export function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

export function makeReference(company_id: string) {
  return `fixora_${company_id}_${Date.now()}`;
}

export function normalizeChargeStatus(status: any) {
  const value = String(status || "").toLowerCase().trim();
  if (["approved", "paid", "received", "confirmed", "completed", "succeeded", "success"].includes(value)) return "paid";
  if (["cancelled", "canceled", "cancelado"].includes(value)) return "cancelled";
  if (["expired", "expirado"].includes(value)) return "expired";
  if (["refunded", "estornado"].includes(value)) return "refunded";
  if (["rejected", "failed", "recused", "recusado"].includes(value)) return "failed";
  return "pending";
}

export function isPaidStatus(status: any) {
  return normalizeChargeStatus(status) === "paid";
}

export function buildWhatsAppPaymentMessage(...args: any[]) {
  let charge: any = {};
  if (args.length === 1 && typeof args[0] === "object") {
    charge = args[0] || {};
  } else {
    charge = {
      checkout_url: args[0] || "",
      description: args[1] || "",
      amount: args[2] || 0,
      pix_copy_paste: args[3] || ""
    };
  }
  const lines = [
    `Olá! Segue a cobrança${charge?.description ? ` referente a ${charge.description}` : ""}.`,
    charge?.amount ? `Valor: R$ ${Number(charge.amount).toFixed(2).replace(".", ",")}` : "",
    charge?.checkout_url ? `Link de pagamento: ${charge.checkout_url}` : "",
    charge?.pix_copy_paste ? `Pix copia e cola: ${charge.pix_copy_paste}` : ""
  ].filter(Boolean);
  return lines.join("\n");
}

export function providerLabel(provider: any) {
  const found = paymentProviders.find(p => p.value === String(provider || ""));
  return found?.label || String(provider || "Manual");
}
