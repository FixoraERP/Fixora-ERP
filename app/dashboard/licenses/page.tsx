"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";

function daysLeft(date?: string) {
  if (!date) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

export default function LicensesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) { location.href = "/login"; return; }
    if (!s.master_admin) { location.href = "/dashboard"; return; }
    load();
  }, []);

  async function load() {
    const [{ data: c }, { data: p }, { data: ch }] = await Promise.all([
      supabase.from("companies").select("*").order("trade_name"),
      supabase.from("saas_plans").select("*").order("price"),
      supabase.from("payment_charges").select("*").eq("charge_scope", "saas").order("created_at", { ascending: false }).limit(100)
    ]);
    setCompanies(c || []);
    setPlans(p || []);
    setCharges(ch || []);
  }

  const summary = useMemo(() => ({
    active: companies.filter(c => !c.owner_company && c.subscription_status === "active" && !c.blocked).length,
    trial: companies.filter(c => c.subscription_status === "trial").length,
    overdue: companies.filter(c => c.subscription_status === "overdue").length,
    blocked: companies.filter(c => c.blocked || c.subscription_status === "blocked").length,
    mrr: companies.filter(c => !c.owner_company && !c.blocked).reduce((a, c) => a + Number(plans.find(p => p.name === c.plan)?.price || 0), 0)
  }), [companies, plans]);

  async function refreshLicenses() {
    const res = await fetch("/api/licenses/refresh", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Erro.");
    setMsg(`Atualizado: ${data.overdue} vencidas, ${data.blocked} bloqueadas.`);
    load();
  }

  async function setDays(c:any, days:number) {
    const due = new Date(); due.setDate(due.getDate() + days);
    const dueDate = due.toISOString().slice(0, 10);
    const { error } = await supabase.from("companies").update({
      subscription_due_date: dueDate,
      subscription_status: "active",
      blocked: false,
      block_reason: "",
      next_payment_at: dueDate
    }).eq("id", c.id);
    if (error) return setMsg(error.message);
    await supabase.from("saas_license_events").insert({ company_id: c.id, event_type: "manual_renew", new_status: "active", details: `Licença renovada por ${days} dias.` });
    setMsg("Licença atualizada.");
    load();
  }

  async function block(c:any, b:boolean) {
    if (c.owner_company && b) return setMsg("Empresa dona não pode ser bloqueada.");
    const { error } = await supabase.from("companies").update({
      blocked: b,
      subscription_status: b ? "blocked" : "active",
      block_reason: b ? "Bloqueio manual pelo Master Admin." : ""
    }).eq("id", c.id);
    if (error) return setMsg(error.message);
    setMsg(b ? "Empresa bloqueada." : "Empresa liberada.");
    load();
  }

  function planPrice(n:string) { return Number(plans.find(p => p.name === n)?.price || 0); }

  return <div className="space-y-6">
    <h1 className="text-3xl font-black">Licenças SaaS</h1>
    <p className="text-zinc-400">Central exclusiva do Master para vencimentos, trial, tolerância, bloqueios e renovações.</p>

    <div className="grid md:grid-cols-5 gap-4">
      <div className="card p-4"><p className="text-zinc-400">Ativas</p><h2 className="text-3xl font-black">{summary.active}</h2></div>
      <div className="card p-4"><p className="text-zinc-400">Trial</p><h2 className="text-3xl font-black">{summary.trial}</h2></div>
      <div className="card p-4"><p className="text-zinc-400">Vencidas</p><h2 className="text-3xl font-black">{summary.overdue}</h2></div>
      <div className="card p-4"><p className="text-zinc-400">Bloqueadas</p><h2 className="text-3xl font-black">{summary.blocked}</h2></div>
      <div className="card p-4"><p className="text-zinc-400">MRR estimado</p><h2 className="text-2xl font-black">{brl(summary.mrr)}</h2></div>
    </div>

    <section className="card p-4 flex gap-2 flex-wrap">
      <button className="btn-primary" onClick={refreshLicenses}>Atualizar vencimentos agora</button>
      {msg && <p className="text-yellow-300">{msg}</p>}
    </section>

    <section className="card p-4 overflow-x-auto">
      <table className="w-full">
        <thead><tr className="text-left text-zinc-400"><th>Empresa</th><th>Plano</th><th>Valor</th><th>Status</th><th>Vencimento</th><th>Dias</th><th>Ações</th></tr></thead>
        <tbody>{companies.map(c => {
          const d = daysLeft(c.subscription_due_date);
          return <tr key={c.id} className={`border-b border-zinc-800 ${d <= 3 && !c.owner_company ? "text-yellow-300" : ""}`}>
            <td className="p-2">{c.trade_name || c.name}</td>
            <td>{c.plan}</td>
            <td>{brl(planPrice(c.plan))}</td>
            <td>{c.owner_company ? "Dono" : c.subscription_status}</td>
            <td>{c.subscription_due_date || "-"}</td>
            <td>{c.owner_company ? "∞" : d}</td>
            <td className="flex flex-wrap gap-2 py-2">
              <button className="btn-secondary" onClick={() => setDays(c, 7)}>+7d</button>
              <button className="btn-secondary" onClick={() => setDays(c, 15)}>+15d</button>
              <button className="btn-secondary" onClick={() => setDays(c, 30)}>+30d</button>
              <button className="btn-secondary" onClick={() => setDays(c, 365)}>+1 ano</button>
              <button className="btn-danger" onClick={() => block(c, true)}>Bloquear</button>
              <button className="btn-secondary" onClick={() => block(c, false)}>Liberar</button>
            </td>
          </tr>;
        })}</tbody>
      </table>
    </section>
  </div>
}
