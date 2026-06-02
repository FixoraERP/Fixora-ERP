"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/utils";

const empty:any = {
  name: "",
  category: "",
  default_value: 0,
  warranty: "",
  notes: "",
  image_url: "",
  active: true
};

export default function ServicesPage() {
  const [s, setS] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [id, setId] = useState("");

  useEffect(() => {
    const ss = getSession();
    if (!ss) { location.href = "/login"; return; }
    setS(ss);
    load(ss.company_id);
  }, []);

  async function load(cid = s?.company_id) {
    if (!cid) return;
    const { data } = await supabase
      .from("service_catalog")
      .select("*")
      .eq("company_id", cid)
      .order("name");
    setRows(data || []);
  }

  async function uploadImage(file: File) {
    if (!s || !file) return;
    const path = `${s.company_id}/servicos/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("app-assets").upload(path, file, { upsert: true });
    if (up.error) return alert(up.error.message);
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    setForm({ ...form, image_url: data.publicUrl });
  }

  async function save() {
    if (!s) return;
    if (!form.name) return alert("Informe o nome do serviço.");

    const payload = {
      ...form,
      company_id: s.company_id,
      updated_at: new Date().toISOString()
    };

    const r = id
      ? await supabase.from("service_catalog").update(payload).eq("id", id)
      : await supabase.from("service_catalog").insert(payload);

    if (r.error) return alert(r.error.message);

    setId("");
    setForm(empty);
    load();
  }

  async function del() {
    if (!id) return alert("Selecione um serviço.");
    if (!confirm("Excluir serviço?")) return;
    const { error } = await supabase.from("service_catalog").delete().eq("id", id);
    if (error) return alert(error.message);
    setId("");
    setForm(empty);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Serviços / Mão de Obra</h1>
      <p className="text-zinc-400">Cadastre serviços, valores, garantia e imagem do serviço.</p>

      <section className="card p-4 grid md:grid-cols-3 gap-3">
        <input placeholder="Nome do serviço" value={form.name || ""} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input placeholder="Categoria" value={form.category || ""} onChange={e=>setForm({...form, category:e.target.value})}/>
        <input type="number" placeholder="Valor padrão" value={form.default_value || 0} onChange={e=>setForm({...form, default_value:e.target.value})}/>
        <input placeholder="Garantia" value={form.warranty || ""} onChange={e=>setForm({...form, warranty:e.target.value})}/>
        <input placeholder="Observações" value={form.notes || ""} onChange={e=>setForm({...form, notes:e.target.value})}/>
        <label className="flex gap-2 items-center">
          <input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active:e.target.checked})}/>
          Ativo
        </label>

        <label className="md:col-span-2 space-y-2">
          <span className="text-sm text-zinc-400">Imagem do serviço</span>
          <input type="file" accept="image/*" onChange={e=>e.target.files?.[0] && uploadImage(e.target.files[0])}/>
        </label>

        {form.image_url && (
          <img src={form.image_url} alt="Serviço" className="h-24 w-24 rounded-xl object-cover bg-zinc-800"/>
        )}

        <div className="flex gap-2 md:col-span-3">
          <button onClick={save} className="btn-primary">{id ? "Salvar edição" : "Cadastrar serviço"}</button>
          <button onClick={del} className="btn-danger">Excluir</button>
          <button onClick={()=>{setId("");setForm(empty)}} className="btn-secondary">Limpar</button>
        </div>
      </section>

      <section className="card p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-zinc-400">
              <th>Imagem</th><th>Serviço</th><th>Categoria</th><th>Valor</th><th>Garantia</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} onClick={()=>{setId(r.id);setForm({...empty,...r})}} className="border-b border-zinc-800 cursor-pointer hover:bg-zinc-800">
                <td className="p-2">{r.image_url ? <img src={r.image_url} className="h-12 w-12 rounded-lg object-cover" alt="Serviço"/> : "-"}</td>
                <td>{r.name}</td>
                <td>{r.category}</td>
                <td>{brl(r.default_value)}</td>
                <td>{r.warranty}</td>
                <td>{r.active ? "Ativo" : "Inativo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
