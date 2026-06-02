"use client";
import SignatureBox from "@/components/SignatureBox";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export default function SignaturePage(){
 const [orders,setOrders]=useState<any[]>([]);
 const [selected,setSelected]=useState<any>(null);
 const [sig,setSig]=useState("");
 const field = "exit_signature";
 const title = "Assinatura de Saída";

 useEffect(()=>{boot()},[]);

 async function boot(){
  const s=getSession();
  if(!s){location.href="/login";return;}
  const {data}=await supabase.from("service_orders").select("*").eq("company_id",s.company_id).order("created_at",{ascending:false});
  setOrders(data||[]);
 }

 async function choose(id:string){
  const os=orders.find(x=>x.id===id);
  setSelected(os);
  setSig(os?.[field] || "");
 }

 async function save(){
  if(!selected)return alert("Selecione uma OS.");
  const {error}=await supabase.from("service_orders").update({[field]:sig,updated_at:new Date().toISOString()}).eq("id",selected.id);
  if(error)return alert(error.message);
  alert(title+" salva.");
  location.href="/dashboard/os";
 }

 return <div className="space-y-6">
  <h1 className="text-3xl font-black">{title}</h1>
  <section className="card p-4">
   <select className="w-full" value={selected?.id||""} onChange={e=>choose(e.target.value)}>
    <option value="">Selecione a OS</option>
    {orders.map(o=><option key={o.id} value={o.id}>{o.os_number} - {o.client_name}</option>)}
   </select>
  </section>
  {selected && <section className="card p-4">
   <SignatureBox value={sig} onChange={setSig}/>
   <div className="flex gap-2 mt-4">
    <button onClick={save} className="btn-primary">Salvar e voltar</button>
    <button onClick={()=>location.href="/dashboard/os"} className="btn-secondary">Voltar</button>
   </div>
  </section>}
 </div>
}
