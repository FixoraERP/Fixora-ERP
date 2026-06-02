import { NextResponse } from "next/server";
import { assertServerSupabaseConfig, supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkCompanyAccess, isMasterAdmin } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    assertServerSupabaseConfig();

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Informe usuário e senha." }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("app_users")
      .select("*")
      .eq("username", String(username).trim())
      .eq("active", true)
      .single();

    if (error || !user || String(password) !== String(user.password_hash)) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
    }

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", user.company_id)
      .single();

    const master = isMasterAdmin(user);
    const access = checkCompanyAccess(company, user);

    if (!access.allowed && !master) {
      return NextResponse.json({
        error: access.reason || "Acesso bloqueado.",
        blocked: true,
        status: access.status
      }, { status: 403 });
    }

    return NextResponse.json({
      user_id: user.id,
      company_id: user.company_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      master_admin: master,
      company_admin: Boolean(user.company_admin || user.role === "Administrador" || master),
      company_name: company?.trade_name || company?.name || "Fixora ERP",
      owner_company: Boolean(company?.owner_company),
      subscription_status: master ? "master" : company?.subscription_status,
      subscription_due_date: master ? "Sem vencimento" : company?.subscription_due_date,
      company_blocked: master ? false : Boolean(company?.blocked)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro no login." }, { status: 500 });
  }
}
