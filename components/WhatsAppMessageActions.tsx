"use client";

import { onlyNumbers } from "@/lib/utils";

type Props = {
  phone?: string | null;
  message: string;
  className?: string;
};

export default function WhatsAppMessageActions({ phone, message, className = "" }: Props) {
  function copyMessage() {
    navigator.clipboard?.writeText(message || "");
    alert("Mensagem copiada.");
  }

  function openWhatsApp() {
    const clean = onlyNumbers(String(phone || ""));
    if (!clean) {
      alert("Informe o WhatsApp/telefone do cliente para enviar.");
      return;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message || "")}`;
    window.open(url, "_blank");
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button type="button" className="btn-secondary" onClick={copyMessage}>Copiar mensagem</button>
      <button type="button" className="btn-primary" onClick={openWhatsApp}>Enviar pelo WhatsApp</button>
    </div>
  );
}
