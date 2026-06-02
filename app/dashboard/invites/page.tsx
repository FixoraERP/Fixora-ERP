"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {getSession} from "@/lib/session";
import {roles} from "@/lib/staff";

export default function InvitesPage(){
 const [s,setS]=useState<any>(null);const[rows,setRows]=useState<any[]>([]);const[form,setForm]=useState({full_name:"",username:"",role:"Atendente"});
 useEffect(()=>{const ss=getSession();if(!ss){location.href="/login";return;}setS(ss);load(ss.company_id)},[]);
 async function load(cid=s?.company_id){const{data}=await supabase.from("user_invites").select("*").eq("company_id",cid).order("created_at",{ascending:false});setRows(data||[])}
 async function invite(){if(!s||!form.full_name||!form.username)return alert("Preencha nome e usuário.");const{error}=await supabase.from("user_invites").insert({...form,company_id:s.company_id,invited_by:s.user_id});if(error)return alert(error.message);setForm({full_name:"",username:"",role:"Atendente"});load();}
 return <div className="space-y-6"><h1 className="text-3xl font-black">Convites de Funcionários</h1><section className="card p-4 grid md:grid-cols-3 gap-3"><input placeholder="Nome" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/><input placeholder="Usuário desejado" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{roles.map(r=><option key={r}>{r}</option>)}</select><button className="btn-primary" onClick={invite}>Gerar convite</button></section><section className="card p-4">{rows.map(r=><div key={r.id} className="p-2 border-b border-zinc-800">{r.full_name} · {r.username} · {r.role} · {r.status} · Token: {r.invite_token}</div>)}</section></div>
}
