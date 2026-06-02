create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Fixora',
  trade_name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  city text default '',
  state text default '',
  zip_code text default '',
  logo_url text default '',
  banner_url text default '',
  footer_notes text default 'Obrigado pela preferência.',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  password_hash text not null,
  role text default 'Atendente',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  whatsapp text default '',
  email text default '',
  document text default '',
  zip_code text default '',
  address text default '',
  address_number text default '',
  neighborhood text default '',
  city text default '',
  state text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  whatsapp text default '',
  email text default '',
  document text default '',
  zip_code text default '',
  address text default '',
  address_number text default '',
  neighborhood text default '',
  city text default '',
  state text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists service_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  category text default '',
  default_value numeric default 0,
  warranty text default '',
  notes text default '',
  image_url text default '',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  supplier_name text default '',
  name text not null,
  category text default '',
  quantity numeric default 0,
  cost numeric default 0,
  sale_price numeric default 0,
  notes text default '',
  image_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  os_number text not null,
  client_id uuid references clients(id) on delete set null,
  client_name text default '',
  device_desc text default '',
  device_brand text default '',
  device_model text default '',
  imei text default '',
  device_password text default '',
  accessories text default '',
  issue_reported text default '',
  diagnosis text default '',
  service_id uuid references service_catalog(id) on delete set null,
  service_name text default '',
  service_done text default '',
  warranty text default '',
  status text default 'Aberta',
  technician text default '',
  labor_value numeric default 0,
  parts_value numeric default 0,
  discount_value numeric default 0,
  total_value numeric default 0,
  entry_signature text default '',
  exit_signature text default '',
  internal_notes text default '',
  stock_deducted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists service_order_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_order_id uuid references service_orders(id) on delete cascade,
  stage text not null check(stage in ('before','after')),
  url text not null,
  path text not null,
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_order_id uuid references service_orders(id) on delete cascade,
  stock_item_id uuid references stock_items(id) on delete set null,
  description text not null,
  quantity numeric default 1,
  unit_value numeric default 0,
  total_value numeric default 0,
  created_at timestamptz default now()
);

create table if not exists financial_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  type text not null check(type in ('receivable','payable')),
  description text not null,
  person_name text default '',
  due_date date,
  amount numeric default 0,
  status text default 'Aberto',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table companies add column if not exists logo_url text default '';
alter table companies add column if not exists banner_url text default '';
alter table clients add column if not exists zip_code text default '';
alter table clients add column if not exists address_number text default '';
alter table clients add column if not exists neighborhood text default '';
alter table clients add column if not exists city text default '';
alter table clients add column if not exists state text default '';
alter table stock_items add column if not exists supplier_id uuid references suppliers(id) on delete set null;
alter table stock_items add column if not exists supplier_name text default '';
alter table service_orders add column if not exists device_brand text default '';
alter table service_orders add column if not exists device_model text default '';
alter table service_orders add column if not exists imei text default '';
alter table service_orders add column if not exists device_password text default '';
alter table service_orders add column if not exists accessories text default '';
alter table service_orders add column if not exists service_id uuid references service_catalog(id) on delete set null;
alter table service_orders add column if not exists service_name text default '';
alter table service_orders add column if not exists stock_deducted boolean default false;

insert into storage.buckets (id, name, public) values ('os-images', 'os-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('app-assets', 'app-assets', true) on conflict (id) do nothing;

drop policy if exists os_images_public_select on storage.objects;
drop policy if exists os_images_auth_insert on storage.objects;
drop policy if exists os_images_auth_update on storage.objects;
drop policy if exists os_images_auth_delete on storage.objects;
drop policy if exists app_assets_public_select on storage.objects;
drop policy if exists app_assets_auth_insert on storage.objects;
drop policy if exists app_assets_auth_update on storage.objects;
drop policy if exists app_assets_auth_delete on storage.objects;

create policy os_images_public_select on storage.objects for select using (bucket_id = 'os-images');
create policy os_images_auth_insert on storage.objects for insert with check (bucket_id = 'os-images');
create policy os_images_auth_update on storage.objects for update using (bucket_id = 'os-images');
create policy os_images_auth_delete on storage.objects for delete using (bucket_id = 'os-images');

create policy app_assets_public_select on storage.objects for select using (bucket_id = 'app-assets');
create policy app_assets_auth_insert on storage.objects for insert with check (bucket_id = 'app-assets');
create policy app_assets_auth_update on storage.objects for update using (bucket_id = 'app-assets');
create policy app_assets_auth_delete on storage.objects for delete using (bucket_id = 'app-assets');

alter table companies disable row level security;
alter table app_users disable row level security;
alter table clients disable row level security;
alter table suppliers disable row level security;
alter table service_catalog disable row level security;
alter table stock_items disable row level security;
alter table service_orders disable row level security;
alter table service_order_images disable row level security;
alter table budget_items disable row level security;
alter table financial_entries disable row level security;

create index if not exists idx_users_username on app_users(username);
create index if not exists idx_clients_company on clients(company_id);
create index if not exists idx_suppliers_company on suppliers(company_id);
create index if not exists idx_services_company on service_catalog(company_id);
create index if not exists idx_stock_company on stock_items(company_id);
create index if not exists idx_os_company on service_orders(company_id);
create index if not exists idx_images_os on service_order_images(service_order_id);
create index if not exists idx_budget_items_os on budget_items(service_order_id);



-- ERP PRO: recursos extras
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_name text default '',
  action text not null,
  entity text default '',
  entity_id text default '',
  details text default '',
  created_at timestamptz default now()
);

create table if not exists quick_sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  sale_number text not null,
  client_name text default '',
  seller text default '',
  total_value numeric default 0,
  payment_method text default 'Dinheiro',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists quick_sale_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  sale_id uuid references quick_sales(id) on delete cascade,
  stock_item_id uuid references stock_items(id) on delete set null,
  description text not null,
  quantity numeric default 1,
  unit_value numeric default 0,
  total_value numeric default 0,
  created_at timestamptz default now()
);

create table if not exists technician_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_order_id uuid references service_orders(id) on delete cascade,
  os_number text default '',
  technician text default '',
  task text not null,
  status text default 'Pendente',
  priority text default 'Normal',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists os_checklist (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_order_id uuid references service_orders(id) on delete cascade,
  item text not null,
  checked boolean default false,
  created_at timestamptz default now()
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text not null,
  message text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table audit_logs disable row level security;
alter table quick_sales disable row level security;
alter table quick_sale_items disable row level security;
alter table technician_tasks disable row level security;
alter table os_checklist disable row level security;
alter table message_templates disable row level security;

create index if not exists idx_audit_company on audit_logs(company_id);
create index if not exists idx_sales_company on quick_sales(company_id);
create index if not exists idx_tasks_company on technician_tasks(company_id);
create index if not exists idx_checklist_os on os_checklist(service_order_id);
create index if not exists idx_templates_company on message_templates(company_id);

insert into message_templates (company_id, title, message)
values
('00000000-0000-0000-0000-000000000001', 'OS recebida', 'Olá, {cliente}. Sua OS {os} foi aberta e o aparelho foi recebido.'),
('00000000-0000-0000-0000-000000000001', 'Orçamento pronto', 'Olá, {cliente}. O orçamento da OS {os} ficou em {valor}. Podemos prosseguir?'),
('00000000-0000-0000-0000-000000000001', 'Serviço concluído', 'Olá, {cliente}. Sua OS {os} foi concluída. Total: {valor}.')
on conflict do nothing;

alter table stock_items add column if not exists image_url text default '';
alter table service_catalog add column if not exists image_url text default '';



-- FIXORA ERP - SAAS/FISCAL/WHATSAPP/PUSH
alter table companies add column if not exists parent_company_id uuid references companies(id) on delete set null;
alter table companies add column if not exists plan text default 'Pro';
alter table companies add column if not exists active boolean default true;
alter table clients add column if not exists cpf text default '';
alter table quick_sales add column if not exists customer_cpf text default '';

create table if not exists company_members (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, user_id uuid references app_users(id) on delete cascade, role text default 'Atendente', active boolean default true, created_at timestamptz default now());
create table if not exists permissions (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, role text not null, module text not null, can_view boolean default true, can_create boolean default false, can_edit boolean default false, can_delete boolean default false, created_at timestamptz default now(), updated_at timestamptz default now(), unique(company_id, role, module));
create table if not exists fiscal_settings (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, provider text default 'manual', environment text default 'homologacao', cnpj text default '', inscricao_estadual text default '', regime_tributario text default '', csc_id text default '', csc_token text default '', certificate_file_url text default '', certificate_password text default '', api_token text default '', series text default '1', next_number integer default 1, active boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists fiscal_invoices (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, sale_id uuid references quick_sales(id) on delete set null, service_order_id uuid references service_orders(id) on delete set null, customer_name text default '', customer_cpf text default '', number integer, series text default '1', status text default 'Rascunho', provider text default 'manual', access_key text default '', qr_code text default '', xml_url text default '', danfe_url text default '', total_value numeric default 0, payload jsonb default '{}'::jsonb, response jsonb default '{}'::jsonb, error_message text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists whatsapp_settings (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, provider text default 'manual', api_url text default '', api_token text default '', phone_instance text default '', active boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists whatsapp_queue (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, recipient text not null, message text not null, status text default 'Pendente', event_type text default '', provider_response jsonb default '{}'::jsonb, scheduled_at timestamptz default now(), sent_at timestamptz, created_at timestamptz default now());
create table if not exists notifications (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, user_id uuid references app_users(id) on delete set null, title text not null, message text not null, type text default 'info', read boolean default false, created_at timestamptz default now());
create table if not exists push_subscriptions (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, user_id uuid references app_users(id) on delete cascade, endpoint text not null, p256dh text default '', auth text default '', created_at timestamptz default now());

alter table company_members disable row level security;
alter table permissions disable row level security;
alter table fiscal_settings disable row level security;
alter table fiscal_invoices disable row level security;
alter table whatsapp_settings disable row level security;
alter table whatsapp_queue disable row level security;
alter table notifications disable row level security;
alter table push_subscriptions disable row level security;

insert into permissions (company_id, role, module, can_view, can_create, can_edit, can_delete) values
('00000000-0000-0000-0000-000000000001','Administrador','todos',true,true,true,true),
('00000000-0000-0000-0000-000000000001','Atendente','os',true,true,true,false),
('00000000-0000-0000-0000-000000000001','Técnico','os',true,false,true,false),
('00000000-0000-0000-0000-000000000001','Financeiro','financeiro',true,true,true,false)
on conflict(company_id, role, module) do nothing;


update companies set logo_url = '/fixora-logo.png', banner_url = '/fixora-banner.png' where id = '00000000-0000-0000-0000-000000000001';



-- FIXORA ERP - SAAS BILLING / PLANOS / BLOQUEIO

alter table companies add column if not exists subscription_status text default 'active';
alter table companies add column if not exists subscription_due_date date default (now() + interval '30 days')::date;
alter table companies add column if not exists blocked boolean default false;
alter table companies add column if not exists trial_ends_at date default (now() + interval '15 days')::date;
alter table companies add column if not exists block_reason text default '';
alter table companies add column if not exists max_users integer default 5;
alter table companies add column if not exists max_stores integer default 1;
alter table companies add column if not exists max_orders_month integer default 999999;

create table if not exists saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric default 0,
  billing_cycle text default 'monthly',
  max_users integer default 1,
  max_stores integer default 1,
  max_orders_month integer default 100,
  allow_nfce boolean default false,
  allow_whatsapp boolean default false,
  allow_multistore boolean default false,
  allow_push boolean default false,
  active boolean default true,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  plan_name text default '',
  status text default 'active',
  started_at date default now(),
  due_date date default (now() + interval '30 days')::date,
  paid_until date default (now() + interval '30 days')::date,
  trial_ends_at date default (now() + interval '15 days')::date,
  blocked boolean default false,
  block_reason text default '',
  payment_method text default 'manual',
  external_customer_id text default '',
  external_subscription_id text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscription_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  subscription_id uuid references company_subscriptions(id) on delete cascade,
  amount numeric default 0,
  due_date date,
  paid_at timestamptz,
  status text default 'pending',
  payment_method text default 'manual',
  reference text default '',
  notes text default '',
  created_at timestamptz default now()
);

alter table saas_plans disable row level security;
alter table company_subscriptions disable row level security;
alter table subscription_payments disable row level security;

create index if not exists idx_subscriptions_company on company_subscriptions(company_id);
create index if not exists idx_subscription_payments_company on subscription_payments(company_id);

insert into saas_plans (name, price, billing_cycle, max_users, max_stores, max_orders_month, allow_nfce, allow_whatsapp, allow_multistore, allow_push, description)
values
('Básico', 49.90, 'monthly', 1, 1, 100, false, false, false, false, 'Plano inicial para assistência pequena.'),
('Pro', 99.90, 'monthly', 5, 2, 999999, true, true, true, true, 'Plano profissional com NFC-e, WhatsApp e multi loja.'),
('Premium', 199.90, 'monthly', 999, 999, 999999, true, true, true, true, 'Plano completo para redes e franquias.')
on conflict(name) do update set
price = excluded.price,
max_users = excluded.max_users,
max_stores = excluded.max_stores,
max_orders_month = excluded.max_orders_month,
allow_nfce = excluded.allow_nfce,
allow_whatsapp = excluded.allow_whatsapp,
allow_multistore = excluded.allow_multistore,
allow_push = excluded.allow_push,
active = true;

update companies
set subscription_status = coalesce(subscription_status, 'active'),
    blocked = coalesce(blocked, false),
    plan = coalesce(plan, 'Pro'),
    subscription_due_date = coalesce(subscription_due_date, (now() + interval '30 days')::date),
    trial_ends_at = coalesce(trial_ends_at, (now() + interval '15 days')::date)
where id = '00000000-0000-0000-0000-000000000001';

insert into company_subscriptions (company_id, plan_id, plan_name, status, due_date, paid_until, trial_ends_at, blocked)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  name,
  'active',
  (now() + interval '30 days')::date,
  (now() + interval '30 days')::date,
  (now() + interval '15 days')::date,
  false
from saas_plans
where name = 'Pro'
on conflict do nothing;



-- FIXORA ERP - MASTER ADMIN / DONO DO SISTEMA

alter table app_users add column if not exists master_admin boolean default false;
alter table companies add column if not exists owner_company boolean default false;

update companies
set owner_company = true,
    blocked = false,
    subscription_status = 'active',
    block_reason = '',
    plan = 'Owner',
    max_users = 999999,
    max_stores = 999999,
    max_orders_month = 999999
where id = '00000000-0000-0000-0000-000000000001';

update app_users
set master_admin = true,
    role = 'Administrador',
    active = true
where username = 'admin';

insert into saas_plans (
  name,
  price,
  billing_cycle,
  max_users,
  max_stores,
  max_orders_month,
  allow_nfce,
  allow_whatsapp,
  allow_multistore,
  allow_push,
  active,
  description
)
values (
  'Owner',
  0,
  'lifetime',
  999999,
  999999,
  999999,
  true,
  true,
  true,
  true,
  true,
  'Plano interno do dono do sistema. Não bloqueia e não vence.'
)
on conflict(name) do update set
price = 0,
billing_cycle = 'lifetime',
max_users = 999999,
max_stores = 999999,
max_orders_month = 999999,
allow_nfce = true,
allow_whatsapp = true,
allow_multistore = true,
allow_push = true,
active = true,
description = 'Plano interno do dono do sistema. Não bloqueia e não vence.';



-- FIXORA ERP - BLOCO FINAL AUDITADO
alter table companies add column if not exists owner_company boolean default false;
alter table companies add column if not exists subscription_status text default 'active';
alter table companies add column if not exists subscription_due_date date default (now() + interval '30 days')::date;
alter table companies add column if not exists blocked boolean default false;
alter table companies add column if not exists block_reason text default '';
alter table companies add column if not exists max_users integer default 5;
alter table companies add column if not exists max_stores integer default 1;
alter table companies add column if not exists max_orders_month integer default 999999;
alter table app_users add column if not exists master_admin boolean default false;

create table if not exists saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric default 0,
  billing_cycle text default 'monthly',
  max_users integer default 1,
  max_stores integer default 1,
  max_orders_month integer default 100,
  allow_nfce boolean default false,
  allow_whatsapp boolean default false,
  allow_multistore boolean default false,
  allow_push boolean default false,
  active boolean default true,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  plan_name text default '',
  status text default 'active',
  due_date date default (now() + interval '30 days')::date,
  paid_until date default (now() + interval '30 days')::date,
  blocked boolean default false,
  block_reason text default '',
  payment_method text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscription_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  subscription_id uuid references company_subscriptions(id) on delete cascade,
  amount numeric default 0,
  due_date date,
  paid_at timestamptz,
  status text default 'pending',
  payment_method text default 'manual',
  notes text default '',
  created_at timestamptz default now()
);

insert into saas_plans (name, price, billing_cycle, max_users, max_stores, max_orders_month, allow_nfce, allow_whatsapp, allow_multistore, allow_push, active, description)
values
('Básico', 49.90, 'monthly', 1, 1, 100, false, false, false, false, true, 'Plano inicial.'),
('Pro', 99.90, 'monthly', 5, 2, 999999, true, true, true, true, true, 'Plano profissional.'),
('Premium', 199.90, 'monthly', 999, 999, 999999, true, true, true, true, true, 'Plano completo.'),
('Owner', 0, 'lifetime', 999999, 999999, 999999, true, true, true, true, true, 'Plano interno do dono do sistema. Não bloqueia e não vence.')
on conflict(name) do update set
price=excluded.price,
billing_cycle=excluded.billing_cycle,
max_users=excluded.max_users,
max_stores=excluded.max_stores,
max_orders_month=excluded.max_orders_month,
allow_nfce=excluded.allow_nfce,
allow_whatsapp=excluded.allow_whatsapp,
allow_multistore=excluded.allow_multistore,
allow_push=excluded.allow_push,
active=true,
description=excluded.description;

update companies
set owner_company=true,
    blocked=false,
    subscription_status='active',
    block_reason='',
    plan='Owner',
    max_users=999999,
    max_stores=999999,
    max_orders_month=999999,
    logo_url=coalesce(nullif(logo_url,''), '/fixora-logo.png'),
    banner_url=coalesce(nullif(banner_url,''), '/fixora-banner.png')
where id='00000000-0000-0000-0000-000000000001';

update app_users
set master_admin=true,
    role='Administrador',
    active=true,
    password_hash='admin123'
where username='admin';



-- FIXORA ERP - ADMIN DA EMPRESA / RH / SEGURANÇA / METAS

alter table app_users add column if not exists company_admin boolean default false;
alter table app_users add column if not exists must_change_password boolean default false;
alter table app_users add column if not exists two_factor_enabled boolean default false;
alter table app_users add column if not exists two_factor_secret text default '';
alter table app_users add column if not exists whatsapp_login_enabled boolean default false;
alter table app_users add column if not exists google_login_enabled boolean default false;
alter table app_users add column if not exists commission_percent numeric default 0;
alter table app_users add column if not exists work_schedule text default '';
alter table app_users add column if not exists manager_approval_required boolean default false;

create table if not exists user_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  invited_by uuid references app_users(id) on delete set null,
  full_name text not null,
  username text not null,
  role text default 'Atendente',
  invite_token text default gen_random_uuid()::text,
  status text default 'Pendente',
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);

create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  reset_token text default gen_random_uuid()::text,
  status text default 'Pendente',
  expires_at timestamptz default (now() + interval '1 hour'),
  created_at timestamptz default now()
);

create table if not exists user_action_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  user_name text default '',
  action text not null,
  module text default '',
  details text default '',
  ip_address text default '',
  created_at timestamptz default now()
);

create table if not exists time_clock_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  user_name text default '',
  entry_type text not null default 'entrada',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists technician_commissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  service_order_id uuid references service_orders(id) on delete set null,
  user_name text default '',
  os_number text default '',
  base_value numeric default 0,
  percent numeric default 0,
  commission_value numeric default 0,
  status text default 'Pendente',
  created_at timestamptz default now()
);

create table if not exists team_goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  user_name text default '',
  title text not null,
  goal_type text default 'valor',
  target_value numeric default 0,
  current_value numeric default 0,
  start_date date default now(),
  end_date date default (now() + interval '30 days')::date,
  status text default 'Em andamento',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  requested_by uuid references app_users(id) on delete set null,
  approved_by uuid references app_users(id) on delete set null,
  request_type text not null,
  module text default '',
  payload jsonb default '{}'::jsonb,
  status text default 'Pendente',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists security_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  allow_google_login boolean default false,
  allow_whatsapp_login boolean default false,
  require_2fa boolean default false,
  allow_biometric_hint boolean default false,
  password_recovery_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_invites disable row level security;
alter table password_resets disable row level security;
alter table user_action_logs disable row level security;
alter table time_clock_entries disable row level security;
alter table technician_commissions disable row level security;
alter table team_goals disable row level security;
alter table approval_requests disable row level security;
alter table security_settings disable row level security;

create index if not exists idx_user_invites_company on user_invites(company_id);
create index if not exists idx_user_action_logs_company on user_action_logs(company_id);
create index if not exists idx_time_clock_company on time_clock_entries(company_id);
create index if not exists idx_commissions_company on technician_commissions(company_id);
create index if not exists idx_goals_company on team_goals(company_id);
create index if not exists idx_approvals_company on approval_requests(company_id);

update app_users set company_admin = true where role = 'Administrador';
update app_users set master_admin = true, company_admin = true where username = 'admin';



-- FIXORA ERP - PAGAMENTOS INTEGRADOS / LINKS / WEBHOOKS

create table if not exists payment_gateways (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  subscription_id uuid references company_subscriptions(id) on delete set null,
  plan_id uuid references saas_plans(id) on delete set null,
  provider text default 'manual',
  external_id text default '',
  external_reference text default '',
  customer_name text default '',
  customer_email text default '',
  customer_document text default '',
  amount numeric default 0,
  description text default '',
  checkout_url text default '',
  pix_qr_code text default '',
  pix_copy_paste text default '',
  due_date date default (now() + interval '3 days')::date,
  paid_at timestamptz,
  status text default 'pending',
  raw_payload jsonb default '{}'::jsonb,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table payment_gateways disable row level security;
alter table payment_charges disable row level security;

create index if not exists idx_payment_gateways_company on payment_gateways(company_id);
create index if not exists idx_payment_charges_company on payment_charges(company_id);
create index if not exists idx_payment_charges_reference on payment_charges(external_reference);

alter table subscription_payments add column if not exists charge_id uuid references payment_charges(id) on delete set null;
alter table company_subscriptions add column if not exists last_charge_id uuid references payment_charges(id) on delete set null;

insert into payment_gateways (company_id, provider, display_name, instructions, active, sandbox)
values
('00000000-0000-0000-0000-000000000001','manual','Manual / Simulado','Use para confirmar pagamento manualmente ou testar sem gateway.',true,true),
('00000000-0000-0000-0000-000000000001','mercadopago','Mercado Pago','Cole o Access Token do Mercado Pago. Usa link de checkout/pagamento.',false,true),
('00000000-0000-0000-0000-000000000001','asaas','Asaas','Cole o token da API Asaas. Ideal para Pix, boleto e cartão.',false,true),
('00000000-0000-0000-0000-000000000001','stripe','Stripe','Cole a Secret Key. Ideal para cartão internacional.',false,true),
('00000000-0000-0000-0000-000000000001','pagseguro','PagSeguro','Cole token/credenciais e use link externo/gateway.',false,true),
('00000000-0000-0000-0000-000000000001','generic','Link externo','Use qualquer link de pagamento externo e confirme via painel.',false,true)
on conflict do nothing;



-- FIXORA ERP - PAGAMENTOS POR EMPRESA / ASSISTÊNCIA

alter table payment_gateways add column if not exists gateway_scope text default 'saas';
alter table payment_charges add column if not exists charge_scope text default 'saas';
alter table payment_charges add column if not exists service_order_id uuid references service_orders(id) on delete set null;
alter table payment_charges add column if not exists sale_id uuid references quick_sales(id) on delete set null;

create table if not exists company_payment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table company_payment_settings disable row level security;
create index if not exists idx_company_payment_settings_company on company_payment_settings(company_id);

insert into company_payment_settings (company_id, provider, display_name, instructions, active, sandbox)
select id, 'manual', 'Manual / Simulado', 'Recebimento manual ou simulado da assistência.', true, true
from companies
on conflict do nothing;



-- FIXORA ERP - AUDITORIA FINAL CONSOLIDADA

alter table companies add column if not exists parent_company_id uuid references companies(id) on delete set null;
alter table companies add column if not exists plan text default 'Pro';
alter table companies add column if not exists active boolean default true;
alter table companies add column if not exists owner_company boolean default false;
alter table companies add column if not exists subscription_status text default 'active';
alter table companies add column if not exists subscription_due_date date default (now() + interval '30 days')::date;
alter table companies add column if not exists blocked boolean default false;
alter table companies add column if not exists trial_ends_at date default (now() + interval '15 days')::date;
alter table companies add column if not exists block_reason text default '';
alter table companies add column if not exists max_users integer default 5;
alter table companies add column if not exists max_stores integer default 1;
alter table companies add column if not exists max_orders_month integer default 999999;

alter table app_users add column if not exists master_admin boolean default false;
alter table app_users add column if not exists company_admin boolean default false;
alter table app_users add column if not exists must_change_password boolean default false;
alter table app_users add column if not exists two_factor_enabled boolean default false;
alter table app_users add column if not exists two_factor_secret text default '';
alter table app_users add column if not exists whatsapp_login_enabled boolean default false;
alter table app_users add column if not exists google_login_enabled boolean default false;
alter table app_users add column if not exists commission_percent numeric default 0;
alter table app_users add column if not exists work_schedule text default '';
alter table app_users add column if not exists manager_approval_required boolean default false;

alter table clients add column if not exists cpf text default '';
alter table stock_items add column if not exists image_url text default '';
alter table service_catalog add column if not exists image_url text default '';
alter table quick_sales add column if not exists customer_cpf text default '';

create table if not exists payment_gateways (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  gateway_scope text default 'saas',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  subscription_id uuid references company_subscriptions(id) on delete set null,
  plan_id uuid references saas_plans(id) on delete set null,
  service_order_id uuid references service_orders(id) on delete set null,
  sale_id uuid references quick_sales(id) on delete set null,
  provider text default 'manual',
  external_id text default '',
  external_reference text default '',
  customer_name text default '',
  customer_email text default '',
  customer_document text default '',
  amount numeric default 0,
  description text default '',
  checkout_url text default '',
  pix_qr_code text default '',
  pix_copy_paste text default '',
  due_date date default (now() + interval '3 days')::date,
  paid_at timestamptz,
  status text default 'pending',
  charge_scope text default 'saas',
  raw_payload jsonb default '{}'::jsonb,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_payment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_action_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  user_name text default '',
  action text not null,
  module text default '',
  details text default '',
  ip_address text default '',
  created_at timestamptz default now()
);

create table if not exists time_clock_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  user_name text default '',
  entry_type text not null default 'entrada',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists technician_commissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  service_order_id uuid references service_orders(id) on delete set null,
  user_name text default '',
  os_number text default '',
  base_value numeric default 0,
  percent numeric default 0,
  commission_value numeric default 0,
  status text default 'Pendente',
  created_at timestamptz default now()
);

create table if not exists team_goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  user_name text default '',
  title text not null,
  goal_type text default 'valor',
  target_value numeric default 0,
  current_value numeric default 0,
  start_date date default now(),
  end_date date default (now() + interval '30 days')::date,
  status text default 'Em andamento',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  requested_by uuid references app_users(id) on delete set null,
  approved_by uuid references app_users(id) on delete set null,
  request_type text not null,
  module text default '',
  payload jsonb default '{}'::jsonb,
  status text default 'Pendente',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table payment_gateways disable row level security;
alter table payment_charges disable row level security;
alter table company_payment_settings disable row level security;
alter table user_action_logs disable row level security;
alter table time_clock_entries disable row level security;
alter table technician_commissions disable row level security;
alter table team_goals disable row level security;
alter table approval_requests disable row level security;

insert into saas_plans (name, price, billing_cycle, max_users, max_stores, max_orders_month, allow_nfce, allow_whatsapp, allow_multistore, allow_push, active, description)
values
('Básico', 49.90, 'monthly', 1, 1, 100, false, false, false, false, true, 'Plano inicial.'),
('Pro', 99.90, 'monthly', 5, 2, 999999, true, true, true, true, true, 'Plano profissional.'),
('Premium', 199.90, 'monthly', 999, 999, 999999, true, true, true, true, true, 'Plano completo.'),
('Owner', 0, 'lifetime', 999999, 999999, 999999, true, true, true, true, true, 'Plano interno do dono do sistema. Não bloqueia e não vence.')
on conflict(name) do update set
price=excluded.price,
billing_cycle=excluded.billing_cycle,
max_users=excluded.max_users,
max_stores=excluded.max_stores,
max_orders_month=excluded.max_orders_month,
allow_nfce=excluded.allow_nfce,
allow_whatsapp=excluded.allow_whatsapp,
allow_multistore=excluded.allow_multistore,
allow_push=excluded.allow_push,
active=true,
description=excluded.description;

update companies
set owner_company=true,
    blocked=false,
    subscription_status='active',
    block_reason='',
    plan='Owner',
    max_users=999999,
    max_stores=999999,
    max_orders_month=999999,
    logo_url=coalesce(nullif(logo_url,''), '/fixora-logo.png'),
    banner_url=coalesce(nullif(banner_url,''), '/fixora-banner.png')
where id='00000000-0000-0000-0000-000000000001';

update app_users
set master_admin=true,
    company_admin=true,
    role='Administrador',
    active=true,
    password_hash='admin123'
where username='admin';



-- FIXORA ERP - IMPORTAÇÃO EXCEL/CSV DE ESTOQUE
alter table stock_items add column if not exists sku text default '';
alter table stock_items add column if not exists barcode text default '';
alter table stock_items add column if not exists min_quantity numeric default 0;
alter table stock_items add column if not exists brand text default '';
alter table stock_items add column if not exists compatible_model text default '';

create table if not exists stock_import_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  user_name text default '',
  filename text default '',
  total_rows integer default 0,
  inserted_count integer default 0,
  updated_count integer default 0,
  skipped_count integer default 0,
  status text default 'Concluído',
  notes text default '',
  created_at timestamptz default now()
);

alter table stock_import_batches disable row level security;
create index if not exists idx_stock_import_batches_company on stock_import_batches(company_id);
create index if not exists idx_stock_sku_company on stock_items(company_id, sku);
create index if not exists idx_stock_barcode_company on stock_items(company_id, barcode);



-- FIXORA ERP - AUDITORIA FINAL DEFINITIVA
alter table companies add column if not exists owner_company boolean default false;
alter table companies add column if not exists subscription_status text default 'active';
alter table companies add column if not exists subscription_due_date date default (now() + interval '30 days')::date;
alter table companies add column if not exists blocked boolean default false;
alter table companies add column if not exists block_reason text default '';
alter table companies add column if not exists max_users integer default 5;
alter table companies add column if not exists max_stores integer default 1;
alter table companies add column if not exists max_orders_month integer default 999999;
alter table app_users add column if not exists master_admin boolean default false;
alter table app_users add column if not exists company_admin boolean default false;
alter table stock_items add column if not exists sku text default '';
alter table stock_items add column if not exists barcode text default '';
alter table stock_items add column if not exists min_quantity numeric default 0;
alter table stock_items add column if not exists brand text default '';
alter table stock_items add column if not exists compatible_model text default '';

create table if not exists stock_import_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  user_name text default '',
  filename text default '',
  total_rows integer default 0,
  inserted_count integer default 0,
  updated_count integer default 0,
  skipped_count integer default 0,
  status text default 'Concluído',
  notes text default '',
  created_at timestamptz default now()
);

alter table stock_import_batches disable row level security;
update companies set owner_company=true, blocked=false, subscription_status='active', block_reason='', plan='Owner', max_users=999999, max_stores=999999, max_orders_month=999999 where id='00000000-0000-0000-0000-000000000001';
update app_users set master_admin=true, company_admin=true, role='Administrador', active=true, password_hash='admin123' where username='admin';



-- FIXORA ERP - PAINEL ADMIN COMPLETO
alter table companies add column if not exists name text default '';
alter table companies add column if not exists trade_name text default '';
alter table companies add column if not exists document text default '';
alter table companies add column if not exists whatsapp text default '';
alter table companies add column if not exists email text default '';
alter table companies add column if not exists plan text default 'Pro';
alter table companies add column if not exists active boolean default true;
alter table companies add column if not exists owner_company boolean default false;
alter table companies add column if not exists subscription_status text default 'active';
alter table companies add column if not exists subscription_due_date date default (now() + interval '30 days')::date;
alter table companies add column if not exists blocked boolean default false;
alter table companies add column if not exists block_reason text default '';
alter table companies add column if not exists max_users integer default 5;
alter table companies add column if not exists max_stores integer default 1;
alter table companies add column if not exists max_orders_month integer default 999999;
alter table app_users add column if not exists company_id uuid references companies(id) on delete cascade;
alter table app_users add column if not exists username text default '';
alter table app_users add column if not exists password_hash text default '';
alter table app_users add column if not exists full_name text default '';
alter table app_users add column if not exists role text default 'Atendente';
alter table app_users add column if not exists active boolean default true;
alter table app_users add column if not exists master_admin boolean default false;
alter table app_users add column if not exists company_admin boolean default false;
alter table app_users add column if not exists commission_percent numeric default 0;
alter table app_users add column if not exists work_schedule text default '';
alter table app_users add column if not exists manager_approval_required boolean default false;
alter table app_users add column if not exists updated_at timestamptz default now();

create table if not exists saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric default 0,
  billing_cycle text default 'monthly',
  max_users integer default 1,
  max_stores integer default 1,
  max_orders_month integer default 100,
  allow_nfce boolean default false,
  allow_whatsapp boolean default false,
  allow_multistore boolean default false,
  allow_push boolean default false,
  active boolean default true,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  plan_name text default '',
  status text default 'active',
  due_date date default (now() + interval '30 days')::date,
  paid_until date default (now() + interval '30 days')::date,
  blocked boolean default false,
  block_reason text default '',
  payment_method text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table saas_plans disable row level security;
alter table company_subscriptions disable row level security;
insert into companies (id,name,trade_name,plan,active,owner_company,subscription_status,blocked,max_users,max_stores,max_orders_month)
values ('00000000-0000-0000-0000-000000000001','Fixora ERP','Fixora ERP','Owner',true,true,'active',false,999999,999999,999999)
on conflict(id) do update set owner_company=true,blocked=false,subscription_status='active',active=true,plan='Owner',max_users=999999,max_stores=999999,max_orders_month=999999;
insert into app_users (company_id,username,password_hash,full_name,role,active,master_admin,company_admin)
select '00000000-0000-0000-0000-000000000001','admin','admin123','Administrador Master','Administrador',true,true,true
where not exists (select 1 from app_users where username='admin');
update app_users set company_id='00000000-0000-0000-0000-000000000001',password_hash='admin123',active=true,master_admin=true,company_admin=true,role='Administrador' where username='admin';
insert into saas_plans (name,price,billing_cycle,max_users,max_stores,max_orders_month,allow_nfce,allow_whatsapp,allow_multistore,allow_push,active,description)
values
('Básico',49.90,'monthly',2,1,100,false,false,false,false,true,'Plano inicial.'),
('Pro',99.90,'monthly',10,2,500,true,true,true,true,true,'Plano profissional.'),
('Premium',199.90,'monthly',999999,999999,999999,true,true,true,true,true,'Plano completo.'),
('Owner',0,'lifetime',999999,999999,999999,true,true,true,true,true,'Plano interno.')
on conflict(name) do update set price=excluded.price,billing_cycle=excluded.billing_cycle,max_users=excluded.max_users,max_stores=excluded.max_stores,max_orders_month=excluded.max_orders_month,allow_nfce=excluded.allow_nfce,allow_whatsapp=excluded.allow_whatsapp,allow_multistore=excluded.allow_multistore,allow_push=excluded.allow_push,active=excluded.active,description=excluded.description,updated_at=now();



-- FIXORA ERP - AUDITORIA FINAL ADMIN COMPLETO

alter table companies add column if not exists name text default '';
alter table companies add column if not exists trade_name text default '';
alter table companies add column if not exists document text default '';
alter table companies add column if not exists whatsapp text default '';
alter table companies add column if not exists email text default '';
alter table companies add column if not exists plan text default 'Pro';
alter table companies add column if not exists active boolean default true;
alter table companies add column if not exists owner_company boolean default false;
alter table companies add column if not exists subscription_status text default 'active';
alter table companies add column if not exists subscription_due_date date default (now() + interval '30 days')::date;
alter table companies add column if not exists blocked boolean default false;
alter table companies add column if not exists block_reason text default '';
alter table companies add column if not exists max_users integer default 5;
alter table companies add column if not exists max_stores integer default 1;
alter table companies add column if not exists max_orders_month integer default 999999;
alter table companies add column if not exists logo_url text default '';
alter table companies add column if not exists banner_url text default '';

alter table app_users add column if not exists company_id uuid references companies(id) on delete cascade;
alter table app_users add column if not exists username text default '';
alter table app_users add column if not exists password_hash text default '';
alter table app_users add column if not exists full_name text default '';
alter table app_users add column if not exists role text default 'Atendente';
alter table app_users add column if not exists active boolean default true;
alter table app_users add column if not exists master_admin boolean default false;
alter table app_users add column if not exists company_admin boolean default false;
alter table app_users add column if not exists commission_percent numeric default 0;
alter table app_users add column if not exists work_schedule text default '';
alter table app_users add column if not exists manager_approval_required boolean default false;
alter table app_users add column if not exists updated_at timestamptz default now();

create table if not exists saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric default 0,
  billing_cycle text default 'monthly',
  max_users integer default 1,
  max_stores integer default 1,
  max_orders_month integer default 100,
  allow_nfce boolean default false,
  allow_whatsapp boolean default false,
  allow_multistore boolean default false,
  allow_push boolean default false,
  active boolean default true,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  plan_name text default '',
  status text default 'active',
  due_date date default (now() + interval '30 days')::date,
  paid_until date default (now() + interval '30 days')::date,
  blocked boolean default false,
  block_reason text default '',
  payment_method text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table saas_plans disable row level security;
alter table company_subscriptions disable row level security;

insert into companies (id,name,trade_name,plan,active,owner_company,subscription_status,blocked,max_users,max_stores,max_orders_month)
values ('00000000-0000-0000-0000-000000000001','Fixora ERP','Fixora ERP','Owner',true,true,'active',false,999999,999999,999999)
on conflict(id) do update set
  owner_company=true,
  blocked=false,
  subscription_status='active',
  active=true,
  plan='Owner',
  max_users=999999,
  max_stores=999999,
  max_orders_month=999999;

insert into app_users (company_id,username,password_hash,full_name,role,active,master_admin,company_admin)
select '00000000-0000-0000-0000-000000000001','admin','admin123','Administrador Master','Administrador',true,true,true
where not exists (select 1 from app_users where username='admin');

update app_users set
  company_id='00000000-0000-0000-0000-000000000001',
  password_hash='admin123',
  active=true,
  master_admin=true,
  company_admin=true,
  role='Administrador'
where username='admin';

insert into saas_plans (name,price,billing_cycle,max_users,max_stores,max_orders_month,allow_nfce,allow_whatsapp,allow_multistore,allow_push,active,description)
values
('Básico',49.90,'monthly',2,1,100,false,false,false,false,true,'Plano inicial.'),
('Pro',99.90,'monthly',10,2,500,true,true,true,true,true,'Plano profissional.'),
('Premium',199.90,'monthly',999999,999999,999999,true,true,true,true,true,'Plano completo.'),
('Owner',0,'lifetime',999999,999999,999999,true,true,true,true,true,'Plano interno.')
on conflict(name) do update set
price=excluded.price,
billing_cycle=excluded.billing_cycle,
max_users=excluded.max_users,
max_stores=excluded.max_stores,
max_orders_month=excluded.max_orders_month,
allow_nfce=excluded.allow_nfce,
allow_whatsapp=excluded.allow_whatsapp,
allow_multistore=excluded.allow_multistore,
allow_push=excluded.allow_push,
active=excluded.active,
description=excluded.description,
updated_at=now();



-- FIXORA ERP - MENU ORGANIZADO / PAGAMENTOS KEYS
create table if not exists payment_gateways (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  gateway_scope text default 'saas',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists company_payment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table payment_gateways disable row level security;
alter table company_payment_settings disable row level security;



-- FIXORA ERP - AUDITORIA COMPARATIVA FINAL SEM QUEBRAS

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  trade_name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  plan text default 'Pro',
  active boolean default true,
  owner_company boolean default false,
  subscription_status text default 'active',
  subscription_due_date date default (now() + interval '30 days')::date,
  blocked boolean default false,
  block_reason text default '',
  max_users integer default 5,
  max_stores integer default 1,
  max_orders_month integer default 999999,
  logo_url text default '',
  banner_url text default '',
  trial_ends_at date default (now() + interval '15 days')::date,
  grace_days integer default 3,
  auto_renew boolean default false,
  last_payment_at timestamptz,
  next_payment_at date,
  license_notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  username text not null,
  password_hash text default '',
  full_name text default '',
  role text default 'Atendente',
  active boolean default true,
  master_admin boolean default false,
  company_admin boolean default false,
  commission_percent numeric default 0,
  work_schedule text default '',
  manager_approval_required boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table companies add column if not exists name text default '';
alter table companies add column if not exists trade_name text default '';
alter table companies add column if not exists document text default '';
alter table companies add column if not exists whatsapp text default '';
alter table companies add column if not exists email text default '';
alter table companies add column if not exists plan text default 'Pro';
alter table companies add column if not exists active boolean default true;
alter table companies add column if not exists owner_company boolean default false;
alter table companies add column if not exists subscription_status text default 'active';
alter table companies add column if not exists subscription_due_date date default (now() + interval '30 days')::date;
alter table companies add column if not exists blocked boolean default false;
alter table companies add column if not exists block_reason text default '';
alter table companies add column if not exists max_users integer default 5;
alter table companies add column if not exists max_stores integer default 1;
alter table companies add column if not exists max_orders_month integer default 999999;
alter table companies add column if not exists logo_url text default '';
alter table companies add column if not exists banner_url text default '';
alter table companies add column if not exists trial_ends_at date default (now() + interval '15 days')::date;
alter table companies add column if not exists grace_days integer default 3;
alter table companies add column if not exists auto_renew boolean default false;
alter table companies add column if not exists last_payment_at timestamptz;
alter table companies add column if not exists next_payment_at date;
alter table companies add column if not exists license_notes text default '';

alter table app_users add column if not exists company_id uuid references companies(id) on delete cascade;
alter table app_users add column if not exists username text default '';
alter table app_users add column if not exists password_hash text default '';
alter table app_users add column if not exists full_name text default '';
alter table app_users add column if not exists role text default 'Atendente';
alter table app_users add column if not exists active boolean default true;
alter table app_users add column if not exists master_admin boolean default false;
alter table app_users add column if not exists company_admin boolean default false;
alter table app_users add column if not exists commission_percent numeric default 0;
alter table app_users add column if not exists work_schedule text default '';
alter table app_users add column if not exists manager_approval_required boolean default false;
alter table app_users add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_app_users_username_unique on app_users(username);

create table if not exists saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric default 0,
  billing_cycle text default 'monthly',
  max_users integer default 1,
  max_stores integer default 1,
  max_orders_month integer default 100,
  allow_nfce boolean default false,
  allow_whatsapp boolean default false,
  allow_multistore boolean default false,
  allow_push boolean default false,
  active boolean default true,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  plan_name text default '',
  status text default 'active',
  started_at date default now(),
  due_date date default (now() + interval '30 days')::date,
  paid_until date default (now() + interval '30 days')::date,
  trial_ends_at date default (now() + interval '15 days')::date,
  grace_days integer default 3,
  auto_renew boolean default false,
  blocked boolean default false,
  block_reason text default '',
  payment_method text default 'manual',
  last_payment_at timestamptz,
  next_payment_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_gateways (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  gateway_scope text default 'saas',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_payment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  provider text default 'manual',
  external_id text default '',
  external_reference text default '',
  customer_name text default '',
  customer_email text default '',
  customer_document text default '',
  amount numeric default 0,
  description text default '',
  checkout_url text default '',
  pix_qr_code text default '',
  pix_copy_paste text default '',
  due_date date default (now() + interval '3 days')::date,
  paid_at timestamptz,
  status text default 'pending',
  charge_scope text default 'saas',
  raw_payload jsonb default '{}'::jsonb,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists saas_license_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  event_type text not null,
  old_status text default '',
  new_status text default '',
  details text default '',
  created_at timestamptz default now()
);

create table if not exists saas_renewal_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  charge_id uuid references payment_charges(id) on delete set null,
  status text default 'pending',
  amount numeric default 0,
  checkout_url text default '',
  requested_by uuid references app_users(id) on delete set null,
  created_at timestamptz default now(),
  paid_at timestamptz
);

alter table companies disable row level security;
alter table app_users disable row level security;
alter table saas_plans disable row level security;
alter table company_subscriptions disable row level security;
alter table payment_gateways disable row level security;
alter table company_payment_settings disable row level security;
alter table payment_charges disable row level security;
alter table saas_license_events disable row level security;
alter table saas_renewal_requests disable row level security;

insert into companies (id,name,trade_name,plan,active,owner_company,subscription_status,blocked,max_users,max_stores,max_orders_month)
values ('00000000-0000-0000-0000-000000000001','Fixora ERP','Fixora ERP','Owner',true,true,'active',false,999999,999999,999999)
on conflict(id) do update set
  name='Fixora ERP',
  trade_name='Fixora ERP',
  owner_company=true,
  blocked=false,
  subscription_status='active',
  active=true,
  plan='Owner',
  max_users=999999,
  max_stores=999999,
  max_orders_month=999999;

insert into app_users (company_id,username,password_hash,full_name,role,active,master_admin,company_admin)
values ('00000000-0000-0000-0000-000000000001','admin','admin123','Administrador Master','Administrador',true,true,true)
on conflict(username) do update set
  company_id='00000000-0000-0000-0000-000000000001',
  password_hash='admin123',
  full_name='Administrador Master',
  role='Administrador',
  active=true,
  master_admin=true,
  company_admin=true;

insert into saas_plans (name,price,billing_cycle,max_users,max_stores,max_orders_month,allow_nfce,allow_whatsapp,allow_multistore,allow_push,active,description)
values
('Básico',49.90,'monthly',2,1,100,false,false,false,false,true,'Plano inicial.'),
('Pro',99.90,'monthly',10,2,500,true,true,true,true,true,'Plano profissional.'),
('Premium',199.90,'monthly',999999,999999,999999,true,true,true,true,true,'Plano completo.'),
('Owner',0,'lifetime',999999,999999,999999,true,true,true,true,true,'Plano interno.')
on conflict(name) do update set
price=excluded.price,
billing_cycle=excluded.billing_cycle,
max_users=excluded.max_users,
max_stores=excluded.max_stores,
max_orders_month=excluded.max_orders_month,
allow_nfce=excluded.allow_nfce,
allow_whatsapp=excluded.allow_whatsapp,
allow_multistore=excluded.allow_multistore,
allow_push=excluded.allow_push,
active=excluded.active,
description=excluded.description,
updated_at=now();



-- FIXORA ERP - FASES MODULOS AVANCADOS
-- Essa seção adiciona tabelas e campos avançados sem remover dados existentes.

create extension if not exists "pgcrypto";

alter table companies add column if not exists parent_company_id uuid references companies(id) on delete set null;
alter table companies add column if not exists is_branch boolean default false;
alter table companies add column if not exists branch_code text default '';
alter table companies add column if not exists timezone text default 'America/Campo_Grande';

-- Multi-loja avançado
create table if not exists company_branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  document text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  manager_name text default '',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table stock_items add column if not exists branch_id uuid references company_branches(id) on delete set null;
alter table stock_items add column if not exists location text default '';
alter table stock_items add column if not exists warranty_days integer default 0;

create table if not exists stock_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  from_branch_id uuid references company_branches(id) on delete set null,
  to_branch_id uuid references company_branches(id) on delete set null,
  item_id uuid references stock_items(id) on delete set null,
  quantity numeric default 0,
  status text default 'pending',
  notes text default '',
  requested_by uuid references app_users(id) on delete set null,
  approved_by uuid references app_users(id) on delete set null,
  created_at timestamptz default now(),
  approved_at timestamptz
);

-- Assistência técnica avançada
alter table service_orders add column if not exists branch_id uuid references company_branches(id) on delete set null;
alter table service_orders add column if not exists checklist jsonb default '{}'::jsonb;
alter table service_orders add column if not exists device_history text default '';
alter table service_orders add column if not exists warranty_until date;
alter table service_orders add column if not exists entry_signature_url text default '';
alter table service_orders add column if not exists exit_signature_url text default '';
alter table service_orders add column if not exists photos jsonb default '[]'::jsonb;

create table if not exists os_checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  items jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists os_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_order_id uuid references service_orders(id) on delete cascade,
  photo_url text not null,
  caption text default '',
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz default now()
);

-- Financeiro avançado
create table if not exists cost_centers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

alter table financial_entries add column if not exists cost_center_id uuid references cost_centers(id) on delete set null;
alter table financial_entries add column if not exists bank_account_id uuid;
alter table financial_entries add column if not exists reconciled boolean default false;
alter table financial_entries add column if not exists reconciled_at timestamptz;

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  bank_name text default '',
  account_name text default '',
  agency text default '',
  account_number text default '',
  pix_key text default '',
  initial_balance numeric default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists bank_reconciliations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  bank_account_id uuid references bank_accounts(id) on delete cascade,
  reference_month text default '',
  expected_balance numeric default 0,
  actual_balance numeric default 0,
  difference numeric default 0,
  status text default 'open',
  notes text default '',
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- NFC-e estrutural mais completo
create table if not exists fiscal_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  branch_id uuid references company_branches(id) on delete set null,
  environment text default 'homologation',
  uf text default '',
  csc_id text default '',
  csc_token text default '',
  certificate_url text default '',
  certificate_password text default '',
  provider text default 'manual',
  api_token text default '',
  active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists fiscal_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_order_id uuid references service_orders(id) on delete set null,
  sale_id uuid,
  customer_cpf text default '',
  invoice_type text default 'NFC-e',
  status text default 'draft',
  number text default '',
  series text default '',
  access_key text default '',
  xml_url text default '',
  danfe_url text default '',
  total numeric default 0,
  raw_payload jsonb default '{}'::jsonb,
  raw_response jsonb default '{}'::jsonb,
  issued_at timestamptz,
  created_at timestamptz default now()
);

-- WhatsApp/API e Push
create table if not exists whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text default 'manual',
  instance_id text default '',
  api_url text default '',
  api_key text default '',
  phone_number text default '',
  active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists push_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  firebase_project_id text default '',
  firebase_server_key text default '',
  vapid_key text default '',
  active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  endpoint text default '',
  auth text default '',
  p256dh text default '',
  created_at timestamptz default now()
);

-- Segurança
alter table app_users add column if not exists recovery_email text default '';
alter table app_users add column if not exists two_factor_enabled boolean default false;
alter table app_users add column if not exists two_factor_secret text default '';

create table if not exists user_action_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  action text not null,
  module text default '',
  details jsonb default '{}'::jsonb,
  ip_address text default '',
  user_agent text default '',
  created_at timestamptz default now()
);

create table if not exists password_recovery_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  token text not null,
  used boolean default false,
  expires_at timestamptz default (now() + interval '1 hour'),
  created_at timestamptz default now()
);

-- Importação inteligente
create table if not exists import_mappings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  target_module text default 'stock',
  mapping jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- CRM/comercial
create table if not exists crm_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  phone text default '',
  email text default '',
  source text default '',
  stage text default 'novo',
  expected_value numeric default 0,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  client_id uuid,
  title text not null,
  total numeric default 0,
  status text default 'draft',
  valid_until date,
  content text default '',
  created_at timestamptz default now()
);

alter table company_branches disable row level security;
alter table stock_transfers disable row level security;
alter table os_checklists disable row level security;
alter table os_photos disable row level security;
alter table cost_centers disable row level security;
alter table bank_accounts disable row level security;
alter table bank_reconciliations disable row level security;
alter table fiscal_settings disable row level security;
alter table fiscal_invoices disable row level security;
alter table whatsapp_settings disable row level security;
alter table push_settings disable row level security;
alter table push_subscriptions disable row level security;
alter table user_action_logs disable row level security;
alter table password_recovery_tokens disable row level security;
alter table import_mappings disable row level security;
alter table crm_leads disable row level security;
alter table proposals disable row level security;



-- FIXORA ERP - FASE FINAL COMPLETA 100

-- Importação inteligente / histórico e mapeamento
create table if not exists smart_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  target_module text default 'stock',
  filename text default '',
  total_rows integer default 0,
  imported_rows integer default 0,
  updated_rows integer default 0,
  skipped_rows integer default 0,
  status text default 'pending',
  mapping jsonb default '{}'::jsonb,
  preview jsonb default '[]'::jsonb,
  errors jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists bulk_update_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  module text default '',
  action text default '',
  affected_rows integer default 0,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Backup/exportação
create table if not exists export_backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  export_type text default 'full',
  status text default 'created',
  file_url text default '',
  tables_included jsonb default '[]'::jsonb,
  notes text default '',
  created_at timestamptz default now()
);

-- Auditoria avançada
alter table user_action_logs add column if not exists severity text default 'info';
alter table user_action_logs add column if not exists entity_id text default '';
alter table user_action_logs add column if not exists before_data jsonb default '{}'::jsonb;
alter table user_action_logs add column if not exists after_data jsonb default '{}'::jsonb;

-- Notificações internas/push
create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  channel text default 'internal',
  subject text default '',
  body text default '',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  title text default '',
  body text default '',
  channel text default 'internal',
  status text default 'unread',
  link text default '',
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Portal do cliente
create table if not exists customer_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  client_id uuid,
  service_order_id uuid,
  token text not null unique,
  expires_at timestamptz default (now() + interval '30 days'),
  used boolean default false,
  created_at timestamptz default now()
);

create table if not exists customer_feedback (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  client_id uuid,
  service_order_id uuid,
  rating integer default 5,
  comment text default '',
  created_at timestamptz default now()
);

-- Dashboard snapshots
create table if not exists dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  snapshot_date date default current_date,
  total_clients integer default 0,
  total_os integer default 0,
  total_sales numeric default 0,
  total_receivable numeric default 0,
  total_payable numeric default 0,
  stock_value numeric default 0,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Propostas/contratos avançados
alter table proposals add column if not exists accepted_at timestamptz;
alter table proposals add column if not exists signed_by text default '';
alter table proposals add column if not exists signature_url text default '';
alter table proposals add column if not exists public_token text default '';

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  client_id uuid,
  proposal_id uuid references proposals(id) on delete set null,
  title text not null,
  content text default '',
  status text default 'draft',
  signed_at timestamptz,
  signature_url text default '',
  created_at timestamptz default now()
);

-- Permissões granulares por módulo
create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  role text not null,
  module text not null,
  can_view boolean default true,
  can_create boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  created_at timestamptz default now()
);

alter table smart_import_jobs disable row level security;
alter table bulk_update_logs disable row level security;
alter table export_backups disable row level security;
alter table notification_templates disable row level security;
alter table notifications disable row level security;
alter table customer_portal_tokens disable row level security;
alter table customer_feedback disable row level security;
alter table dashboard_snapshots disable row level security;
alter table contracts disable row level security;
alter table role_permissions disable row level security;

create index if not exists idx_notifications_company_user on notifications(company_id,user_id);
create index if not exists idx_customer_portal_tokens_token on customer_portal_tokens(token);
create index if not exists idx_smart_import_jobs_company on smart_import_jobs(company_id);



-- FIXORA ERP - AUDITORIA FINAL 100 FUNCIONAL
create extension if not exists "pgcrypto";

-- Tabelas base com segurança idempotente
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  trade_name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  plan text default 'Pro',
  active boolean default true,
  owner_company boolean default false,
  subscription_status text default 'active',
  subscription_due_date date default (now() + interval '30 days')::date,
  blocked boolean default false,
  block_reason text default '',
  max_users integer default 5,
  max_stores integer default 1,
  max_orders_month integer default 999999,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  username text not null,
  password_hash text default '',
  full_name text default '',
  role text default 'Atendente',
  active boolean default true,
  master_admin boolean default false,
  company_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_app_users_username_unique on app_users(username);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  created_at timestamptz default now()
);

create table if not exists stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text default '',
  category text default '',
  quantity numeric default 0,
  cost_price numeric default 0,
  sale_price numeric default 0,
  sku text default '',
  barcode text default '',
  brand text default '',
  compatible_model text default '',
  created_at timestamptz default now()
);

create table if not exists service_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text default '',
  description text default '',
  price numeric default 0,
  created_at timestamptz default now()
);

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  client_id uuid,
  technician_id uuid,
  status text default 'Aberta',
  device text default '',
  defect text default '',
  solution text default '',
  total_value numeric default 0,
  created_at timestamptz default now()
);

create table if not exists quick_sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  total_value numeric default 0,
  created_at timestamptz default now()
);

create table if not exists financial_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  type text default 'receivable',
  description text default '',
  amount numeric default 0,
  status text default 'open',
  due_date date,
  created_at timestamptz default now()
);

-- Campos adicionais idempotentes
alter table companies add column if not exists logo_url text default '';
alter table companies add column if not exists banner_url text default '';
alter table companies add column if not exists trial_ends_at date default (now() + interval '15 days')::date;
alter table companies add column if not exists grace_days integer default 3;
alter table companies add column if not exists auto_renew boolean default false;
alter table companies add column if not exists last_payment_at timestamptz;
alter table companies add column if not exists next_payment_at date;
alter table companies add column if not exists license_notes text default '';
alter table companies add column if not exists parent_company_id uuid references companies(id) on delete set null;
alter table companies add column if not exists is_branch boolean default false;
alter table companies add column if not exists branch_code text default '';
alter table companies add column if not exists timezone text default 'America/Campo_Grande';

alter table app_users add column if not exists recovery_email text default '';
alter table app_users add column if not exists two_factor_enabled boolean default false;
alter table app_users add column if not exists two_factor_secret text default '';
alter table app_users add column if not exists commission_percent numeric default 0;
alter table app_users add column if not exists work_schedule text default '';
alter table app_users add column if not exists manager_approval_required boolean default false;

-- Garantia de tabelas dos módulos avançados
create table if not exists saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric default 0,
  billing_cycle text default 'monthly',
  max_users integer default 1,
  max_stores integer default 1,
  max_orders_month integer default 100,
  allow_nfce boolean default false,
  allow_whatsapp boolean default false,
  allow_multistore boolean default false,
  allow_push boolean default false,
  active boolean default true,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  plan_name text default '',
  status text default 'active',
  started_at date default now(),
  due_date date default (now() + interval '30 days')::date,
  paid_until date default (now() + interval '30 days')::date,
  trial_ends_at date default (now() + interval '15 days')::date,
  grace_days integer default 3,
  auto_renew boolean default false,
  blocked boolean default false,
  block_reason text default '',
  payment_method text default 'manual',
  last_payment_at timestamptz,
  next_payment_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_gateways (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  gateway_scope text default 'saas',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_payment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  provider text default 'manual',
  external_id text default '',
  external_reference text default '',
  customer_name text default '',
  customer_email text default '',
  customer_document text default '',
  amount numeric default 0,
  description text default '',
  checkout_url text default '',
  pix_qr_code text default '',
  pix_copy_paste text default '',
  due_date date default (now() + interval '3 days')::date,
  paid_at timestamptz,
  status text default 'pending',
  charge_scope text default 'saas',
  raw_payload jsonb default '{}'::jsonb,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  document text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  manager_name text default '',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists stock_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  from_branch_id uuid references company_branches(id) on delete set null,
  to_branch_id uuid references company_branches(id) on delete set null,
  item_id uuid references stock_items(id) on delete set null,
  quantity numeric default 0,
  status text default 'pending',
  notes text default '',
  requested_by uuid references app_users(id) on delete set null,
  approved_by uuid references app_users(id) on delete set null,
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table if not exists smart_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  target_module text default 'stock',
  filename text default '',
  total_rows integer default 0,
  imported_rows integer default 0,
  updated_rows integer default 0,
  skipped_rows integer default 0,
  status text default 'pending',
  mapping jsonb default '{}'::jsonb,
  preview jsonb default '[]'::jsonb,
  errors jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists export_backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  export_type text default 'full',
  status text default 'created',
  file_url text default '',
  tables_included jsonb default '[]'::jsonb,
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists user_action_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  action text not null,
  module text default '',
  details jsonb default '{}'::jsonb,
  ip_address text default '',
  user_agent text default '',
  severity text default 'info',
  entity_id text default '',
  before_data jsonb default '{}'::jsonb,
  after_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  title text default '',
  body text default '',
  channel text default 'internal',
  status text default 'unread',
  link text default '',
  created_at timestamptz default now(),
  read_at timestamptz
);

create table if not exists crm_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  phone text default '',
  email text default '',
  source text default '',
  stage text default 'novo',
  expected_value numeric default 0,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Desabilitar RLS para evitar quebra inicial do app com anon/service
alter table companies disable row level security;
alter table app_users disable row level security;
alter table clients disable row level security;
alter table suppliers disable row level security;
alter table stock_items disable row level security;
alter table service_catalog disable row level security;
alter table service_orders disable row level security;
alter table quick_sales disable row level security;
alter table financial_entries disable row level security;
alter table saas_plans disable row level security;
alter table company_subscriptions disable row level security;
alter table payment_gateways disable row level security;
alter table company_payment_settings disable row level security;
alter table payment_charges disable row level security;
alter table company_branches disable row level security;
alter table stock_transfers disable row level security;
alter table smart_import_jobs disable row level security;
alter table export_backups disable row level security;
alter table user_action_logs disable row level security;
alter table notifications disable row level security;
alter table crm_leads disable row level security;

-- Dados iniciais
insert into companies (id,name,trade_name,plan,active,owner_company,subscription_status,blocked,max_users,max_stores,max_orders_month)
values ('00000000-0000-0000-0000-000000000001','Fixora ERP','Fixora ERP','Owner',true,true,'active',false,999999,999999,999999)
on conflict(id) do update set
  name='Fixora ERP',
  trade_name='Fixora ERP',
  owner_company=true,
  blocked=false,
  subscription_status='active',
  active=true,
  plan='Owner',
  max_users=999999,
  max_stores=999999,
  max_orders_month=999999;

insert into app_users (company_id,username,password_hash,full_name,role,active,master_admin,company_admin)
values ('00000000-0000-0000-0000-000000000001','admin','admin123','Administrador Master','Administrador',true,true,true)
on conflict(username) do update set
  company_id='00000000-0000-0000-0000-000000000001',
  password_hash='admin123',
  full_name='Administrador Master',
  role='Administrador',
  active=true,
  master_admin=true,
  company_admin=true;

insert into saas_plans (name,price,billing_cycle,max_users,max_stores,max_orders_month,allow_nfce,allow_whatsapp,allow_multistore,allow_push,active,description)
values
('Básico',49.90,'monthly',2,1,100,false,false,false,false,true,'Plano inicial.'),
('Pro',99.90,'monthly',10,2,500,true,true,true,true,true,'Plano profissional.'),
('Premium',199.90,'monthly',999999,999999,999999,true,true,true,true,true,'Plano completo.'),
('Owner',0,'lifetime',999999,999999,999999,true,true,true,true,true,'Plano interno.')
on conflict(name) do update set
price=excluded.price,
billing_cycle=excluded.billing_cycle,
max_users=excluded.max_users,
max_stores=excluded.max_stores,
max_orders_month=excluded.max_orders_month,
allow_nfce=excluded.allow_nfce,
allow_whatsapp=excluded.allow_whatsapp,
allow_multistore=excluded.allow_multistore,
allow_push=excluded.allow_push,
active=excluded.active,
description=excluded.description,
updated_at=now();



-- FIXORA ERP - BRANDING GLOBAL SEPARADO DA EMPRESA
create table if not exists system_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000999',
  system_name text default 'Fixora ERP',
  system_subtitle text default 'Gestão SaaS para assistência técnica',
  system_logo_url text default '',
  system_banner_url text default '',
  system_icon_url text default '',
  system_favicon_url text default '',
  primary_color text default '#f59e0b',
  support_whatsapp text default '',
  support_email text default '',
  login_message text default 'Acesse sua conta para continuar.',
  footer_text text default 'Fixora ERP',
  allow_company_login_branding boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table system_settings disable row level security;

insert into system_settings (
  id, system_name, system_subtitle, system_logo_url, system_banner_url,
  system_icon_url, system_favicon_url, primary_color, login_message, footer_text,
  allow_company_login_branding
)
values (
  '00000000-0000-0000-0000-000000000999',
  'Fixora ERP',
  'Gestão SaaS para assistência técnica',
  '',
  '',
  '',
  '',
  '#f59e0b',
  'Acesse sua conta para continuar.',
  'Fixora ERP',
  false
)
on conflict(id) do update set
  system_name = coalesce(nullif(system_settings.system_name,''), 'Fixora ERP'),
  system_subtitle = coalesce(nullif(system_settings.system_subtitle,''), 'Gestão SaaS para assistência técnica'),
  updated_at = now();

alter table companies add column if not exists logo_url text default '';
alter table companies add column if not exists banner_url text default '';
alter table companies add column if not exists brand_color text default '';
alter table companies add column if not exists portal_message text default '';



-- FIXORA ERP - AUDITORIA DEFINITIVA FINAL

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  trade_name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  plan text default 'Pro',
  active boolean default true,
  owner_company boolean default false,
  subscription_status text default 'active',
  subscription_due_date date default (now() + interval '30 days')::date,
  blocked boolean default false,
  block_reason text default '',
  max_users integer default 5,
  max_stores integer default 1,
  max_orders_month integer default 999999,
  logo_url text default '',
  banner_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  username text not null,
  password_hash text default '',
  full_name text default '',
  role text default 'Atendente',
  active boolean default true,
  master_admin boolean default false,
  company_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_app_users_username_unique on app_users(username);

create table if not exists system_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000999',
  system_name text default 'Fixora ERP',
  system_subtitle text default 'Gestão SaaS para assistência técnica',
  system_logo_url text default '',
  system_banner_url text default '',
  system_icon_url text default '',
  system_favicon_url text default '',
  primary_color text default '#f59e0b',
  support_whatsapp text default '',
  support_email text default '',
  login_message text default 'Acesse sua conta para continuar.',
  footer_text text default 'Fixora ERP',
  allow_company_login_branding boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  cep text default '',
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text default '',
  document text default '',
  whatsapp text default '',
  email text default '',
  created_at timestamptz default now()
);

create table if not exists stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  name text default '',
  category text default '',
  quantity numeric default 0,
  cost_price numeric default 0,
  sale_price numeric default 0,
  sku text default '',
  barcode text default '',
  brand text default '',
  compatible_model text default '',
  image_url text default '',
  created_at timestamptz default now()
);

create table if not exists service_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text default '',
  description text default '',
  price numeric default 0,
  image_url text default '',
  created_at timestamptz default now()
);

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  client_id uuid,
  technician_id uuid,
  status text default 'Aberta',
  device text default '',
  defect text default '',
  solution text default '',
  total_value numeric default 0,
  checklist jsonb default '{}'::jsonb,
  photos jsonb default '[]'::jsonb,
  entry_signature_url text default '',
  exit_signature_url text default '',
  warranty_until date,
  created_at timestamptz default now()
);

create table if not exists quick_sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  total_value numeric default 0,
  created_at timestamptz default now()
);

create table if not exists financial_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  type text default 'receivable',
  description text default '',
  amount numeric default 0,
  status text default 'open',
  due_date date,
  created_at timestamptz default now()
);

-- Campos idempotentes
alter table companies add column if not exists logo_url text default '';
alter table companies add column if not exists banner_url text default '';
alter table companies add column if not exists brand_color text default '';
alter table companies add column if not exists portal_message text default '';
alter table companies add column if not exists trial_ends_at date default (now() + interval '15 days')::date;
alter table companies add column if not exists grace_days integer default 3;
alter table companies add column if not exists auto_renew boolean default false;
alter table companies add column if not exists last_payment_at timestamptz;
alter table companies add column if not exists next_payment_at date;
alter table companies add column if not exists license_notes text default '';
alter table companies add column if not exists parent_company_id uuid references companies(id) on delete set null;
alter table companies add column if not exists is_branch boolean default false;
alter table companies add column if not exists branch_code text default '';
alter table companies add column if not exists timezone text default 'America/Campo_Grande';

alter table app_users add column if not exists recovery_email text default '';
alter table app_users add column if not exists two_factor_enabled boolean default false;
alter table app_users add column if not exists two_factor_secret text default '';
alter table app_users add column if not exists commission_percent numeric default 0;
alter table app_users add column if not exists work_schedule text default '';
alter table app_users add column if not exists manager_approval_required boolean default false;

alter table clients add column if not exists cep text default '';
alter table clients add column if not exists address text default '';
alter table stock_items add column if not exists supplier_id uuid references suppliers(id) on delete set null;
alter table stock_items add column if not exists image_url text default '';
alter table stock_items add column if not exists branch_id uuid;
alter table stock_items add column if not exists location text default '';
alter table stock_items add column if not exists warranty_days integer default 0;
alter table service_catalog add column if not exists image_url text default '';
alter table service_orders add column if not exists checklist jsonb default '{}'::jsonb;
alter table service_orders add column if not exists photos jsonb default '[]'::jsonb;
alter table service_orders add column if not exists entry_signature_url text default '';
alter table service_orders add column if not exists exit_signature_url text default '';
alter table service_orders add column if not exists warranty_until date;

-- Tabelas SaaS e módulos
create table if not exists saas_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric default 0,
  billing_cycle text default 'monthly',
  max_users integer default 1,
  max_stores integer default 1,
  max_orders_month integer default 100,
  allow_nfce boolean default false,
  allow_whatsapp boolean default false,
  allow_multistore boolean default false,
  allow_push boolean default false,
  active boolean default true,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  plan_name text default '',
  status text default 'active',
  due_date date default (now() + interval '30 days')::date,
  paid_until date default (now() + interval '30 days')::date,
  blocked boolean default false,
  block_reason text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_gateways (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  gateway_scope text default 'saas',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_payment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  provider text not null default 'manual',
  display_name text default '',
  api_base_url text default '',
  access_token text default '',
  public_key text default '',
  webhook_secret text default '',
  pix_key text default '',
  success_url text default '',
  failure_url text default '',
  notification_url text default '',
  active boolean default false,
  sandbox boolean default true,
  instructions text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references saas_plans(id) on delete set null,
  provider text default 'manual',
  external_id text default '',
  external_reference text default '',
  customer_name text default '',
  customer_email text default '',
  customer_document text default '',
  amount numeric default 0,
  description text default '',
  checkout_url text default '',
  pix_qr_code text default '',
  pix_copy_paste text default '',
  due_date date default (now() + interval '3 days')::date,
  paid_at timestamptz,
  status text default 'pending',
  charge_scope text default 'saas',
  raw_payload jsonb default '{}'::jsonb,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists company_branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  document text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  manager_name text default '',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists stock_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  from_branch_id uuid references company_branches(id) on delete set null,
  to_branch_id uuid references company_branches(id) on delete set null,
  item_id uuid references stock_items(id) on delete set null,
  quantity numeric default 0,
  status text default 'pending',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists crm_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  phone text default '',
  email text default '',
  source text default '',
  stage text default 'novo',
  expected_value numeric default 0,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  title text default '',
  body text default '',
  channel text default 'internal',
  status text default 'unread',
  link text default '',
  created_at timestamptz default now(),
  read_at timestamptz
);

create table if not exists user_action_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  action text not null,
  module text default '',
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists smart_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  target_module text default 'stock',
  filename text default '',
  total_rows integer default 0,
  imported_rows integer default 0,
  updated_rows integer default 0,
  skipped_rows integer default 0,
  status text default 'pending',
  mapping jsonb default '{}'::jsonb,
  preview jsonb default '[]'::jsonb,
  errors jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists export_backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  export_type text default 'full',
  status text default 'created',
  file_url text default '',
  tables_included jsonb default '[]'::jsonb,
  notes text default '',
  created_at timestamptz default now()
);

-- RLS desativado para evitar bloqueio inicial do app
alter table companies disable row level security;
alter table app_users disable row level security;
alter table system_settings disable row level security;
alter table clients disable row level security;
alter table suppliers disable row level security;
alter table stock_items disable row level security;
alter table service_catalog disable row level security;
alter table service_orders disable row level security;
alter table quick_sales disable row level security;
alter table financial_entries disable row level security;
alter table saas_plans disable row level security;
alter table company_subscriptions disable row level security;
alter table payment_gateways disable row level security;
alter table company_payment_settings disable row level security;
alter table payment_charges disable row level security;
alter table company_branches disable row level security;
alter table stock_transfers disable row level security;
alter table crm_leads disable row level security;
alter table notifications disable row level security;
alter table user_action_logs disable row level security;
alter table smart_import_jobs disable row level security;
alter table export_backups disable row level security;

-- Dados iniciais
insert into system_settings (id, system_name, system_subtitle, login_message, footer_text)
values ('00000000-0000-0000-0000-000000000999','Fixora ERP','Gestão SaaS para assistência técnica','Acesse sua conta para continuar.','Fixora ERP')
on conflict(id) do update set
  system_name='Fixora ERP',
  system_subtitle=coalesce(nullif(system_settings.system_subtitle,''),'Gestão SaaS para assistência técnica'),
  updated_at=now();

insert into companies (id,name,trade_name,plan,active,owner_company,subscription_status,blocked,max_users,max_stores,max_orders_month)
values ('00000000-0000-0000-0000-000000000001','Fixora ERP','Fixora ERP','Owner',true,true,'active',false,999999,999999,999999)
on conflict(id) do update set
  name='Fixora ERP',
  trade_name='Fixora ERP',
  owner_company=true,
  blocked=false,
  subscription_status='active',
  active=true,
  plan='Owner',
  max_users=999999,
  max_stores=999999,
  max_orders_month=999999;

insert into app_users (company_id,username,password_hash,full_name,role,active,master_admin,company_admin)
values ('00000000-0000-0000-0000-000000000001','admin','admin123','Administrador Master','Administrador',true,true,true)
on conflict(username) do update set
  company_id='00000000-0000-0000-0000-000000000001',
  password_hash='admin123',
  full_name='Administrador Master',
  role='Administrador',
  active=true,
  master_admin=true,
  company_admin=true;

insert into saas_plans (name,price,billing_cycle,max_users,max_stores,max_orders_month,allow_nfce,allow_whatsapp,allow_multistore,allow_push,active,description)
values
('Básico',49.90,'monthly',2,1,100,false,false,false,false,true,'Plano inicial.'),
('Pro',99.90,'monthly',10,2,500,true,true,true,true,true,'Plano profissional.'),
('Premium',199.90,'monthly',999999,999999,999999,true,true,true,true,true,'Plano completo.'),
('Owner',0,'lifetime',999999,999999,999999,true,true,true,true,true,'Plano interno.')
on conflict(name) do update set
price=excluded.price,
billing_cycle=excluded.billing_cycle,
max_users=excluded.max_users,
max_stores=excluded.max_stores,
max_orders_month=excluded.max_orders_month,
allow_nfce=excluded.allow_nfce,
allow_whatsapp=excluded.allow_whatsapp,
allow_multistore=excluded.allow_multistore,
allow_push=excluded.allow_push,
active=excluded.active,
description=excluded.description,
updated_at=now();
