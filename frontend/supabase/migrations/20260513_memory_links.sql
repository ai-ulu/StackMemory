-- Memory links prepare persistent graph relationships.
-- The current graph MVP infers edges from memory metadata.
-- This table is the next step for explicit relationships.

create table if not exists memory_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_memory_id uuid not null references memories(id) on delete cascade,
  target_memory_id uuid not null references memories(id) on delete cascade,
  relationship_type text not null default 'related',
  weight numeric not null default 0.5 check (weight >= 0 and weight <= 1),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_memory_id, target_memory_id, relationship_type)
);

alter table memory_links enable row level security;

create policy "Users can read own memory links"
  on memory_links for select
  using (auth.uid() = user_id);

create policy "Users can insert own memory links"
  on memory_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update own memory links"
  on memory_links for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own memory links"
  on memory_links for delete
  using (auth.uid() = user_id);

create index if not exists idx_memory_links_user_id on memory_links(user_id);
create index if not exists idx_memory_links_source on memory_links(source_memory_id);
create index if not exists idx_memory_links_target on memory_links(target_memory_id);
