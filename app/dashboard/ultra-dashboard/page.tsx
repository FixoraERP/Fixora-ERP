"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function UltraDashboardPage(){
 const[session,setSession]=useState<any>(null);const[data,setData]=useState<any>({});
 useEffect(()=>{const s=getSession();if(!s){location.href="/login";return;}setSession(s);load(s)},[]);
 async function load(s:any){const cid=s.company_id;const [clients,os,sales,finance,stock,leads]=await Promise.all([
  supabase.from("clients").select("*").eq("company_id",cid),
  supabase.from("service_orders").select("*").eq("company_id",cid),
  supabase.from("quick_sales").select("*").eq("company_id",cid),
  supabase.from("financial_entries").select("*").eq("company_id",cid),
  supabase.from("stock_items").select("*").eq("company_id",cid),
  supabase.from("crm_leads").select("*").eq("company_id",cid)
 ]);setData({clients:clients.data||[],os:os.data||[],sales:sales.data||[],finance:finance.data||[],stock:stock.data||[],leads:leads.data||[]})}
 const money=useMemo(()=>{const fin=data.finance||[];return{receive:fin.filter((x:any)=>x.type==="receivable").reduce((a:any,b:any)=>a+Number(b.amount||0),0),pay:fin.filter((x:any)=>x.type==="payable").reduce((a:any,b:any)=>a+Number(b.amount||0),0),stock:(data.stock||[]).reduce((a:any,b:any)=>a+(Number(b.quantity||0)*Number(b.cost_price||0)),0)}},[data]);
 const bars=[{name:"Clientes",total:(data.clients||[]).length},{name:"OS",total:(data.os||[]).length},{name:"Vendas",total:(data.sales||[]).length},{name:"Leads",total:(data.leads||[]).length}];
 const pie=[{name:"A receber",value:money.receive},{name:"A pagar",value:money.pay},{name:"Estoque",value:money.stock}];
 return <div className="space-y-6"><h1 className="text-3xl font-black">Dashboard Ultra</h1><div className="grid md:grid-cols-4 gap-4"><div className="card p-4"><p className="text-zinc-400">Clientes</p><h2 className="text-3xl font-black">{(data.clients||[]).length}</h2></div><div className="card p-4"><p className="text-zinc-400">OS</p><h2 className="text-3xl font-black">{(data.os||[]).length}</h2></div><div className="card p-4"><p className="text-zinc-400">A receber</p><h2 className="text-2xl font-black">{brl(money.receive)}</h2></div><div className="card p-4"><p className="text-zinc-400">Estoque</p><h2 className="text-2xl font-black">{brl(money.stock)}</h2></div></div><section className="grid md:grid-cols-2 gap-4"><div className="card p-4 h-80"><h2 className="font-bold mb-3">Volume</h2><ResponsiveContainer width="100%" height="90%"><BarChart data={bars}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="total"/></BarChart></ResponsiveContainer></div><div className="card p-4 h-80"><h2 className="font-bold mb-3">Financeiro</h2><ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" label>{pie.map((_,i)=><Cell key={i}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></section></div>
}
