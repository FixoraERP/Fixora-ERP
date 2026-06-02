"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";

export default function Finance() {
  const [s, setS] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ type: "receivable", description: "", person_name: "", due_date: "", amount: 0, status: "Aberto", notes: "" });

  useEffect(() => {
    const ss = getSession();
    if (!ss) {
      location.href = "/login";
      return;
    }
    setS(ss);
    load(ss.company_id);
  }, []);

  async function load(cid = s?.company_id) {
    if (!cid) return;
    const { data } = await supabase.from("financial_entries").select("*").eq("company_id", cid).order("created_at", { ascending: false });
    setRows(data || []);
  }

  async function save() {
    if (!s) return;
    if (!form.description) return alert("Informe descrição.");
    const r = await supabase.from("financial_entries").insert({ ...form, company_id: s.company_id });
    if (r.error) return alert(r.error.message);
    setForm({ type: "receivable", description: "", person_name: "", due_date: "", amount: 0, status: "Aberto", notes: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Financeiro</h1>
      <section className="card p-4 grid md:grid-cols-3 gap-3">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="receivable">A receber</option>
          <option value="payable">A pagar</option>
        </select>
        <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Pessoa" value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
        <input type="date" value={form.due_date || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        <input type="number" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {["Aberto", "Pago", "Atrasado", "Cancelado"].map((x) => <option key={x}>{x}</option>)}
        </select>
        <button className="btn-primary" onClick={save}>Salvar</button>
      </section>
      <section className="card p-4">
        <table className="w-full">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800">
                <td className="p-2">{r.type}</td>
                <td>{r.description}</td>
                <td>{brl(r.amount)}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
