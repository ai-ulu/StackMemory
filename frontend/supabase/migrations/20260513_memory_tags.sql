-- Add first-class tag support to memories.
-- Safe to run multiple times.

alter table memories
  add column if not exists tags text[] not null default '{}';

create index if not exists idx_memories_tags
  on memories using gin (tags);
