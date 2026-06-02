export function brl(value: any) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  try { return new Date(value).toLocaleDateString("pt-BR"); } catch { return "-"; }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try { return new Date(value).toLocaleString("pt-BR"); } catch { return "-"; }
}

export function onlyNumbers(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function safeText(value: any) {
  return String(value ?? "").trim();
}

export function stamp() {
  return new Date().toISOString();
}

export function uid(prefix = "fixora") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export function percent(value: any, total: any) {
  const v = Number(value || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.round((v / t) * 100);
}

export function currencyToNumber(value: any) {
  if (typeof value === "number") return value;
  const s = String(value || "").replace(/[^\d,.-]/g, "").replace(".", "").replace(",", ".");
  return Number(s || 0);
}
