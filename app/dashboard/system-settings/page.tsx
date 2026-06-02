"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000999";

const empty:any = {
  system_name: "Fixora ERP",
  system_subtitle: "Gestão SaaS para assistência técnica",
  system_logo_url: "",
  system_banner_url: "",
  system_icon_url: "",
  system_favicon_url: "",
  primary_color: "#f59e0b",
  support_whatsapp: "",
  support_email: "",
  login_message: "Acesse sua conta para continuar.",
  footer_text: "Fixora ERP",
  allow_company_login_branding: false
};

export default function SystemSettingsPage() {
  const [form, setForm] = useState<any>(empty);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) {
      location.href = "/login";
      return;
    }
    if (!s.master_admin) {
      location.href = "/dashboard";
      return;
    }
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .single();

    if (data) setForm({ ...empty, ...data });
  }

  async function save() {
    setMsg("");

    const payload = {
      id: SETTINGS_ID,
      ...form,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("system_settings")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Configurações globais salvas.");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Configurações do Sistema</h1>
      <p className="text-zinc-400">
        Esta tela altera a identidade global do Fixora ERP. Apenas o Master Admin acessa.
        As empresas continuam alterando seus próprios dados em Minha Empresa.
      </p>

      <section className="card p-4 grid md:grid-cols-3 gap-3">
        <input placeholder="Nome do sistema" value={form.system_name || ""} onChange={e=>setForm({...form, system_name:e.target.value})}/>
        <input placeholder="Subtítulo" value={form.system_subtitle || ""} onChange={e=>setForm({...form, system_subtitle:e.target.value})}/>
        <input placeholder="Cor principal #f59e0b" value={form.primary_color || ""} onChange={e=>setForm({...form, primary_color:e.target.value})}/>

        <input placeholder="URL da logo global" value={form.system_logo_url || ""} onChange={e=>setForm({...form, system_logo_url:e.target.value})}/>
        <input placeholder="URL do banner global" value={form.system_banner_url || ""} onChange={e=>setForm({...form, system_banner_url:e.target.value})}/>
        <input placeholder="URL do ícone global" value={form.system_icon_url || ""} onChange={e=>setForm({...form, system_icon_url:e.target.value})}/>

        <input placeholder="URL do favicon" value={form.system_favicon_url || ""} onChange={e=>setForm({...form, system_favicon_url:e.target.value})}/>
        <input placeholder="WhatsApp suporte" value={form.support_whatsapp || ""} onChange={e=>setForm({...form, support_whatsapp:e.target.value})}/>
        <input placeholder="E-mail suporte" value={form.support_email || ""} onChange={e=>setForm({...form, support_email:e.target.value})}/>

        <input placeholder="Mensagem do login" value={form.login_message || ""} onChange={e=>setForm({...form, login_message:e.target.value})}/>
        <input placeholder="Rodapé" value={form.footer_text || ""} onChange={e=>setForm({...form, footer_text:e.target.value})}/>

        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={!!form.allow_company_login_branding}
            onChange={e=>setForm({...form, allow_company_login_branding:e.target.checked})}
          />
          Permitir marca da empresa no login quando houver identificação
        </label>

        <div className="md:col-span-3 flex gap-2">
          <button className="btn-primary" onClick={save}>Salvar configurações globais</button>
        </div>

        {msg && <p className="text-yellow-300 md:col-span-3">{msg}</p>}
      </section>

      <section className="card p-4">
        <h2 className="font-bold mb-3">Prévia</h2>
        <div className="rounded-3xl border border-zinc-800 p-6 bg-zinc-950">
          {form.system_banner_url && <img src={form.system_banner_url} alt="Banner" className="w-full max-h-48 object-cover rounded-2xl mb-4" />}
          <div className="flex items-center gap-3">
            {form.system_logo_url ? <img src={form.system_logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white/5" /> : <div className="w-16 h-16 rounded-xl bg-brand-500 flex items-center justify-center font-black">F</div>}
            <div>
              <h3 className="text-2xl font-black">{form.system_name}</h3>
              <p className="text-zinc-400">{form.system_subtitle}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
