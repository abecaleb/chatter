create extension if not exists pgcrypto;

create table if not exists approved_users (
  email text primary key,
  created_at timestamptz default now()
);

create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'main',
  content text not null,
  sender_name text not null,
  sender_type text not null check (sender_type in ('user', 'ai', 'system')),
  created_at timestamptz not null default now()
);

create table if not exists training_snippets (
  id uuid primary key default gen_random_uuid(),
  snippet text not null,
  created_at timestamptz not null default now()
);

alter table approved_users enable row level security;
alter table access_requests enable row level security;
alter table messages enable row level security;
alter table training_snippets enable row level security;

drop policy if exists "approved users can read messages" on messages;
create policy "approved users can read messages" on messages
for select to authenticated using (
  auth.email() in (select email from approved_users)
);

drop policy if exists "approved users can insert messages" on messages;
create policy "approved users can insert messages" on messages
for insert to authenticated with check (
  auth.email() in (select email from approved_users)
);

alter publication supabase_realtime add table messages;
