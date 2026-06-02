"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {getSession} from "@/lib/session";

export default function AuditPage(){
 const [rows,setRows]=useState<any[]>([]);
 useEffect(()=>{boot()},[]);
 async function boot(){
  const s=getSession(); if(!s){location.href="/login";return;}
  if(s.role!=="Administrador"){location.href="/dashboard";return;}
  const {data}=await supabase.from("audit_logs").select("*").eq("company_id",s.company_id).order("created_at",{ascending:false}).limit(200);
  setRows(data||[]);
 }
 return <div className="space-y-6"><h1 className="text-3xl font-black">Auditoria</h1><section className="card p-4 overflow-x-auto"><table className="w-full"><tbody>{rows.map(r=><tr key={r.id} className="border-b border-zinc-800"><td className="p-2">{new Date(r.created_at).toLocaleString("pt-BR")}</td><td>{r.user_name}</td><td>{r.action}</td><td>{r.entity}</td><td>{r.details}</td></tr>)}</tbody></table></section></div>
}
