import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(url, key);

export default async function CustomerPortalPage({ params }: any) {
  const token = params.token;
  const { data } = await supabase.from("customer_portal_tokens").select("*").eq("token", token).single();

  if (!data) {
    return <main className="min-h-screen bg-zinc-950 text-white p-8"><h1 className="text-3xl font-black">Portal indisponível</h1><p>Token inválido ou expirado.</p></main>;
  }

  return <main className="min-h-screen bg-zinc-950 text-white p-8">
    <section className="max-w-2xl mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 p-6">
      <h1 className="text-3xl font-black">Portal do Cliente</h1>
      <p className="text-zinc-400 mt-2">Acompanhe sua ordem de serviço e informações liberadas pela assistência.</p>
      <div className="mt-6 grid gap-2">
        <p><b>Empresa:</b> {data.company_id}</p>
        <p><b>OS:</b> {data.service_order_id || "Não vinculada"}</p>
        <p><b>Status:</b> Portal ativo</p>
      </div>
    </section>
  </main>;
}
