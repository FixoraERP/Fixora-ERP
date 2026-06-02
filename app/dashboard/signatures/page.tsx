"use client";
export default function SignaturesHub(){
 return <div className="space-y-6">
  <h1 className="text-3xl font-black">Assinaturas</h1>
  <p className="text-zinc-400">Escolha o tipo de assinatura.</p>
  <div className="grid md:grid-cols-2 gap-4">
    <button className="card p-8 text-left hover:bg-zinc-800" onClick={()=>location.href="/dashboard/signatures/entry"}>
      <h2 className="text-2xl font-bold">Assinatura de Entrada</h2>
      <p className="text-zinc-400">Cliente assina ao deixar o aparelho.</p>
    </button>
    <button className="card p-8 text-left hover:bg-zinc-800" onClick={()=>location.href="/dashboard/signatures/exit"}>
      <h2 className="text-2xl font-bold">Assinatura de Saída</h2>
      <p className="text-zinc-400">Cliente assina ao retirar o aparelho.</p>
    </button>
  </div>
 </div>
}
