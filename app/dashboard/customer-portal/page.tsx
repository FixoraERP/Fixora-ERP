"use client";
import {useState} from "react";
import {supabase} from "@/lib/supabase";
import { brl } from "@/lib/utils";
export default function Portal(){
 const [osNumber,setOsNumber]=useState("");const [row,setRow]=useState<any>(null);
 async function search(){const {data,error}=await supabase.from("service_orders").select("*").eq("os_number",osNumber).single();if(error)return alert("OS não encontrada.");setRow(data)}
 return <div className="space-y-6"><h1 className="text-3xl font-black">Portal Cliente / Consulta OS</h1><section className="card p-4 flex gap-2"><input placeholder="Número da OS" value={osNumber} onChange={e=>setOsNumber(e.target.value)}/><button className="btn-primary" onClick={search}>Consultar</button></section>{row&&<section className="card p-4"><h2 className="text-2xl font-bold">{row.os_number}</h2><p>Cliente: {row.client_name}</p><p>Status: {row.status}</p><p>Serviço: {row.service_name||row.service_done}</p><p>Total: {brl(row.total_value)}</p></section>}</div>
}
