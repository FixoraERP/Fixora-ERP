"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { brl, formatDateTime } from "@/lib/utils";

type SaleItem = {
  stock_item_id: string;
  description: string;
  quantity: number;
  unit_value: number;
  total_value: number;
};

const emptyItem: SaleItem = {
  stock_item_id: "",
  description: "",
  quantity: 1,
  unit_value: 0,
  total_value: 0
};

export default function SalesPage() {
  const [session, setSession] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<SaleItem[]>([{ ...emptyItem }]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) {
      location.href = "/login";
      return;
    }
    setSession(s);
    loadData(s.company_id);
  }, []);

  async function loadData(companyId?: string) {
    if (!companyId) return;

    const [{ data: stockData }, { data: salesData }] = await Promise.all([
      supabase.from("stock_items").select("*").eq("company_id", companyId).order("name"),
      supabase.from("quick_sales").select("*").eq("company_id", companyId).order("created_at", { ascending: false })
    ]);

    setStock(stockData || []);
    setSales(salesData || []);
  }

  function addItem() {
    setItems((old) => [...old, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((old) => old.filter((_, i) => i !== index));
  }

  function choose(index: number, id: string) {
    const selected = stock.find((x: any) => String(x.id) === String(id));

    setItems((old) => {
      const copy = [...old];
      const previous = copy[index] || { ...emptyItem };
      const quantity = Number(previous.quantity || 1);
      const unitValue = Number(selected?.sale_price || selected?.price || previous.unit_value || 0);

      copy[index] = {
        ...previous,
        stock_item_id: id,
        description: selected?.name || previous.description || "",
        quantity,
        unit_value: unitValue,
        total_value: quantity * unitValue
      };

      return copy;
    });
  }

  function updateItem(index: number, key: keyof SaleItem, value: any) {
    setItems((old) => {
      const copy = [...old];
      const item = { ...(copy[index] || emptyItem), [key]: value } as SaleItem;

      if (key === "quantity" || key === "unit_value") {
        item.quantity = Number(item.quantity || 0);
        item.unit_value = Number(item.unit_value || 0);
        item.total_value = item.quantity * item.unit_value;
      }

      copy[index] = item;
      return copy;
    });
  }

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total_value || 0), 0);
  }, [items]);

  async function finish() {
    if (!session || !items.length) return;
    setMsg("");

    const validItems = items.filter((item) => item.description || item.stock_item_id);
    if (!validItems.length) {
      setMsg("Adicione pelo menos um item.");
      return;
    }

    const { error } = await supabase.from("quick_sales").insert({
      company_id: session.company_id,
      total_value: total,
      items: validItems,
      created_at: new Date().toISOString()
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    for (const item of validItems) {
      if (item.stock_item_id) {
        const current = stock.find((x: any) => String(x.id) === String(item.stock_item_id));
        if (current) {
          const newQty = Number(current.quantity || 0) - Number(item.quantity || 0);
          await supabase.from("stock_items").update({ quantity: newQty }).eq("id", item.stock_item_id);
        }
      }
    }

    setMsg("Venda registrada.");
    setItems([{ ...emptyItem }]);
    loadData(session.company_id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Vendas Rápidas</h1>
          <p className="text-zinc-400">Venda simples com baixa opcional de estoque.</p>
        </div>
        <button className="btn-secondary" onClick={() => setItems([{ ...emptyItem }])}>Nova venda</button>
      </div>

      <section className="card p-4 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid md:grid-cols-6 gap-2 border-b border-zinc-800 pb-3">
            <select value={item.stock_item_id} onChange={(e) => choose(index, e.target.value)}>
              <option value="">Produto do estoque</option>
              {stock.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} - Estoque: {s.quantity ?? 0}</option>
              ))}
            </select>
            <input className="md:col-span-2" placeholder="Descrição" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
            <input type="number" placeholder="Qtd" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value || 0))} />
            <input type="number" placeholder="Valor" value={item.unit_value} onChange={(e) => updateItem(index, "unit_value", Number(e.target.value || 0))} />
            <button className="btn-danger" onClick={() => removeItem(index)}>Remover</button>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" onClick={addItem}>Adicionar item</button>
          <button className="btn-primary" onClick={finish}>Finalizar venda</button>
          <strong>Total: {brl(total)}</strong>
        </div>
        {msg && <p className="text-yellow-300">{msg}</p>}
      </section>

      <section className="card p-4 overflow-x-auto">
        <h2 className="text-xl font-bold mb-3">Últimas vendas</h2>
        <table className="w-full">
          <thead><tr className="text-left text-zinc-400"><th>Data</th><th>Total</th></tr></thead>
          <tbody>
            {sales.map((sale: any) => (
              <tr key={sale.id} className="border-b border-zinc-800">
                <td className="p-2">{formatDateTime(sale.created_at)}</td>
                <td>{brl(sale.total_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <p className="text-zinc-400 mt-3">Nenhuma venda registrada.</p>}
      </section>
    </div>
  );
}
