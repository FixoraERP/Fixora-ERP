"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
export default function SecurityAdvancedPage(){
 const[session,setSession]=useState<any>(null);const[logs,setLogs]=useState<any[]>([]);useEffect(()=>{const s=getSession();if(!s){location.href="/login";return;}if(!(s.master_admin||s.company_admin||s.role==="Administrador")){location.href="/dashboard";return;}setSession(s);load(s.company_id)},[]);
 async function load(cid:string){const{data}=await supabase.from("user_action_logs").select("*").eq("company_id",cid).order("created_at",{ascending:false}).limit(200);setLogs(data||[])}
 return <div className="space-y-6"><h1 className="text-3xl font-black">Segurança e Auditoria</h1><p className="text-zinc-400">Logs de ações, recuperação de senha e 2FA estrutural.</p><section className="card p-4 overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-zinc-400"><th>Ação</th><th>Módulo</th><th>Data</th></tr></thead><tbody>{logs.map(l=><tr key={l.id} className="border-b border-zinc-800"><td className="p-2">{l.action}</td><td>{l.module}</td><td>{new Date(l.created_at).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></section></div>
}
