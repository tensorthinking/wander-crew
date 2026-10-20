-- Wander Crew: chat replies, structured cards, polls, and admin reset.
-- Run once in Supabase → SQL Editor. Safe to run again.

alter table public.chat_messages add column if not exists reply_to bigint references public.chat_messages(id) on delete set null;
alter table public.chat_messages add column if not exists data jsonb;
alter table public.chat_messages drop constraint if exists chat_messages_kind_check;
alter table public.chat_messages add constraint chat_messages_kind_check check (kind in ('msg','system','ai','poll','card'));

drop policy if exists "crew posts chat" on public.chat_messages;
create policy "crew posts chat" on public.chat_messages for insert
  with check (public.is_crew() and user_id = auth.uid() and kind in ('msg','system','poll','card'));
drop policy if exists "admins clear chat" on public.chat_messages;
create policy "admins clear chat" on public.chat_messages for delete using (public.is_crew_admin() or user_id = auth.uid());

create table if not exists public.poll_votes (
  message_id bigint not null references public.chat_messages(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  option     smallint not null check (option >= 0 and option < 10),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.poll_votes enable row level security;
drop policy if exists "crew reads poll votes" on public.poll_votes;
create policy "crew reads poll votes" on public.poll_votes for select using (public.is_crew());
drop policy if exists "own poll vote add" on public.poll_votes;
create policy "own poll vote add" on public.poll_votes for insert with check (public.is_crew() and user_id = auth.uid());
drop policy if exists "own poll vote change" on public.poll_votes;
create policy "own poll vote change" on public.poll_votes for update using (user_id = auth.uid()) with check (public.is_crew() and user_id = auth.uid());
drop policy if exists "own poll vote remove" on public.poll_votes;
create policy "own poll vote remove" on public.poll_votes for delete using (user_id = auth.uid());

do $$ begin
  begin execute 'alter publication supabase_realtime add table public.poll_votes'; exception when duplicate_object then null; end;
end $$;
