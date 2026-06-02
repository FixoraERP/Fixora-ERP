"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {getSession} from "@/lib/session";

const empty:any={service_order_id:"",os_number:"",technician:"",task:"",status:"Pendente",priority:"Normal",notes:""};

export default function TasksPage(){
 const [s,setS]=useState<any>(null);const [tasks,setTasks]=useState<any[]>([]);const [orders,setOrders]=useState<any[]>([]);const [users,setUsers]=useState<any[]>([]);const [form,setForm]=useState<any>(empty);const [id,setId]=useState("");
 useEffect(()=>{boot()},[]);
 async function boot(){const ss=getSession();if(!ss){location.href="/login";return;}setS(ss);load(ss.company_id)}
 async function load(cid:any){const [{data:t},{data:o},{data:u}]=await Promise.all([supabase.from("technician_tasks").select("*").eq("company_id",cid).order("created_at",{ascending:false}),supabase.from("service_orders").select("*").eq("company_id",cid),supabase.from("app_users").select("*").eq("company_id",cid).eq("active",true)]);setTasks(t||[]);setOrders(o||[]);setUsers(u||[])}
 function chooseOS(v:string){const os=orders.find(x=>x.id===v);setForm({...form,service_order_id:v,os_number:os?.os_number||""})}
 async function save(){if(!s||!form.task)return alert("Informe a tarefa.");const payload={...form,company_id:s.company_id,updated_at:new Date().toISOString()};const r=id?await supabase.from("technician_tasks").update(payload).eq("id",id):await supabase.from("technician_tasks").insert(payload);if(r.error)return alert(r.error.message);setForm(empty);setId("");load(s.company_id)}
 return <div className="space-y-6"><h1 className="text-3xl font-black">Fila Técnica</h1><section className="card p-4 grid md:grid-cols-3 gap-3"><select value={form.service_order_id} onChange={e=>chooseOS(e.target.value)}><option value="">OS</option>{orders.map(o=><option key={o.id} value={o.id}>{o.os_number} - {o.client_name}</option>)}</select><select value={form.technician} onChange={e=>setForm({...form,technician:e.target.value})}><option value="">Técnico</option>{users.map(u=><option key={u.id}>{u.full_name}</option>)}</select><input placeholder="Tarefa" value={form.task} onChange={e=>setForm({...form,task:e.target.value})}/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Pendente</option><option>Em andamento</option><option>Concluída</option></select><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option></select><input placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="btn-primary" onClick={save}>Salvar tarefa</button></section><section className="card p-4">{tasks.map(t=><div key={t.id} onClick={()=>{setId(t.id);setForm(t)}} className="p-3 border-b border-zinc-800 cursor-pointer"><b>{t.os_number}</b> · {t.technician} · {t.task} · {t.status} · {t.priority}</div>)}</section></div>
}
