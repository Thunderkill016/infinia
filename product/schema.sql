-- product/schema.sql — backend Supabase (region Singapore) cho INFINIA.
-- Chạy trong Supabase SQL Editor. Nguyên tắc: user chỉ đọc/ghi của mình,
-- leaderboard chỉ insert (không update/delete), điểm nghi vấn gắn cờ ẩn khỏi top.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Dân làng',
  created_at timestamptz not null default now()
);
create table if not exists saves (
  user_id uuid primary key references profiles on delete cascade,
  game_state jsonb not null,
  version text not null default '13',
  checksum text,
  updated_at timestamptz not null default now()
);
create table if not exists leaderboard_scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  mode text not null default 'inf', -- 'inf' | 'level' | 'fish'
  score bigint not null check (score >= 0),
  nonce uuid not null unique,            -- chống replay submit
  client_ts timestamptz not null,
  server_ts timestamptz not null default now(),
  is_suspect boolean not null default false
);
create table if not exists events (
  id text primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  config jsonb not null default '{}'
);
create table if not exists event_progress (
  user_id uuid not null references profiles on delete cascade,
  event_id text not null references events on delete cascade,
  progress jsonb not null default '{}',
  primary key (user_id, event_id)
);
create table if not exists remote_config (
  key text primary key,
  value jsonb not null
);
alter table profiles enable row level security;
alter table saves enable row level security;
alter table leaderboard_scores enable row level security;
alter table event_progress enable row level security;
drop policy if exists "own-profile" on profiles;
create policy "own-profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "own-save" on saves;
create policy "own-save" on saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own-progress" on event_progress;
create policy "own-progress" on event_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "scores-insert" on leaderboard_scores;
create policy "scores-insert" on leaderboard_scores for insert with check (auth.uid() = user_id);
drop policy if exists "scores-read" on leaderboard_scores;
create policy "scores-read" on leaderboard_scores for select using (not is_suspect);
insert into remote_config(key, value) values
  ('drop_rate_mult', '1.0'), ('event_active', '"ram-thang-8"'),
  ('maintenance', 'false'), ('min_client_version', '"11"')
on conflict (key) do nothing;
