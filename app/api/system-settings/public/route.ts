import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_SETTINGS = {
  system_name: "Fixora ERP",
  system_subtitle: "Gestão SaaS para assistência técnica",
  system_logo_url: "",
  system_banner_url: "",
  system_icon_url: "",
  system_favicon_url: "",
  primary_color: "#f59e0b",
  support_whatsapp: "",
  support_email: "",
  login_message: "Acesse sua conta para continuar.",
  footer_text: "Fixora ERP",
  allow_company_login_branding: false
};

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("system_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000999")
      .single();

    return NextResponse.json(data || DEFAULT_SETTINGS);
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}
