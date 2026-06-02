"use client";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { brl } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardUltra() {
  const [session, setSessionState] = useState<any>(null);
  const [counts, setCounts] = useState<any>({});
  const [money, setMoney] = useState({ receive: 0, pay: 0, sales: 0, os: 0 });
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(()=>{ boot(); }, []);

  async function boot() {
    const s = getSession();
    if (!s) { location.href = "/login"; return; }
    setSessionState(s);

    const tables = ["clients","suppliers","stock_items","service_orders","financial_entries","quick_sales"];
    const c:any = {};
    for (const t of tables) {
      const { count } = await supabase.from(t).select("*", { count:"exact", head:true }).eq("company_id", s.company_id);
      c[t] = count || 0;
    }
    setCounts(c);

    const [{ data: fin }, { data: orders }, { data: sales }] = await Promise.all([
      supabase.from("financial_entries").select("*").eq("company_id", s.company_id),
      supabase.from("service_orders").select("*").eq("company_id", s.company_id),
      supabase.from("quick_sales").select("*").eq("company_id", s.company_id)
    ]);

    setMoney({
      receive: (fin||[]).filter((x:any)=>x.type==="receivable"&&x.status!=="Pago").reduce((sum:number,x:any)=>sum+Number(x.amount||0),0),
      pay: (fin||[]).filter((x:any)=>x.type==="payable"&&x.status!=="Pago").reduce((sum:number,x:any)=>sum+Number(x.amount||0),0),
      os: (orders||[]).reduce((sum:number,x:any)=>sum+Number(x.total_value||0),0),
      sales: (sales||[]).reduce((sum:number,x:any)=>sum+Number(x.total_value||0),0)
    });

    const map:any = {};
    (orders||[]).forEach((o:any)=>{ map[o.status||"Sem status"] = (map[o.status||"Sem status"]||0)+1; });
    setStatusData(Object.entries(map).map(([name, total])=>({ name, total })));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Dashboard Ultra</h1>
      {session && <p className="text-zinc-400">Bem-vindo, {session.full_name}</p>}
      {session?.master_admin && <p className="text-sm text-green-300">Master Admin: sem vencimento e sem bloqueio.</p>}
      {session && <p className="text-sm text-yellow-300">Plano: {session.subscription_status || 'active'} · Vencimento: {session.subscription_due_date || '-'}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Clientes" value={counts.clients||0}/>
        <Card title="Fornecedores" value={counts.suppliers||0}/>
        <Card title="Produtos/Peças" value={counts.stock_items||0}/>
        <Card title="Ordens de Serviço" value={counts.service_orders||0}/>
        <Card title="A receber" value={brl(money.receive)}/>
        <Card title="A pagar" value={brl(money.pay)}/>
        <Card title="Total em OS" value={brl(money.os)}/>
        <Card title="Vendas rápidas" value={brl(money.sales)}/>
      </div>
      <section className="card p-4">
        <h2 className="text-xl font-bold mb-4">OS por status</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
function Card({title,value}:any){return <div className="card p-4"><p className="text-zinc-400">{title}</p><p className="text-3xl font-black">{value}</p></div>}
