"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {getSession} from "@/lib/session";
export default function LogsPage(){const[rows,setRows]=useState<any[]>([]);useEffect(()=>{const s=getSession();if(!s){location.href="/login";return;}load(s.company_id)},[]);async function load(cid:string){const{data}=await supabase.from("user_action_logs").select("*").eq("company_id",cid).order("created_at",{ascending:false}).limit(300);setRows(data||[])}return <div className="space-y-6"><h1 className="text-3xl font-black">Logs por Funcionário</h1><section className="card p-4 overflow-x-auto"><table className="w-full"><tbody>{rows.map(r=><tr key={r.id} className="border-b border-zinc-800"><td className="p-2">{new Date(r.created_at).toLocaleString("pt-BR")}</td><td>{r.user_name}</td><td>{r.action}</td><td>{r.module}</td><td>{r.details}</td></tr>)}</tbody></table></section></div>}
