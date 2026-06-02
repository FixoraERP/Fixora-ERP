import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const body = await req.json();
    const { company_id, user_id, user_name, filename, rows, mode } = body;

    if (!company_id || !Array.isArray(rows)) {
      return NextResponse.json({ error: "company_id e rows são obrigatórios." }, { status: 400 });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const raw of rows) {
      const name = String(raw.name || "").trim();
      if (!name) { skipped++; continue; }

      const sku = String(raw.sku || "").trim();
      const barcode = String(raw.barcode || "").trim();
      let existing:any = null;

      if (sku) {
        const { data } = await supabaseAdmin.from("stock_items").select("*").eq("company_id", company_id).eq("sku", sku).limit(1).single();
        existing = data;
      }
      if (!existing && barcode) {
        const { data } = await supabaseAdmin.from("stock_items").select("*").eq("company_id", company_id).eq("barcode", barcode).limit(1).single();
        existing = data;
      }
      if (!existing) {
        const { data } = await supabaseAdmin.from("stock_items").select("*").eq("company_id", company_id).ilike("name", name).limit(1).single();
        existing = data;
      }

      const payload:any = {
        company_id,
        name,
        category: raw.category || "",
        quantity: Number(raw.quantity || 0),
        cost: Number(raw.cost || 0),
        sale_price: Number(raw.sale_price || 0),
        supplier_name: raw.supplier_name || "",
        notes: raw.notes || "",
        image_url: raw.image_url || "",
        sku,
        barcode,
        min_quantity: Number(raw.min_quantity || 0),
        brand: raw.brand || "",
        compatible_model: raw.compatible_model || "",
        updated_at: new Date().toISOString()
      };

      if (existing?.id && mode !== "insert_only") {
        const { error } = await supabaseAdmin.from("stock_items").update(payload).eq("id", existing.id);
        error ? skipped++ : updated++;
      } else if (!existing?.id) {
        const { error } = await supabaseAdmin.from("stock_items").insert(payload);
        error ? skipped++ : inserted++;
      } else {
        skipped++;
      }
    }

    await supabaseAdmin.from("stock_import_batches").insert({
      company_id,
      user_id: user_id || null,
      user_name: user_name || "",
      filename: filename || "",
      total_rows: rows.length,
      inserted_count: inserted,
      updated_count: updated,
      skipped_count: skipped,
      status: "Concluído"
    });

    return NextResponse.json({ inserted, updated, skipped, total: rows.length });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao importar estoque." }, { status: 500 });
  }
}
