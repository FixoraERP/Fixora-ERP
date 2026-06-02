"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";

function daysLeft(date?: string) {
  if (!date) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

export default function MySubscriptionPage() {
  const [session, setSessionState] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) { location.href = "/login"; return; }
    setSessionState(s);
    load(s.company_id);
  }, []);

  async function load(cid:string) {
    const [{ data: c }, { data: p }, { data: ch }] = await Promise.all([
      supabase.from("companies").select("*").eq("id", cid).single(),
      supabase.from("saas_plans").select("*").eq("active", true).order("price"),
      supabase.from("payment_charges").select("*").eq("company_id", cid).eq("charge_scope", "saas").order("created_at", { ascending: false }).limit(20)
    ]);
    setCompany(c);
    setPlans(p || []);
    setCharges(ch || []);
    setSelectedPlan((p || []).find(x => x.name === c?.plan)?.id || "");
  }

  async function renew() {
    if (!session || !company) return;
    const res = await fetch("/api/licenses/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: company.id, user_id: session.user_id, plan_id: selectedPlan || undefined })
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Erro ao gerar renovação.");
    if (data.checkout_url) {
      navigator.clipboard?.writeText(data.checkout_url);
      window.open(data.checkout_url, "_blank");
      setMsg("Cobrança gerada. Link aberto e copiado.");
    } else {
      setMsg("Solicitação gerada. Aguarde confirmação manual do Master.");
    }
    load(company.id);
  }

  if (!company) return <p>Carregando...</p>;

  const d = daysLeft(company.subscription_due_date);
  const plan = plans.find(p => p.name === company.plan);
  const percent = company.owner_company ? 100 : Math.max(0, Math.min(100, (d / 30) * 100));

  return <div className="space-y-6">
    <h1 className="text-3xl font-black">Minha Assinatura</h1>
    <p className="text-zinc-400">Acompanhe seu plano, vencimento e renove direto pelo sistema.</p>

    <section className="card p-6 space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <div><p className="text-zinc-400">Plano atual</p><h2 className="text-2xl font-black">{company.plan}</h2></div>
        <div><p className="text-zinc-400">Valor</p><h2 className="text-2xl font-black">{brl(plan?.price || 0)}</h2></div>
        <div><p className="text-zinc-400">Vencimento</p><h2 className="text-2xl font-black">{company.owner_company ? "Sem vencimento" : company.subscription_due_date}</h2></div>
        <div><p className="text-zinc-400">Dias restantes</p><h2 className="text-2xl font-black">{company.owner_company ? "∞" : d}</h2></div>
      </div>
      <div className="w-full h-4 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${percent}%` }} /></div>
      <p className={company.blocked ? "text-red-300" : "text-green-300"}>Status: {company.owner_company ? "Dono do sistema" : company.subscription_status}</p>
    </section>

    <section className="card p-4 grid md:grid-cols-3 gap-3">
      <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
        {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {brl(p.price)}</option>)}
      </select>
      <button className="btn-primary" onClick={renew}>Renovar / Pagar plano</button>
      {msg && <p className="text-yellow-300">{msg}</p>}
    </section>

    <section className="card p-4 overflow-x-auto">
      <h2 className="font-bold mb-3">Histórico de cobranças</h2>
      <table className="w-full"><tbody>{charges.map(c => <tr key={c.id} className="border-b border-zinc-800"><td className="p-2">{c.description}</td><td>{brl(c.amount)}</td><td>{c.status}</td><td>{c.checkout_url ? <a href={c.checkout_url} target="_blank" className="text-blue-400 underline">Abrir</a> : "-"}</td></tr>)}</tbody></table>
    </section>
  </div>
}
