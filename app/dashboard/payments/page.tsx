"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s) { location.href = "/login"; return; }
    if (!s.master_admin) { location.href = "/dashboard"; return; }
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("payment_charges").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  }

  async function confirm(id: string) {
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ charge_id: id })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    alert("Pagamento confirmado e empresa renovada.");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Cobranças e Pagamentos</h1>
      <section className="card p-4 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left text-zinc-400"><th>Cliente</th><th>Valor</th><th>Provedor</th><th>Status</th><th>Link</th><th>Ações</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-b border-zinc-800">
                <td className="p-2">{r.customer_name}</td>
                <td>{brl(r.amount)}</td>
                <td>{r.provider}</td>
                <td>{r.status}</td>
                <td>{r.checkout_url ? <a className="text-blue-400 underline" href={r.checkout_url} target="_blank">Abrir link</a> : "-"}</td>
                <td>{r.status !== "paid" && <button className="btn-primary" onClick={()=>confirm(r.id)}>Confirmar pago</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
