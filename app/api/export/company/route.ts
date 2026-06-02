import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

const tables = [
  "companies","app_users","clients","suppliers","stock_items","service_catalog",
  "service_orders","quick_sales","financial_entries","company_branches",
  "stock_transfers","crm_leads","proposals","payment_charges"
];

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const { company_id, user_id } = await req.json();
    if (!company_id) return NextResponse.json({ error: "company_id obrigatório." }, { status: 400 });

    const output:any = {};
    for (const table of tables) {
      try {
        const { data } = await supabaseAdmin.from(table).select("*").eq("company_id", company_id);
        output[table] = data || [];
      } catch {
        output[table] = [];
      }
    }

    const { data: backup, error } = await supabaseAdmin.from("export_backups").insert({
      company_id,
      user_id: user_id || null,
      export_type: "json",
      status: "created",
      tables_included: tables,
      notes: "Backup JSON gerado pelo Fixora ERP."
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ backup_id: backup.id, exported_at: new Date().toISOString(), data: output });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao exportar backup." }, { status: 500 });
  }
}
