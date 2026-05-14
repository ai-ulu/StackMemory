-- Token optimization telemetry foundation.
-- Safe to run multiple times.

create table if not exists ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id text,
  agent_id text,
  provider text not null default 'unknown',
  model text not null default 'unknown',
  request_id text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cached_input_tokens integer not null default 0,
  retrieved_memory_count integer not null default 0,
  retrieved_memory_tokens integer not null default 0,
  final_context_tokens integer not null default 0,
  estimated_saved_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  latency_ms integer,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists context_builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id text,
  agent_id text,
  strategy text not null default 'balanced',
  max_context_tokens integer not null default 6000,
  user_request_tokens integer not null default 0,
  selected_memory_count integer not null default 0,
  selected_memory_tokens integer not null default 0,
  omitted_memory_count integer not null default 0,
  omitted_memory_tokens integer not null default 0,
  final_context_tokens integer not null default 0,
  estimated_saved_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists memory_retrieval_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  context_build_id uuid references context_builds(id) on delete cascade,
  memory_id uuid references memories(id) on delete cascade,
  rank integer not null default 0,
  reason text,
  estimated_tokens integer not null default 0,
  included boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_events_user_created
  on ai_usage_events(user_id, created_at desc);

create index if not exists idx_ai_usage_events_agent_created
  on ai_usage_events(agent_id, created_at desc);

create index if not exists idx_context_builds_user_created
  on context_builds(user_id, created_at desc);

create index if not exists idx_context_builds_agent_created
  on context_builds(agent_id, created_at desc);

create index if not exists idx_memory_retrieval_events_build
  on memory_retrieval_events(context_build_id);

alter table ai_usage_events enable row level security;
alter table context_builds enable row level security;
alter table memory_retrieval_events enable row level security;

do $$
begin
  drop policy if exists "Users manage own ai usage events" on ai_usage_events;
  drop policy if exists "Users manage own context builds" on context_builds;
  drop policy if exists "Users manage own memory retrieval events" on memory_retrieval_events;
exception when others then null;
end $$;

create policy "Users manage own ai usage events"
  on ai_usage_events for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own context builds"
  on context_builds for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own memory retrieval events"
  on memory_retrieval_events for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all on ai_usage_events to authenticated;
grant all on context_builds to authenticated;
grant all on memory_retrieval_events to authenticated;
