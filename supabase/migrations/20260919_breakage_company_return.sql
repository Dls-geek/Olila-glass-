-- Company breakage return: link break logs to supplier / chalan, track replacement.
-- Apply in Supabase SQL Editor if MCP migration tools are unavailable.

alter table public.inventory_logs
  add column if not exists supplier text,
  add column if not exists chalan_id text,
  add column if not exists return_status text,
  add column if not exists replaced_qty integer not null default 0;

alter table public.inventory_logs
  drop constraint if exists inventory_logs_return_status_check;

alter table public.inventory_logs
  add constraint inventory_logs_return_status_check
  check (
    return_status is null
    or return_status in ('pending', 'replaced')
  );

comment on column public.inventory_logs.supplier is
  'Company receiving broken goods for replacement (break rows only).';
comment on column public.inventory_logs.chalan_id is
  'Optional open chalan linked to this breakage return.';
comment on column public.inventory_logs.return_status is
  'pending = awaiting company replacement; replaced = fully replaced; null = no company link.';
comment on column public.inventory_logs.replaced_qty is
  'Units already replaced by company (partial allowed).';
