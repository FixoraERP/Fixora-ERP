"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";

export default function ReportsPage(){
 const [rows,setRows]=useState<any>({});
 useEffect(()=>{boot()},[]);
 async function boot(){
  const s=getSession(); if(!s){location.href="/login";return;}
  const [{data:os},{data:fin},{data:sales},{data:stock}] = await Promise.all([
   supabase.from("service_orders").select("*").eq("company_id",s.company_id),
   supabase.from("financial_entries").select("*").eq("company_id",s.company_id),
   supabase.from("quick_sales").select("*").eq("company_id",s.company_id),
   supabase.from("stock_items").select("*").eq("company_id",s.company_id)
  ]);
  setRows({os:os||[],fin:fin||[],sales:sales||[],stock:stock||[]});
 }
 const receitaOS=(rows.os||[]).reduce((a:any,b:any)=>a+Number(b.total_value||0),0);
 const vendas=(rows.sales||[]).reduce((a:any,b:any)=>a+Number(b.total_value||0),0);
 const receber=(rows.fin||[]).filter((x:any)=>x.type==="receivable").reduce((a:any,b:any)=>a+Number(b.amount||0),0);
 const pagar=(rows.fin||[]).filter((x:any)=>x.type==="payable").reduce((a:any,b:any)=>a+Number(b.amount||0),0);
 const estoqueBaixo=(rows.stock||[]).filter((x:any)=>Number(x.quantity||0)<=2);
 return <div className="space-y-6">
  <h1 className="text-3xl font-black">Relatórios</h1>
  <div className="grid md:grid-cols-4 gap-4">
   <Card title="Receita OS" value={brl(receitaOS)}/>
   <Card title="Vendas" value={brl(vendas)}/>
   <Card title="A receber" value={brl(receber)}/>
   <Card title="A pagar" value={brl(pagar)}/>
  </div>
  <section className="card p-4"><h2 className="text-xl font-bold mb-3">Estoque baixo</h2>{estoqueBaixo.map((i:any)=><p key={i.id} className="border-b border-zinc-800 p-2">{i.name} - {i.quantity}</p>)}</section>
 </div>
}
function Card({title,value}:any){return <div className="card p-4"><p className="text-zinc-400">{title}</p><p className="text-2xl font-black">{value}</p></div>}
