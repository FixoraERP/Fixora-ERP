"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl, formatDateTime } from "@/lib/utils";
import WhatsAppMessageActions from "@/components/WhatsAppMessageActions";

const emptyForm: any = {
  os_number: "",
  client_name: "",
  client_whatsapp: "",
  device: "",
  defect: "",
  solution: "",
  status: "Aberta",
  total_value: 0,
  stock_deducted: false
};

export default function ServiceOrdersPage() {
  const [session, setSession] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) {
      location.href = "/login";
      return;
    }
    setSession(s);
    load(s.company_id);
  }, []);

  async function load(companyId = session?.company_id) {
    if (!companyId) return;

    const [{ data: osData }, { data: clientData }] = await Promise.all([
      supabase
        .from("service_orders")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("*")
        .eq("company_id", companyId)
        .order("name")
    ]);

    setOrders(osData || []);
    setClients(clientData || []);
  }

  function setv(key: string, value: any) {
    setForm((old: any) => ({ ...old, [key]: value }));
  }

  function addItem() {
    setItems((old: any[]) => [
      ...old,
      { description: "", quantity: 1, unit_value: 0, total_value: 0, stock_item_id: "" }
    ]);
  }

  function updateItem(index: number, key: string, value: any) {
    setItems((old: any[]) => {
      const copy = [...old];
      const item = { ...copy[index], [key]: value };

      if (key === "quantity" || key === "unit_value") {
        item.total_value = Number(item.quantity || 0) * Number(item.unit_value || 0);
      }

      copy[index] = item;
      return copy;
    });
  }

  function removeItem(index: number) {
    setItems((old: any[]) => old.filter((_, i) => i !== index));
  }

  function getTotal() {
    const itemTotal = items.reduce((sum, item) => sum + Number(item.total_value || 0), 0);
    return itemTotal || Number(form.total_value || 0);
  }

  async function save() {
    if (!session) return;
    setMsg("");

    const payload = {
      company_id: session.company_id,
      client_id: null,
      technician_id: null,
      status: form.status || "Aberta",
      device: form.device || "",
      defect: form.defect || "",
      solution: form.solution || "",
      total_value: getTotal(),
      checklist: {},
      photos: []
    };

    let result;
    if (form.id) {
      result = await supabase.from("service_orders").update(payload).eq("id", form.id);
    } else {
      result = await supabase.from("service_orders").insert(payload);
    }

    if (result.error) {
      setMsg(result.error.message);
      return;
    }

    setMsg("Ordem de serviço salva.");
    setForm(emptyForm);
    setItems([]);
    load();
  }

  async function finishOS() {
    if (!form.id) {
      alert("Salve ou selecione uma OS.");
      return;
    }

    const { error } = await supabase
      .from("service_orders")
      .update({ status: "Finalizada", solution: form.solution || "" })
      .eq("id", form.id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("OS finalizada.");
    load();
  }

  function generateMessage() {
    const total = brl(getTotal());
    const lines = [
      `Olá${form.client_name ? `, ${form.client_name}` : ""}!`,
      "Segue atualização da sua ordem de serviço:",
      form.device ? `Aparelho: ${form.device}` : "",
      form.defect ? `Defeito: ${form.defect}` : "",
      form.status ? `Status: ${form.status}` : "",
      form.solution ? `Solução: ${form.solution}` : "",
      `Valor: ${total}`
    ].filter(Boolean);

    return lines.join("\n");
  }

  function selectOrder(order: any) {
    setForm({
      ...emptyForm,
      ...order,
      os_number: order.os_number || order.id || "",
      client_name: order.client_name || "",
      client_whatsapp: order.client_whatsapp || "",
      total_value: order.total_value || 0
    });
    setItems([]);
  }

  function selectClient(name: string) {
    const client = clients.find((c: any) => c.name === name);
    setForm((old: any) => ({
      ...old,
      client_name: name,
      client_whatsapp: client?.whatsapp || old.client_whatsapp || ""
    }));
  }

  async function removeOrder() {
    if (!form.id) {
      alert("Selecione uma OS.");
      return;
    }

    if (!confirm("Excluir esta OS?")) return;

    const { error } = await supabase.from("service_orders").delete().eq("id", form.id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("OS excluída.");
    setForm(emptyForm);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Ordens de Serviço</h1>
          <p className="text-zinc-400">Cadastro, acompanhamento e comunicação com cliente.</p>
        </div>
        <button className="btn-secondary" onClick={() => { setForm(emptyForm); setItems([]); }}>
          Nova OS
        </button>
      </div>

      <section className="card p-4 grid md:grid-cols-3 gap-3">
        <input
          value={form.os_number || ""}
          onChange={(e) => setv("os_number", e.target.value)}
          placeholder="Nº OS"
        />

        <select
          value={form.client_name || ""}
          onChange={(e) => selectClient(e.target.value)}
        >
          <option value="">Cliente</option>
          {clients.map((client: any) => (
            <option key={client.id} value={client.name}>{client.name}</option>
          ))}
        </select>

        <input
          value={form.client_whatsapp || ""}
          onChange={(e) => setv("client_whatsapp", e.target.value)}
          placeholder="WhatsApp do cliente"
        />

        <input
          value={form.device || ""}
          onChange={(e) => setv("device", e.target.value)}
          placeholder="Aparelho"
        />

        <input
          value={form.defect || ""}
          onChange={(e) => setv("defect", e.target.value)}
          placeholder="Defeito relatado"
        />

        <select
          value={form.status || "Aberta"}
          onChange={(e) => setv("status", e.target.value)}
        >
          <option value="Aberta">Aberta</option>
          <option value="Em análise">Em análise</option>
          <option value="Aguardando peça">Aguardando peça</option>
          <option value="Aprovada">Aprovada</option>
          <option value="Finalizada">Finalizada</option>
          <option value="Entregue">Entregue</option>
          <option value="Cancelada">Cancelada</option>
        </select>

        <textarea
          className="md:col-span-3"
          value={form.solution || ""}
          onChange={(e) => setv("solution", e.target.value)}
          placeholder="Solução / observações"
        />

        <input
          type="number"
          value={form.total_value || 0}
          onChange={(e) => setv("total_value", Number(e.target.value || 0))}
          placeholder="Valor total"
        />

        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={save}>Salvar OS</button>
          <button className="btn-secondary" onClick={finishOS}>Finalizar</button>
          <button className="btn-danger" onClick={removeOrder}>Excluir</button>
        </div>

        {msg && <p className="text-yellow-300 md:col-span-3">{msg}</p>}
      </section>

      <section className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Itens / Peças / Serviços</h2>
          <button className="btn-secondary" onClick={addItem}>Adicionar item</button>
        </div>

        {items.length === 0 && <p className="text-zinc-400">Nenhum item adicionado.</p>}

        {items.map((item: any, index: number) => (
          <div key={index} className="grid md:grid-cols-5 gap-2 border-b border-zinc-800 pb-3">
            <input
              placeholder="Descrição"
              value={item.description || ""}
              onChange={(e) => updateItem(index, "description", e.target.value)}
            />
            <input
              type="number"
              placeholder="Qtd"
              value={item.quantity || 0}
              onChange={(e) => updateItem(index, "quantity", Number(e.target.value || 0))}
            />
            <input
              type="number"
              placeholder="Valor unit."
              value={item.unit_value || 0}
              onChange={(e) => updateItem(index, "unit_value", Number(e.target.value || 0))}
            />
            <input
              type="number"
              placeholder="Total"
              value={item.total_value || 0}
              onChange={(e) => updateItem(index, "total_value", Number(e.target.value || 0))}
            />
            <button className="btn-danger" onClick={() => removeItem(index)}>Remover</button>
          </div>
        ))}

        <p className="font-bold">Total: {brl(getTotal())}</p>
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="text-xl font-bold">Mensagem para WhatsApp</h2>
        <textarea readOnly value={generateMessage()} className="w-full min-h-40" />
        <WhatsAppMessageActions phone={form.client_whatsapp} message={generateMessage()} />
      </section>

      <section className="card p-4 overflow-x-auto">
        <h2 className="text-xl font-bold mb-3">OS cadastradas</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-zinc-400">
              <th>Data</th>
              <th>Aparelho</th>
              <th>Defeito</th>
              <th>Status</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr
                key={order.id}
                onClick={() => selectOrder(order)}
                className="border-b border-zinc-800 cursor-pointer hover:bg-zinc-800"
              >
                <td className="p-2">{formatDateTime(order.created_at)}</td>
                <td>{order.device}</td>
                <td>{order.defect}</td>
                <td>{order.status}</td>
                <td>{brl(order.total_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
