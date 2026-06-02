"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";
const empty:any={name:"",active:true};
export default function FinancialAdvancedPage(){
 const[session,setSession]=useState<any>(null);const[centers,setCenters]=useState<any[]>([]);const[accounts,setAccounts]=useState<any[]>([]);const[entries,setEntries]=useState<any[]>([]);const[center,setCenter]=useState<any>(empty);const[msg,setMsg]=useState("");
 useEffect(()=>{const s=getSession();if(!s){location.href="/login";return;}setSession(s);load(s.company_id)},[]);
 async function load(cid=session?.company_id){if(!cid)return;const[{data:c},{data:a},{data:e}]=await Promise.all([supabase.from("cost_centers").select("*").eq("company_id",cid),supabase.from("bank_accounts").select("*").eq("company_id",cid),supabase.from("financial_entries").select("*").eq("company_id",cid)]);setCenters(c||[]);setAccounts(a||[]);setEntries(e||[])}
 async function addCenter(){if(!session||!center.name)return;const{error}=await supabase.from("cost_centers").insert({...center,company_id:session.company_id});if(error)return setMsg(error.message);setCenter(empty);load()}
 const totalIn=entries.filter((e:any)=>e.type==="receivable").reduce((a:any,b:any)=>a+Number(b.amount||0),0); const totalOut=entries.filter((e:any)=>e.type==="payable").reduce((a:any,b:any)=>a+Number(b.amount||0),0);
 return <div className="space-y-6"><h1 className="text-3xl font-black">Financeiro Avançado</h1><div className="grid md:grid-cols-3 gap-4"><div className="card p-4"><p className="text-zinc-400">Receitas</p><h2 className="text-2xl font-black">{brl(totalIn)}</h2></div><div className="card p-4"><p className="text-zinc-400">Despesas</p><h2 className="text-2xl font-black">{brl(totalOut)}</h2></div><div className="card p-4"><p className="text-zinc-400">Resultado</p><h2 className="text-2xl font-black">{brl(totalIn-totalOut)}</h2></div></div><section className="card p-4 grid md:grid-cols-3 gap-3"><input placeholder="Novo centro de custo" value={center.name} onChange={e=>setCenter({...center,name:e.target.value})}/><button className="btn-primary" onClick={addCenter}>Adicionar centro</button>{msg&&<p className="text-yellow-300">{msg}</p>}</section><section className="card p-4"><h2 className="font-bold mb-2">Centros de custo</h2>{centers.map(c=><p key={c.id} className="border-b border-zinc-800 p-2">{c.name}</p>)}</section><section className="card p-4"><h2 className="font-bold mb-2">Contas bancárias</h2>{accounts.length===0?<p className="text-zinc-400">Cadastre contas em futuras integrações bancárias.</p>:accounts.map(a=><p key={a.id}>{a.account_name}</p>)}</section></div>
}
