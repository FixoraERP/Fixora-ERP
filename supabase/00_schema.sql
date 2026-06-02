create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Fixora',
  trade_name text default '',
  document text default '',
  phone text default '',
  whatsapp text default '',
  email text default '',
  address text default '',
  city text default '',
  state text default '',
  zip_code text default '',
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
  phone text default '',
  whatsapp text default '',
  email text default '',
  document text default '',
  address text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  client_name text default '',
  brand text default '',
  model text default '',
  imei text default '',
  password text default '',
  accessories text default '',
  device_state text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  category text default '',
  quantity numeric default 0,
  cost numeric default 0,
  sale_price numeric default 0,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  os_number text not null,
  client_id uuid references clients(id) on delete set null,
  client_name text default '',
  device_id uuid references devices(id) on delete set null,
  device_desc text default '',
  issue_reported text default '',
  diagnosis text default '',
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

insert into storage.buckets (id, name, public)
values ('os-images', 'os-images', true)
on conflict (id) do nothing;

drop policy if exists os_images_public_select on storage.objects;
drop policy if exists os_images_auth_insert on storage.objects;
drop policy if exists os_images_auth_update on storage.objects;
drop policy if exists os_images_auth_delete on storage.objects;

create policy os_images_public_select on storage.objects for select using (bucket_id = 'os-images');
create policy os_images_auth_insert on storage.objects for insert with check (bucket_id = 'os-images');
create policy os_images_auth_update on storage.objects for update using (bucket_id = 'os-images');
create policy os_images_auth_delete on storage.objects for delete using (bucket_id = 'os-images');

alter table companies disable row level security;
alter table app_users disable row level security;
alter table clients disable row level security;
alter table devices disable row level security;
alter table stock_items disable row level security;
alter table service_orders disable row level security;
alter table service_order_images disable row level security;
alter table budget_items disable row level security;
alter table financial_entries disable row level security;

create index if not exists idx_users_username on app_users(username);
create index if not exists idx_clients_company on clients(company_id);
create index if not exists idx_os_company on service_orders(company_id);
create index if not exists idx_images_os on service_order_images(service_order_id);
create index if not exists idx_budget_items_os on budget_items(service_order_id);
