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

-- Indexes for performance
create index if not exists idx_messages_room_created on messages (room_id, created_at);
create index if not exists idx_access_requests_status on access_requests (status);

-- Enable RLS
alter table approved_users enable row level security;
alter table access_requests enable row level security;
alter table messages enable row level security;
alter table training_snippets enable row level security;

-- Messages: approved users can read and insert
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

-- Approved users: let authenticated users check their own approval status
drop policy if exists "users can check own approval" on approved_users;
create policy "users can check own approval" on approved_users
for select to authenticated using (
  email = auth.email()
);

-- Access requests: anyone can insert (public request form uses service role,
-- but this policy exists for completeness)
drop policy if exists "public can insert access requests" on access_requests;
create policy "public can insert access requests" on access_requests
for insert to anon, authenticated with check (true);

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
