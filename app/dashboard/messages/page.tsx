"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {getSession} from "@/lib/session";
import { brl } from "@/lib/utils";
const empty:any={title:"",message:""};
export default function MessagesPage(){
 const [s,setS]=useState<any>(null);const [rows,setRows]=useState<any[]>([]);const [orders,setOrders]=useState<any[]>([]);const [form,setForm]=useState<any>(empty);const [id,setId]=useState("");
 useEffect(()=>{boot()},[]);
 async function boot(){const ss=getSession();if(!ss){location.href="/login";return;}setS(ss);const [{data:t},{data:o}]=await Promise.all([supabase.from("message_templates").select("*").eq("company_id",ss.company_id),supabase.from("service_orders").select("*").eq("company_id",ss.company_id)]);setRows(t||[]);setOrders(o||[])}
 async function save(){if(!s||!form.title||!form.message)return;const payload={...form,company_id:s.company_id};const r=id?await supabase.from("message_templates").update(payload).eq("id",id):await supabase.from("message_templates").insert(payload);if(r.error)return alert(r.error.message);setForm(empty);setId("");boot()}
 function send(os:any,msg:any){let text=msg.message.replace("{cliente}",os.client_name||"").replace("{os}",os.os_number||"").replace("{valor}",brl(os.total_value||0));window.open("#","_blank")}
 return <div className="space-y-6"><h1 className="text-3xl font-black">Mensagens WhatsApp</h1><section className="card p-4 grid md:grid-cols-2 gap-3"><input placeholder="Título" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input placeholder="Mensagem" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button className="btn-primary" onClick={save}>Salvar modelo</button></section><section className="card p-4">{rows.map(r=><div key={r.id} onClick={()=>{setId(r.id);setForm(r)}} className="p-2 border-b border-zinc-800"><b>{r.title}</b> - {r.message}</div>)}</section><section className="card p-4"><h2 className="font-bold mb-2">Enviar modelo para OS</h2>{orders.slice(0,20).map(os=><div key={os.id} className="p-2 border-b border-zinc-800">{os.os_number} - {os.client_name} {rows.map(r=><button key={r.id} className="btn-secondary ml-2" onClick={()=>send(os,r)}>{r.title}</button>)}</div>)}</section></div>
}
