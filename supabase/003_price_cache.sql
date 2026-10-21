-- Shared cache for live Google Flights / Google Hotels prices (written only by the wander-ai function).
create table if not exists public.price_cache (
  key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.price_cache enable row level security;
-- no policies: only the server function (service role) reads and writes it
