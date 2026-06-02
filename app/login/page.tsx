"use client";

import { useEffect, useState } from "react";
import { setSession } from "@/lib/session";

const fallback:any = {
  system_name: "Fixora ERP",
  system_subtitle: "Gestão SaaS para assistência técnica",
  system_logo_url: "",
  system_banner_url: "",
  login_message: "Acesse sua conta para continuar.",
  footer_text: "Fixora ERP"
};

export default function LoginPage() {
  const [settings, setSettings] = useState<any>(fallback);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setUsername(localStorage.getItem("fixora_last_username") || "");
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/system-settings/public");
      const data = await res.json();
      setSettings({ ...fallback, ...data });
    } catch {
      setSettings(fallback);
    }
  }

  async function login(e:any) {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || "Erro ao entrar.");
      return;
    }

    setSession(data);
    location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white grid md:grid-cols-2">
      <section className="hidden md:flex flex-col justify-between p-10 bg-zinc-900 border-r border-zinc-800">
        <div>
          {settings.system_banner_url ? (
            <img src={settings.system_banner_url} alt="Banner" className="w-full max-h-72 object-cover rounded-3xl mb-8" />
          ) : (
            <div className="w-full h-72 rounded-3xl bg-gradient-to-br from-yellow-500/30 to-zinc-800 mb-8" />
          )}

          <div className="flex items-center gap-4">
            {settings.system_logo_url ? (
              <img src={settings.system_logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-2xl bg-white/5" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center font-black text-3xl">F</div>
            )}
            <div>
              <h1 className="text-4xl font-black">{settings.system_name}</h1>
              <p className="text-zinc-400">{settings.system_subtitle}</p>
            </div>
          </div>
        </div>

        <p className="text-zinc-500">{settings.footer_text}</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={login} className="w-full max-w-md card p-6 space-y-4">
          <div className="text-center mb-6">
            {settings.system_logo_url ? (
              <img src={settings.system_logo_url} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-3" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center font-black text-3xl mx-auto mb-3">F</div>
            )}
            <h1 className="text-3xl font-black">{settings.system_name}</h1>
            <p className="text-zinc-400">{settings.login_message}</p>
          </div>

          <input placeholder="Usuário" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" />
          <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" />

          <button className="btn-primary w-full" type="submit">Entrar</button>

          {msg && <p className="text-red-300 text-sm">{msg}</p>}

          <p className="text-xs text-zinc-500 text-center">
            Master padrão: admin / admin123
          </p>
        </form>
      </section>
    </main>
  );
}
