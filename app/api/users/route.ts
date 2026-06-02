import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    assertServerSupabaseConfig();
    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get("company_id");
    const all = searchParams.get("all") === "true";

    let query = supabaseAdmin
      .from("app_users")
      .select("id, company_id, full_name, username, role, active, company_admin, master_admin, commission_percent, work_schedule, manager_approval_required, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (!all && company_id) query = query.eq("company_id", company_id);
    if (!all && !company_id) return NextResponse.json({ error: "company_id ausente." }, { status: 400 });

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao listar usuários." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();
    const b = await req.json();

    if (!b.company_id || !b.full_name || !b.username || !b.password) {
      return NextResponse.json({ error: "Preencha empresa, nome, usuário e senha." }, { status: 400 });
    }

    const { data: exists } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("username", String(b.username).trim())
      .limit(1)
      .single();

    if (exists?.id) return NextResponse.json({ error: "Esse login já existe." }, { status: 409 });

    const { error } = await supabaseAdmin.from("app_users").insert({
      company_id: b.company_id,
      full_name: String(b.full_name).trim(),
      username: String(b.username).trim(),
      password_hash: String(b.password),
      role: b.role || "Atendente",
      active: b.active ?? true,
      company_admin: Boolean(b.company_admin || b.role === "Administrador"),
      commission_percent: Number(b.commission_percent || 0),
      work_schedule: b.work_schedule || "",
      manager_approval_required: Boolean(b.manager_approval_required)
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao criar usuário." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    assertServerSupabaseConfig();
    const b = await req.json();

    if (!b.id || !b.company_id || !b.full_name || !b.username) {
      return NextResponse.json({ error: "ID, empresa, nome e usuário são obrigatórios." }, { status: 400 });
    }

    const { data: old } = await supabaseAdmin
      .from("app_users")
      .select("master_admin, username")
      .eq("id", b.id)
      .single();

    const payload:any = {
      company_id: b.company_id,
      full_name: String(b.full_name).trim(),
      username: String(b.username).trim(),
      role: b.role || "Atendente",
      active: b.active ?? true,
      company_admin: Boolean(b.company_admin || b.role === "Administrador"),
      commission_percent: Number(b.commission_percent || 0),
      work_schedule: b.work_schedule || "",
      manager_approval_required: Boolean(b.manager_approval_required),
      updated_at: new Date().toISOString()
    };

    if (old?.master_admin || old?.username === "admin") {
      payload.master_admin = true;
      payload.company_admin = true;
      payload.role = "Administrador";
      payload.active = true;
    }

    if (b.password) payload.password_hash = String(b.password);

    const { error } = await supabaseAdmin.from("app_users").update(payload).eq("id", b.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao editar usuário." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    assertServerSupabaseConfig();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID ausente." }, { status: 400 });

    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("master_admin, username")
      .eq("id", id)
      .single();

    if (user?.master_admin || user?.username === "admin") {
      return NextResponse.json({ error: "O usuário master não pode ser excluído." }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from("app_users").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erro ao excluir usuário." }, { status: 500 });
  }
}
