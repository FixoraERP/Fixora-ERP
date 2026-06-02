"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
const empty:any={title:"",body:"",channel:"internal",status:"unread",link:""};
export default function NotificationsCenterPage(){
 const[session,setSession]=useState<any>(null);const[rows,setRows]=useState<any[]>([]);const[form,setForm]=useState<any>(empty);const[msg,setMsg]=useState("");
 useEffect(()=>{const s=getSession();if(!s){location.href="/login";return;}setSession(s);load(s.company_id,s.user_id)},[]);
 async function load(cid=session?.company_id,uid=session?.user_id){if(!cid)return;const{data}=await supabase.from("notifications").select("*").eq("company_id",cid).order("created_at",{ascending:false}).limit(100);setRows(data||[])}
 async function create(){if(!session||!form.title)return;const{error}=await supabase.from("notifications").insert({...form,company_id:session.company_id,user_id:session.user_id});if(error)return setMsg(error.message);setForm(empty);load()}
 async function readIt(r:any){await supabase.from("notifications").update({status:"read",read_at:new Date().toISOString()}).eq("id",r.id);load()}
 return <div className="space-y-6"><h1 className="text-3xl font-black">Central de Notificações</h1><section className="card p-4 grid md:grid-cols-3 gap-3"><input placeholder="Título" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input placeholder="Mensagem" value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/><button className="btn-primary" onClick={create}>Criar notificação</button>{msg&&<p className="text-yellow-300">{msg}</p>}</section><section className="card p-4">{rows.map(r=><div key={r.id} className="p-3 border-b border-zinc-800"><b>{r.title}</b><p className="text-zinc-400">{r.body}</p><button className="btn-secondary mt-2" onClick={()=>readIt(r)}>{r.status==="read"?"Lida":"Marcar lida"}</button></div>)}</section></div>
}
