"use client";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";

export default function BackupPage(){
 const[session,setSession]=useState<any>(null);const[msg,setMsg]=useState("");const[backup,setBackup]=useState<any>(null);
 useEffect(()=>{const s=getSession();if(!s){location.href="/login";return;}if(!(s.master_admin||s.company_admin||s.role==="Administrador")){location.href="/dashboard";return;}setSession(s)},[]);
 async function exportData(){if(!session)return;const res=await fetch("/api/export/company",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({company_id:session.company_id,user_id:session.user_id})});const data=await res.json();if(!res.ok)return setMsg(data.error||"Erro.");setBackup(data);setMsg("Backup gerado em JSON.");}
 function download(){if(!backup)return;const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="backup_fixora_erp.json";a.click();URL.revokeObjectURL(url);}
 return <div className="space-y-6"><h1 className="text-3xl font-black">Backup / Exportação</h1><p className="text-zinc-400">Exporte dados principais da empresa em JSON.</p><section className="card p-4 flex gap-2"><button className="btn-primary" onClick={exportData}>Gerar Backup</button><button className="btn-secondary" onClick={download} disabled={!backup}>Baixar JSON</button>{msg&&<p className="text-yellow-300">{msg}</p>}</section></div>
}
