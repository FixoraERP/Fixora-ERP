"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
const empty:any = { name:"", whatsapp:"", email:"", document:"", zip_code:"", address:"", address_number:"", neighborhood:"", city:"", state:"", notes:"" };
export default function Page() {
  const [s,setS]=useState<any>(null); const [rows,setRows]=useState<any[]>([]); const [form,setForm]=useState<any>(empty); const [id,setId]=useState("");
  useEffect(()=>{const ss=getSession(); if(!ss){location.href="/login";return;} setS(ss); load(ss.company_id);},[]);
  async function load(cid=s?.company_id){ if(!cid)return; const {data}=await supabase.from("suppliers").select("*").eq("company_id",cid).order("created_at",{ascending:false}); setRows(data||[]); }
  async function buscarCep(){ const cep=String(form.zip_code||"").replace(/\D/g,""); if(cep.length!==8)return alert("CEP precisa ter 8 números."); const res=await fetch(`https://viacep.com.br/ws/${cep}/json/`); const data=await res.json(); if(data.erro)return alert("CEP não encontrado."); setForm({...form,zip_code:cep,address:data.logradouro||"",neighborhood:data.bairro||"",city:data.localidade||"",state:data.uf||""}); }
  async function save(){ if(!s)return; if(!form.name)return alert("Informe o nome."); const p={...form,company_id:s.company_id,updated_at:new Date().toISOString()}; const r=id?await supabase.from("suppliers").update(p).eq("id",id):await supabase.from("suppliers").insert(p); if(r.error)return alert(r.error.message); setId(""); setForm(empty); load(); }
  async function del(){ if(!id)return alert("Selecione um registro."); if(!confirm("Excluir?"))return; await supabase.from("suppliers").delete().eq("id",id); setId(""); setForm(empty); load(); }
  return <div className="space-y-6"><h1 className="text-3xl font-black">Fornecedores</h1><section className="card p-4 grid md:grid-cols-3 gap-3">
    <input placeholder="Nome" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/>
    <input placeholder="WhatsApp" value={form.whatsapp||""} onChange={e=>setForm({...form,whatsapp:e.target.value})}/>
    <input placeholder="CPF/CNPJ" value={form.document||""} onChange={e=>setForm({...form,document:e.target.value})}/>
    <input placeholder="E-mail" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/>
    <div className="flex gap-2"><input placeholder="CEP" value={form.zip_code||""} onChange={e=>setForm({...form,zip_code:e.target.value})} className="w-full"/><button type="button" onClick={buscarCep} className="btn-secondary">Buscar</button></div>
    <input placeholder="Número" value={form.address_number||""} onChange={e=>setForm({...form,address_number:e.target.value})}/>
    <input placeholder="Endereço" value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})}/>
    <input placeholder="Bairro" value={form.neighborhood||""} onChange={e=>setForm({...form,neighborhood:e.target.value})}/>
    <input placeholder="Cidade" value={form.city||""} onChange={e=>setForm({...form,city:e.target.value})}/>
    <input placeholder="Estado" value={form.state||""} onChange={e=>setForm({...form,state:e.target.value})}/>
    <input placeholder="Observações" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/>
    <div className="flex gap-2"><button className="btn-primary" onClick={save}>Salvar</button><button className="btn-danger" onClick={del}>Excluir</button></div>
  </section><section className="card p-4 overflow-x-auto"><table className="w-full"><tbody>{rows.map(r=><tr key={r.id} onClick={()=>{setId(r.id);setForm({...empty,...r})}} className="border-b border-zinc-800 cursor-pointer hover:bg-zinc-800"><td className="p-2">{r.name}</td><td>{r.whatsapp}</td><td>{r.city}/{r.state}</td></tr>)}</tbody></table></section></div>
}
