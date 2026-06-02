"use client";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/session";

export default function SmartImportPage() {
  const [session,setSession]=useState<any>(null);
  const [rows,setRows]=useState<any[]>([]);
  const [msg,setMsg]=useState("");
  const [mode,setMode]=useState("upsert");

  useEffect(()=>{const s=getSession(); if(!s){location.href="/login";return;} setSession(s);},[]);

  async function onFile(e:any) {
    const file = e.target.files?.[0];
    if(!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json:any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    setRows(json);
    setMsg(`${json.length} linhas carregadas para prévia.`);
  }

  async function send() {
    if(!session) return;
    const res = await fetch("/api/import/smart", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({company_id:session.company_id,user_id:session.user_id,target_module:"stock",filename:"importacao.xlsx",rows,mode})
    });
    const data = await res.json();
    if(!res.ok) return setMsg(data.error || "Erro na importação.");
    setMsg(`Importado: ${data.imported}, atualizado: ${data.updated}, ignorado: ${data.skipped}`);
  }

  function model() {
    const sample = [{nome:"Tela Samsung A10",categoria:"Display",quantidade:5,custo:45,venda:90,sku:"TELA-A10",codigo_barras:"",marca:"Samsung",modelo:"A10"}];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Estoque");
    XLSX.writeFile(wb, "modelo_importacao_estoque_fixora.xlsx");
  }

  return <div className="space-y-6">
    <h1 className="text-3xl font-black">Importador Inteligente</h1>
    <p className="text-zinc-400">Importe produtos/peças por Excel ou CSV com atualização por SKU/código de barras.</p>
    <section className="card p-4 grid md:grid-cols-3 gap-3">
      <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile}/>
      <select value={mode} onChange={e=>setMode(e.target.value)}><option value="upsert">Inserir e atualizar</option><option value="insert_only">Apenas inserir novos</option></select>
      <button className="btn-secondary" onClick={model}>Baixar modelo</button>
      <button className="btn-primary" onClick={send} disabled={rows.length===0}>Importar agora</button>
      {msg&&<p className="text-yellow-300 md:col-span-3">{msg}</p>}
    </section>
    <section className="card p-4 overflow-x-auto">
      <h2 className="font-bold mb-3">Prévia</h2>
      <table className="w-full"><tbody>{rows.slice(0,20).map((r,i)=><tr key={i} className="border-b border-zinc-800"><td className="p-2">{JSON.stringify(r)}</td></tr>)}</tbody></table>
    </section>
  </div>
}
