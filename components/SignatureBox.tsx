"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignatureBox({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const ref = useRef<SignatureCanvas>(null);

  function save() {
    if (!ref.current) return;
    onChange(ref.current.toDataURL("image/png"));
  }

  function clear() {
    ref.current?.clear();
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl overflow-hidden">
        <SignatureCanvas ref={ref} canvasProps={{ width: 500, height: 180, className: "w-full h-44" }} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={save} className="btn-primary">Salvar assinatura</button>
        <button type="button" onClick={clear} className="btn-secondary">Limpar</button>
      </div>
      {value && <img src={value} className="h-16 bg-white rounded-lg" alt="Assinatura salva" />}
    </div>
  );
}
