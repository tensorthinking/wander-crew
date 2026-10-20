-- Wander Crew database. Run once in the Supabase SQL editor (or via migration).
-- Only emails in crew_allowlist can read or write anything.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- access
create table if not exists public.crew_allowlist (
  email     text primary key,
  is_admin  boolean not null default false,
  added_at  timestamptz not null default now()
);

create or replace function public.is_crew() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.crew_allowlist where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.is_crew_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.crew_allowlist where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and is_admin);
$$;

alter table public.crew_allowlist enable row level security;
drop policy if exists "admins read allowlist" on public.crew_allowlist;
create policy "admins read allowlist" on public.crew_allowlist for select using (public.is_crew_admin());
drop policy if exists "admins add" on public.crew_allowlist;
create policy "admins add" on public.crew_allowlist for insert with check (public.is_crew_admin());
drop policy if exists "admins remove" on public.crew_allowlist;
create policy "admins remove" on public.crew_allowlist for delete using (public.is_crew_admin() and lower(email) <> lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------- people
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  last_seen   timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "crew reads profiles" on public.profiles;
create policy "crew reads profiles" on public.profiles for select using (public.is_crew());
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (public.is_crew() and id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (public.is_crew() and id = auth.uid());

-- ---------------------------------------------------------------- trips
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  dest_key    text not null,
  form        jsonb not null,
  estimate    jsonb,
  plan        jsonb not null,
  total       integer,
  created_at  timestamptz not null default now()
);
alter table public.trips enable row level security;
drop policy if exists "crew reads trips" on public.trips;
create policy "crew reads trips" on public.trips for select using (public.is_crew());
drop policy if exists "crew adds trips" on public.trips;
create policy "crew adds trips" on public.trips for insert with check (public.is_crew() and created_by = auth.uid());
drop policy if exists "owner or admin deletes trips" on public.trips;
create policy "owner or admin deletes trips" on public.trips for delete using (created_by = auth.uid() or public.is_crew_admin());

create table if not exists public.trip_votes (
  trip_id  uuid references public.trips(id) on delete cascade,
  user_id  uuid default auth.uid() references public.profiles(id) on delete cascade,
  primary key (trip_id, user_id)
);
alter table public.trip_votes enable row level security;
drop policy if exists "crew reads votes" on public.trip_votes;
create policy "crew reads votes" on public.trip_votes for select using (public.is_crew());
drop policy if exists "own vote add" on public.trip_votes;
create policy "own vote add" on public.trip_votes for insert with check (public.is_crew() and user_id = auth.uid());
drop policy if exists "own vote remove" on public.trip_votes;
create policy "own vote remove" on public.trip_votes for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------- chat & ideas
create table if not exists public.chat_messages (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete set null,   -- null = Wander (the AI)
  kind        text not null default 'msg' check (kind in ('msg','system','ai')),
  body        text not null check (char_length(body) <= 2000),
  created_at  timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
drop policy if exists "crew reads chat" on public.chat_messages;
create policy "crew reads chat" on public.chat_messages for select using (public.is_crew());
drop policy if exists "crew posts chat" on public.chat_messages;
create policy "crew posts chat" on public.chat_messages for insert with check (public.is_crew() and user_id = auth.uid() and kind in ('msg','system'));

create table if not exists public.ideas (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete set null,   -- null = Wander
  body        text not null check (char_length(body) <= 240),
  color       smallint not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.ideas enable row level security;
drop policy if exists "crew reads ideas" on public.ideas;
create policy "crew reads ideas" on public.ideas for select using (public.is_crew());
drop policy if exists "crew adds ideas" on public.ideas;
create policy "crew adds ideas" on public.ideas for insert with check (public.is_crew() and user_id = auth.uid());
drop policy if exists "owner or admin deletes ideas" on public.ideas;
create policy "owner or admin deletes ideas" on public.ideas for delete using (user_id = auth.uid() or public.is_crew_admin());

create table if not exists public.idea_votes (
  idea_id  bigint references public.ideas(id) on delete cascade,
  user_id  uuid default auth.uid() references public.profiles(id) on delete cascade,
  primary key (idea_id, user_id)
);
alter table public.idea_votes enable row level security;
drop policy if exists "crew reads idea votes" on public.idea_votes;
create policy "crew reads idea votes" on public.idea_votes for select using (public.is_crew());
drop policy if exists "own idea vote add" on public.idea_votes;
create policy "own idea vote add" on public.idea_votes for insert with check (public.is_crew() and user_id = auth.uid());
drop policy if exists "own idea vote remove" on public.idea_votes;
create policy "own idea vote remove" on public.idea_votes for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------- games
create table if not exists public.game_state (
  id          text primary key check (id in ('spin','quiz','tot')),
  data        jsonb not null,
  updated_by  uuid default auth.uid(),
  updated_at  timestamptz not null default now()
);
alter table public.game_state enable row level security;
drop policy if exists "crew reads games" on public.game_state;
create policy "crew reads games" on public.game_state for select using (public.is_crew());
drop policy if exists "crew starts games" on public.game_state;
create policy "crew starts games" on public.game_state for insert with check (public.is_crew());
drop policy if exists "crew updates games" on public.game_state;
create policy "crew updates games" on public.game_state for update using (public.is_crew()) with check (public.is_crew());

create table if not exists public.game_moves (
  game        text not null check (game in ('quiz','tot')),
  round_id    text not null,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (game, round_id, user_id)
);
alter table public.game_moves enable row level security;
drop policy if exists "crew reads moves" on public.game_moves;
create policy "crew reads moves" on public.game_moves for select using (public.is_crew());
drop policy if exists "own move add" on public.game_moves;
create policy "own move add" on public.game_moves for insert with check (public.is_crew() and user_id = auth.uid());
drop policy if exists "own move update" on public.game_moves;
create policy "own move update" on public.game_moves for update using (user_id = auth.uid()) with check (public.is_crew() and user_id = auth.uid());

-- ---------------------------------------------------------------- AI usage cap (written by the edge function only)
create table if not exists public.ai_usage (
  user_id  uuid not null,
  day      date not null default current_date,
  calls    integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;   -- no policies: only the service role touches it

create or replace function public.bump_ai_usage(p_user uuid, p_limit integer) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.ai_usage(user_id, day, calls) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set calls = public.ai_usage.calls + 1
  returning calls into n;
  if n > p_limit then return -1; end if;
  return n;
end $$;
revoke all on function public.bump_ai_usage(uuid, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------- realtime
do $$
declare t text;
begin
  foreach t in array array['profiles','trips','trip_votes','chat_messages','ideas','idea_votes','game_state','game_moves'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
