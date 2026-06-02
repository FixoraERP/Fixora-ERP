"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl, formatDate } from "@/lib/utils";
import { buildWhatsAppPaymentMessage, paymentProviders, providerLabel } from "@/lib/payments";
import WhatsAppMessageActions from "@/components/WhatsAppMessageActions";

const emptyCharge: any = {
  customer_name: "",
  customer_email: "",
  customer_document: "",
  customer_phone: "",
  amount: 0,
  description: "",
  provider: "manual",
  checkout_url: "",
  pix_copy_paste: "",
  status: "pending",
  charge_scope: "company"
};

export default function CompanyChargesPage() {
  const [session, setSession] = useState<any>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyCharge);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) {
      location.href = "/login";
      return;
    }
    setSession(s);
    load(s.company_id);
  }, []);

  async function load(companyId?: string) {
    if (!companyId) return;
    const { data } = await supabase
      .from("payment_charges")
      .select("*")
      .eq("company_id", companyId)
      .eq("charge_scope", "company")
      .order("created_at", { ascending: false });
    setCharges(data || []);
  }

  function setv(key: string, value: any) {
    setForm((old: any) => ({ ...old, [key]: value }));
  }

  async function saveCharge() {
    if (!session) return;
    setMsg("");
    const payload = { ...form, company_id: session.company_id, amount: Number(form.amount || 0), charge_scope: "company", status: form.status || "pending" };
    const result = form.id
      ? await supabase.from("payment_charges").update(payload).eq("id", form.id)
      : await supabase.from("payment_charges").insert(payload);
    if (result.error) {
      setMsg(result.error.message);
      return;
    }
    setMsg("Cobrança salva.");
    setForm(emptyCharge);
    load(session.company_id);
  }

  async function markPaid(charge: any) {
    const { error } = await supabase.from("payment_charges").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", charge.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Cobrança marcada como paga.");
    load(session?.company_id);
  }

  async function removeCharge() {
    if (!form.id) {
      alert("Selecione uma cobrança.");
      return;
    }
    if (!confirm("Excluir cobrança?")) return;
    const { error } = await supabase.from("payment_charges").delete().eq("id", form.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    setForm(emptyCharge);
    setMsg("Cobrança excluída.");
    load(session?.company_id);
  }

  function selectCharge(charge: any) {
    setForm({ ...emptyCharge, ...charge });
  }

  function openPaymentLink(charge: any) {
    if (!charge.checkout_url) {
      alert("Essa cobrança não possui link de pagamento.");
      return;
    }
    window.open(charge.checkout_url, "_blank");
  }

  function messageFor(charge: any) {
    return buildWhatsAppPaymentMessage(charge);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Cobranças da Assistência</h1>
        <p className="text-zinc-400">Crie links manuais, Pix ou cobranças externas para clientes.</p>
      </div>

      <section className="card p-4 grid md:grid-cols-3 gap-3">
        <input placeholder="Cliente" value={form.customer_name || ""} onChange={(e) => setv("customer_name", e.target.value)} />
        <input placeholder="WhatsApp" value={form.customer_phone || ""} onChange={(e) => setv("customer_phone", e.target.value)} />
        <input placeholder="E-mail" value={form.customer_email || ""} onChange={(e) => setv("customer_email", e.target.value)} />
        <input placeholder="CPF/CNPJ" value={form.customer_document || ""} onChange={(e) => setv("customer_document", e.target.value)} />
        <input type="number" placeholder="Valor" value={form.amount || 0} onChange={(e) => setv("amount", Number(e.target.value || 0))} />
        <select value={form.provider || "manual"} onChange={(e) => setv("provider", e.target.value)}>
          {paymentProviders.map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}
        </select>
        <input className="md:col-span-2" placeholder="Descrição" value={form.description || ""} onChange={(e) => setv("description", e.target.value)} />
        <select value={form.status || "pending"} onChange={(e) => setv("status", e.target.value)}>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="cancelled">Cancelado</option>
          <option value="expired">Expirado</option>
        </select>
        <input className="md:col-span-2" placeholder="Link de pagamento" value={form.checkout_url || ""} onChange={(e) => setv("checkout_url", e.target.value)} />
        <input placeholder="Pix copia e cola" value={form.pix_copy_paste || ""} onChange={(e) => setv("pix_copy_paste", e.target.value)} />

        <div className="md:col-span-3 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={saveCharge}>{form.id ? "Salvar cobrança" : "Criar cobrança"}</button>
          <button className="btn-secondary" onClick={() => setForm(emptyCharge)}>Limpar</button>
          <button className="btn-danger" onClick={removeCharge}>Excluir</button>
        </div>
        {msg && <p className="text-yellow-300 md:col-span-3">{msg}</p>}
      </section>

      <section className="card p-4 overflow-x-auto">
        <h2 className="text-xl font-bold mb-3">Cobranças cadastradas</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-zinc-400"><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Gateway</th><th>Status</th><th>Data</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {charges.map((charge: any) => (
              <tr key={charge.id} className="border-b border-zinc-800 align-top">
                <td className="p-2 cursor-pointer" onClick={() => selectCharge(charge)}>{charge.customer_name || "-"}</td>
                <td>{charge.description || "-"}</td>
                <td>{brl(charge.amount)}</td>
                <td>{providerLabel(charge.provider)}</td>
                <td>{charge.status}</td>
                <td>{formatDate(charge.created_at)}</td>
                <td className="py-2">
                  <div className="flex flex-col gap-2">
                    <button className="btn-secondary" onClick={() => selectCharge(charge)}>Editar</button>
                    <button className="btn-secondary" onClick={() => openPaymentLink(charge)}>Abrir link</button>
                    <button className="btn-secondary" onClick={() => markPaid(charge)}>Marcar pago</button>
                    <WhatsAppMessageActions phone={charge.customer_phone || charge.whatsapp || charge.phone} message={messageFor(charge)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {charges.length === 0 && <p className="text-zinc-400 mt-3">Nenhuma cobrança cadastrada.</p>}
      </section>
    </div>
  );
}
