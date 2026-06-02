"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {getSession} from "@/lib/session";
import { brl } from "@/lib/utils";
export default function CommissionsPage(){const[s,setS]=useState<any>(null);const[rows,setRows]=useState<any[]>([]);useEffect(()=>{const ss=getSession();if(!ss){location.href="/login";return;}setS(ss);load(ss.company_id)},[]);async function load(cid=s?.company_id){const{data}=await supabase.from("technician_commissions").select("*").eq("company_id",cid).order("created_at",{ascending:false});setRows(data||[])}return <div className="space-y-6"><h1 className="text-3xl font-black">Comissões Técnicos</h1><section className="card p-4">{rows.map(r=><div key={r.id} className="p-2 border-b border-zinc-800">{r.user_name} · {r.os_number} · Base {brl(r.base_value)} · {r.percent}% · Comissão {brl(r.commission_value)} · {r.status}</div>)}</section></div>}
