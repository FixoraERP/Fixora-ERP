"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";
import { normalizeStockRow, stockImportTemplateHeaders } from "@/lib/stockImport";

const empty:any = { name:"", category:"", supplier_id:"", supplier_name:"", quantity:0, cost:0, sale_price:0, notes:"", image_url:"", sku:"", barcode:"", min_quantity:0, brand:"", compatible_model:"" };

export default function Stock() {
  const [s,setS]=useState<any>(null);
  const [rows,setRows]=useState<any[]>([]);
  const [suppliers,setSuppliers]=useState<any[]>([]);
  const [imports,setImports]=useState<any[]>([]);
  const [form,setForm]=useState<any>(empty);
  const [id,setId]=useState("");
  const [preview,setPreview]=useState<any[]>([]);
  const [fileName,setFileName]=useState("");
  const [mode,setMode]=useState("upsert");

  useEffect(()=>{const ss=getSession(); if(!ss){location.href="/login";return;} setS(ss); load(ss.company_id); loadSuppliers(ss.company_id); loadImports(ss.company_id);},[]);

  async function load(cid=s?.company_id){if(!cid)return; const {data}=await supabase.from("stock_items").select("*").eq("company_id",cid).order("name"); setRows(data||[]);}
  async function loadSuppliers(cid=s?.company_id){if(!cid)return; const {data}=await supabase.from("suppliers").select("*").eq("company_id",cid).order("name"); setSuppliers(data||[]);}
  async function loadImports(cid=s?.company_id){if(!cid)return; const {data}=await supabase.from("stock_import_batches").select("*").eq("company_id",cid).order("created_at",{ascending:false}).limit(10); setImports(data||[]);}
  function chooseSupplier(v:string){const sup=suppliers.find(x=>x.id===v); setForm({...form,supplier_id:v,supplier_name:sup?.name||""});}

  async function uploadImage(file:File){if(!s)return; const path=`${s.company_id}/produtos/${Date.now()}-${file.name}`; const up=await supabase.storage.from("app-assets").upload(path,file,{upsert:true}); if(up.error)return alert(up.error.message); const {data}=supabase.storage.from("app-assets").getPublicUrl(path); setForm({...form,image_url:data.publicUrl});}

  async function save(){if(!s)return; if(!form.name)return alert("Nome obrigatório."); const p={...form,company_id:s.company_id,updated_at:new Date().toISOString()}; const r=id?await supabase.from("stock_items").update(p).eq("id",id):await supabase.from("stock_items").insert(p); if(r.error)return alert(r.error.message); setId(""); setForm(empty); load();}
  async function del(){if(!id)return alert("Selecione uma peça/produto."); if(!confirm("Excluir peça/produto?"))return; await supabase.from("stock_items").delete().eq("id",id); setId(""); setForm(empty); load();}

  async function parseFile(file:File){setFileName(file.name); const data=await file.arrayBuffer(); const wb=XLSX.read(data,{type:"array"}); const ws=wb.Sheets[wb.SheetNames[0]]; const json:any[]=XLSX.utils.sheet_to_json(ws,{defval:""}); setPreview(json.map(normalizeStockRow).filter(x=>x.name));}
  function downloadTemplate(){const ws=XLSX.utils.aoa_to_sheet([stockImportTemplateHeaders,["Tela Samsung A10","Display",5,45,90,"Fornecedor X","Original","TELA-A10","7890000000000",2,"Samsung","A10",""],["Bateria iPhone 7","Bateria",3,50,120,"Fornecedor Y","Premium","BAT-IP7","",1,"Apple","iPhone 7",""]]); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Estoque"); XLSX.writeFile(wb,"modelo_importacao_estoque_fixora.xlsx");}
  async function confirmImport(){if(!s)return; if(!preview.length)return alert("Nenhum item para importar."); const res=await fetch("/api/stock/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({company_id:s.company_id,user_id:s.user_id,user_name:s.full_name,filename:fileName,rows:preview,mode})}); const data=await res.json(); if(!res.ok)return alert(data.error||"Erro ao importar."); alert(`Importação concluída. Inseridos: ${data.inserted}, atualizados: ${data.updated}, ignorados: ${data.skipped}`); setPreview([]); setFileName(""); load(); loadImports();}

  return <div className="space-y-6">
    <h1 className="text-3xl font-black">Estoque</h1>

    <section className="card p-4">
      <h2 className="text-xl font-bold mb-3">Importar Excel / CSV</h2>
      <p className="text-zinc-400 mb-3">Importe peças automaticamente. Atualiza por SKU, código de barras ou nome.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="btn-secondary" onClick={downloadTemplate}>Baixar modelo Excel</button>
        <select value={mode} onChange={e=>setMode(e.target.value)}><option value="upsert">Inserir e atualizar existentes</option><option value="insert_only">Apenas inserir novos</option></select>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={e=>e.target.files?.[0]&&parseFile(e.target.files[0])}/>
        <button className="btn-primary" onClick={confirmImport}>Confirmar importação</button>
      </div>
      {preview.length>0&&<div className="overflow-x-auto"><h3 className="font-bold mb-2">Prévia: {fileName} ({preview.length} itens)</h3><table className="w-full text-sm"><thead><tr className="text-left text-zinc-400"><th>Nome</th><th>Categoria</th><th>Qtd</th><th>Custo</th><th>Venda</th><th>Fornecedor</th><th>SKU</th><th>Cód. Barras</th></tr></thead><tbody>{preview.slice(0,20).map((p,i)=><tr key={i} className="border-b border-zinc-800"><td>{p.name}</td><td>{p.category}</td><td>{p.quantity}</td><td>{brl(p.cost)}</td><td>{brl(p.sale_price)}</td><td>{p.supplier_name}</td><td>{p.sku}</td><td>{p.barcode}</td></tr>)}</tbody></table></div>}
      {imports.length>0&&<div className="mt-4"><h3 className="font-bold mb-2">Últimas importações</h3>{imports.map(i=><p key={i.id} className="text-sm text-zinc-400">{new Date(i.created_at).toLocaleString("pt-BR")} · {i.filename} · inseridos {i.inserted_count} · atualizados {i.updated_count} · ignorados {i.skipped_count}</p>)}</div>}
    </section>

    <section className="card p-4 grid md:grid-cols-3 gap-3">
      <input placeholder="Nome da peça/produto" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input placeholder="Categoria" value={form.category||""} onChange={e=>setForm({...form,category:e.target.value})}/>
      <select value={form.supplier_id||""} onChange={e=>chooseSupplier(e.target.value)}><option value="">Fornecedor</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <input placeholder="SKU / Código interno" value={form.sku||""} onChange={e=>setForm({...form,sku:e.target.value})}/>
      <input placeholder="Código de barras" value={form.barcode||""} onChange={e=>setForm({...form,barcode:e.target.value})}/>
      <input placeholder="Marca" value={form.brand||""} onChange={e=>setForm({...form,brand:e.target.value})}/>
      <input placeholder="Modelo compatível" value={form.compatible_model||""} onChange={e=>setForm({...form,compatible_model:e.target.value})}/>
      <input type="number" placeholder="Quantidade" value={form.quantity||0} onChange={e=>setForm({...form,quantity:e.target.value})}/>
      <input type="number" placeholder="Estoque mínimo" value={form.min_quantity||0} onChange={e=>setForm({...form,min_quantity:e.target.value})}/>
      <input type="number" placeholder="Custo" value={form.cost||0} onChange={e=>setForm({...form,cost:e.target.value})}/>
      <input type="number" placeholder="Venda" value={form.sale_price||0} onChange={e=>setForm({...form,sale_price:e.target.value})}/>
      <input placeholder="Observações" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/>
      <label className="space-y-2"><span className="text-sm text-zinc-400">Imagem do produto/peça</span><input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&uploadImage(e.target.files[0])}/></label>
      {form.image_url&&<img src={form.image_url} alt="Produto" className="h-24 w-24 rounded-xl object-cover bg-zinc-800"/>}
      <div className="flex gap-2 md:col-span-3"><button className="btn-primary" onClick={save}>{id?"Salvar edição":"Cadastrar"}</button><button className="btn-danger" onClick={del}>Excluir</button><button className="btn-secondary" onClick={()=>{setId("");setForm(empty)}}>Limpar</button></div>
    </section>

    <section className="card p-4 overflow-x-auto">
      <table className="w-full"><thead><tr className="text-left text-zinc-400"><th>Imagem</th><th>Produto/Peça</th><th>SKU</th><th>Cód. Barras</th><th>Fornecedor</th><th>Qtd</th><th>Mín.</th><th>Venda</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} onClick={()=>{setId(r.id);setForm({...empty,...r})}} className={`border-b border-zinc-800 cursor-pointer hover:bg-zinc-800 ${Number(r.quantity||0)<=Number(r.min_quantity||0)?"text-yellow-300":""}`}><td className="p-2">{r.image_url?<img src={r.image_url} className="h-12 w-12 rounded-lg object-cover" alt="Produto"/>:"-"}</td><td>{r.name}</td><td>{r.sku||"-"}</td><td>{r.barcode||"-"}</td><td>{r.supplier_name||"-"}</td><td>{r.quantity}</td><td>{r.min_quantity||0}</td><td>{brl(r.sale_price)}</td></tr>)}</tbody></table>
    </section>
  </div>
}
