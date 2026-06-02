-- Admin inicial
-- Usuário: admin
-- Senha: admin123

insert into companies (id, name, trade_name)
values ('00000000-0000-0000-0000-000000000001', 'Fixora', 'Fixora ERP')
on conflict (id) do nothing;

insert into app_users (
  company_id,
  full_name,
  username,
  password_hash,
  role,
  active
)
values (
  '00000000-0000-0000-0000-000000000001',
  'Administrador',
  'admin',
  '$2a$10$Z1Kj9lYo50sgoM/rtw2FcOfZ3Ovr2rmvjgrkL1TYHQ0cqT4ciL6nW',
  'Administrador',
  true
)
on conflict (username) do nothing;
