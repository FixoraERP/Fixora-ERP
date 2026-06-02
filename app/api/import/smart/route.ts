import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

function norm(v:any) {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const body = await req.json();
    const { company_id, user_id, target_module, filename, rows, mapping, mode } = body;

    if (!company_id || !Array.isArray(rows)) {
      return NextResponse.json({ error: "company_id e rows são obrigatórios." }, { status: 400 });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors:any[] = [];

    const jobInsert = await supabaseAdmin.from("smart_import_jobs").insert({
      company_id,
      user_id: user_id || null,
      target_module: target_module || "stock",
      filename: filename || "",
      total_rows: rows.length,
      mapping: mapping || {},
      preview: rows.slice(0, 20),
      status: "processing"
    }).select().single();

    if (jobInsert.error) {
      return NextResponse.json({ error: jobInsert.error.message }, { status: 500 });
    }

    for (const row of rows) {
      try {
        if ((target_module || "stock") === "stock") {
          const item:any = {
            company_id,
            name: norm(row.name || row.nome || row.produto || row.item),
            category: norm(row.category || row.categoria),
            quantity: Number(row.quantity || row.quantidade || row.qtd || 0),
            cost_price: Number(row.cost_price || row.custo || 0),
            sale_price: Number(row.sale_price || row.preco || row.venda || 0),
            sku: norm(row.sku || row.codigo || ""),
            barcode: norm(row.barcode || row.codigo_barras || ""),
            brand: norm(row.brand || row.marca || ""),
            compatible_model: norm(row.compatible_model || row.modelo || "")
          };

          if (!item.name) {
            skipped++;
            continue;
          }

          const key = item.sku || item.barcode;
          if (mode !== "insert_only" && key) {
            const q = item.sku
              ? supabaseAdmin.from("stock_items").select("id").eq("company_id", company_id).eq("sku", item.sku).limit(1).single()
              : supabaseAdmin.from("stock_items").select("id").eq("company_id", company_id).eq("barcode", item.barcode).limit(1).single();
            const { data: existing } = await q;
            if (existing?.id) {
              const { error } = await supabaseAdmin.from("stock_items").update(item).eq("id", existing.id);
              if (error) throw error;
              updated++;
              continue;
            }
          }

          const { error } = await supabaseAdmin.from("stock_items").insert(item);
          if (error) throw error;
          imported++;
        } else {
          skipped++;
        }
      } catch (e:any) {
        errors.push({ row, error: e.message });
        skipped++;
      }
    }

    await supabaseAdmin.from("smart_import_jobs").update({
      imported_rows: imported,
      updated_rows: updated,
      skipped_rows: skipped,
      errors,
      status: "finished",
      finished_at: new Date().toISOString()
    }).eq("id", jobInsert.data.id);

    await supabaseAdmin.from("bulk_update_logs").insert({
      company_id,
      user_id: user_id || null,
      module: target_module || "stock",
      action: "smart_import",
      affected_rows: imported + updated,
      details: { imported, updated, skipped, filename }
    });

    return NextResponse.json({ ok: true, imported, updated, skipped, errors });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro na importação inteligente." }, { status: 500 });
  }
}
