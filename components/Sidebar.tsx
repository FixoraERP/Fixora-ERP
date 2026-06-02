"use client";
import Link from "next/link";
import { clearSession, getSession } from "@/lib/session";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type MenuItem = { label:string; href:string; masterOnly?:boolean; adminCompanyOnly?:boolean; };
type MenuGroup = { title:string; masterOnly?:boolean; adminCompanyOnly?:boolean; items:MenuItem[]; };

const groups:MenuGroup[] = [
  { title:"Início", items:[{label:"Dashboard",href:"/dashboard"},{label:"Dashboard Ultra",href:"/dashboard/ultra-dashboard"},{label:"Notificações",href:"/dashboard/notifications-center"}] },
  { title:"Controle SaaS", masterOnly:true, items:[{label:"Empresas",href:"/dashboard/companies"},{label:"Planos SaaS",href:"/dashboard/plans"},{label:"Assinaturas/Licenças",href:"/dashboard/subscriptions"},{label:"Licenças SaaS",href:"/dashboard/licenses"},{label:"Pagamentos SaaS",href:"/dashboard/payments"},{label:"Configurações do Sistema",href:"/dashboard/system-settings"}] },
  { title:"Cadastros", items:[{label:"Clientes",href:"/dashboard/clients"},{label:"Fornecedores",href:"/dashboard/suppliers"},{label:"Estoque",href:"/dashboard/stock"},{label:"Importador Inteligente",href:"/dashboard/import-smart"},{label:"Serviços/Mão de obra",href:"/dashboard/services"}] },
  { title:"Assistência Técnica", items:[{label:"Ordens de Serviço",href:"/dashboard/os"},{label:"Assinaturas OS",href:"/dashboard/signatures"},{label:"Fila Técnica",href:"/dashboard/queue"},{label:"Portal Cliente",href:"/dashboard/customer-portal"}] },
  { title:"Vendas e Financeiro", items:[{label:"Vendas/PDV",href:"/dashboard/sales"},{label:"Cobranças da Assistência",href:"/dashboard/company-charges"},{label:"Financeiro",href:"/dashboard/finance"},{label:"Financeiro Avançado",href:"/dashboard/financial-advanced"},{label:"Relatórios",href:"/dashboard/reports"}] },
  { title:"Multi Loja", adminCompanyOnly:true, items:[{label:"Filiais",href:"/dashboard/branches"},{label:"Transferência Estoque",href:"/dashboard/stock-transfers"}] },
  { title:"Equipe", adminCompanyOnly:true, items:[{label:"Usuários",href:"/dashboard/users"},{label:"Permissões",href:"/dashboard/permissions"},{label:"Logs",href:"/dashboard/logs"},{label:"Controle de Horário",href:"/dashboard/time-clock"},{label:"Comissões",href:"/dashboard/commissions"},{label:"Metas",href:"/dashboard/goals"},{label:"Aprovações",href:"/dashboard/approvals"}] },
  { title:"Comunicação e Fiscal", adminCompanyOnly:true, items:[{label:"NFC-e",href:"/dashboard/fiscal"},{label:"Config NFC-e",href:"/dashboard/fiscal-settings"},{label:"WhatsApp",href:"/dashboard/whatsapp"},{label:"Comunicação",href:"/dashboard/communication-settings"}] },
  { title:"Comercial", items:[{label:"CRM",href:"/dashboard/crm"}] },
  { title:"Configurações", items:[{label:"Minha Assinatura",href:"/dashboard/my-subscription"},{label:"Minha Empresa",href:"/dashboard/company"},{label:"Pagamentos / Keys",href:"/dashboard/payment-settings",adminCompanyOnly:true},{label:"Backup / Exportação",href:"/dashboard/backup",adminCompanyOnly:true},{label:"Segurança",href:"/dashboard/security-advanced",adminCompanyOnly:true}] }
];

function isAdminCompany(session:any){ return Boolean(session?.master_admin || session?.company_admin || session?.role === "Administrador"); }
function canSeeItem(session:any,item:MenuItem){ if(item.masterOnly && !session?.master_admin) return false; if(item.adminCompanyOnly && !isAdminCompany(session)) return false; return true; }
function canSeeGroup(session:any,group:MenuGroup){ if(group.masterOnly && !session?.master_admin) return false; if(group.adminCompanyOnly && !isAdminCompany(session)) return false; return group.items.some(i=>canSeeItem(session,i)); }

export default function Sidebar(){
  const pathname = usePathname();
  const [session,setSession] = useState<any>(null);
  const [open,setOpen] = useState<Record<string,boolean>>({});
  useEffect(()=>{
    const s=getSession(); setSession(s);
    const o:Record<string,boolean>={};
    groups.forEach(g=>{ o[g.title] = g.items.some(i=>pathname.startsWith(i.href)) || ["Início","Cadastros","Assistência Técnica"].includes(g.title); });
    setOpen(o);
  },[pathname]);
  function logout(){ clearSession(); location.href="/login"; }
  return <aside className="w-full md:w-72 md:min-h-screen bg-zinc-950 border-r border-zinc-800 p-4">
    <div className="mb-6"><h1 className="text-2xl font-black">Fixora ERP</h1><p className="text-sm text-zinc-400">Gestão SaaS</p>{session&&<p className="text-xs text-zinc-500 mt-1">{session.full_name} · {session.master_admin?"Master Admin":session.company_admin?"Admin Empresa":session.role}</p>}</div>
    <nav className="grid gap-3">
      {groups.filter(g=>canSeeGroup(session,g)).map(group=><div key={group.title} className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
        <button onClick={()=>setOpen({...open,[group.title]:!open[group.title]})} className="w-full flex justify-between items-center px-3 py-2 font-bold text-left hover:bg-zinc-800"><span>{group.title}</span><span>{open[group.title]?"−":"+"}</span></button>
        {open[group.title]&&<div className="grid gap-1 p-2">{group.items.filter(i=>canSeeItem(session,i)).map(item=><Link key={item.href} href={item.href} className={`rounded-xl px-3 py-2 text-sm ${pathname===item.href?"bg-brand-500 text-white":"hover:bg-zinc-800 text-zinc-200"}`}>{item.label}</Link>)}</div>}
      </div>)}
      <button onClick={logout} className="btn-secondary mt-4">Sair</button>
    </nav>
  </aside>
}
