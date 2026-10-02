-- Public demo schema. Replace these policies before storing private user data.
create extension if not exists pgcrypto;
create schema if not exists private;
create table if not exists public.properties (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) > 0),
 address text, floors integer not null default 1 check(floors > 0),
 units integer not null default 1 check(units > 0), user_id uuid,
 created_at timestamptz not null default now()
);
create table if not exists public.assets (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete restrict,
 name text not null check(length(trim(name)) > 0),
 type text not null check(type in ('HVAC','lift','fire_alarm','electrical_panel','water_system')),
 model_number text, serial_number text, purchase_date date, install_date date, warranty_expiry date,
 location_floor text, location_unit text, user_id uuid, created_at timestamptz not null default now(),
 unique(id, property_id)
);
create table if not exists public.work_orders (
 id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title)) > 0), description text,
 status text not null default 'pending' check(status in ('pending','wip','resolved')),
 priority text not null default 'low' check(priority in ('low','medium','high','critical')),
 priority_score numeric not null default 0, priority_source text not null default 'rule_engine',
 priority_confidence numeric not null default 1, priority_review_status text not null default 'unreviewed',
 property_id uuid not null references public.properties(id) on delete restrict, asset_id uuid,
 reported_by_name text, assigned_to_name text, created_at timestamptz not null default now(),
 responded_at timestamptz, resolved_at timestamptz, response_time_hours numeric, resolution_time_hours numeric, user_id uuid,
 foreign key(asset_id, property_id) references public.assets(id, property_id) on delete restrict
);
create table if not exists public.audit_logs (
 id uuid primary key default gen_random_uuid(), action text not null, entity_type text not null,
 entity_id uuid not null, actor_name text not null, detail text not null, created_at timestamptz not null default now()
);
create index if not exists assets_property_idx on public.assets(property_id);
create index if not exists work_orders_property_status_idx on public.work_orders(property_id,status);
create index if not exists work_orders_asset_property_idx on public.work_orders(asset_id,property_id);
create index if not exists audit_entity_idx on public.audit_logs(entity_id,created_at);

-- Trigger guarantees scoring, timing, and audit are atomic with the write.
create or replace function private.prepare_work_order() returns trigger language plpgsql set search_path = public as $$
declare a public.assets; score integer := 0; words text;
begin
 if TG_OP = 'INSERT' and new.status <> 'pending' then raise exception 'New issues must start pending'; end if;
 if TG_OP = 'UPDATE' then
  new.created_at := old.created_at;
  new.responded_at := old.responded_at;
  new.resolved_at := old.resolved_at;
  if old.status = 'resolved' and new.status <> 'resolved' then raise exception 'Resolved orders cannot be reopened'; end if;
  if new.status = 'resolved' and old.status <> 'resolved' and old.status <> 'wip' then raise exception 'Start work before resolving'; end if;
 end if;
 if new.status = 'wip' then
  if nullif(trim(new.assigned_to_name),'') is null then raise exception 'Assign a technician before starting work'; end if;
  new.responded_at := coalesce(new.responded_at,now());
 end if;
 if new.status = 'resolved' then new.resolved_at := coalesce(new.resolved_at,now()); end if;
 new.response_time_hours := extract(epoch from (new.responded_at-new.created_at))/3600;
 new.resolution_time_hours := extract(epoch from (new.resolved_at-new.created_at))/3600;
 select * into a from public.assets where id = new.asset_id;
 score := case a.type when 'fire_alarm' then 40 when 'electrical_panel' then 30 when 'lift' then 25 when 'HVAC' then 15 when 'water_system' then 20 else 0 end;
 words := lower(coalesce(new.title,'') || ' ' || coalesce(new.description,''));
 if words ~ '(leak|smoke|spark|no power)' then score := score+30; end if;
 if words ~ '(not cooling|noise|slow)' then score := score+10; end if;
 if a.warranty_expiry < current_date then score := score+15; end if;
 if new.status = 'pending' and new.created_at < now()-interval '48 hours' then score := score+20; end if;
 new.priority_score := score;
 new.priority := case when score <= 30 then 'low' when score <= 60 then 'medium' when score <= 80 then 'high' else 'critical' end;
 new.priority_source := 'rule_engine'; new.priority_confidence := 1;
 return new;
end $$;
create or replace function private.audit_work_order() returns trigger language plpgsql security definer set search_path = public as $$
declare actor text := coalesce(nullif(nullif(current_setting('request.headers',true),'')::jsonb->>'x-actor-name',''),'Demo user');
begin
 if TG_OP = 'DELETE' then
  insert into audit_logs(action,entity_type,entity_id,actor_name,detail) values('delete','work_order',old.id,actor,old.title);
  return old;
 end if;
 if TG_OP = 'INSERT' then
  insert into audit_logs(action,entity_type,entity_id,actor_name,detail) values('work_order.created','work_order',new.id,coalesce(new.reported_by_name,actor),new.title);
 else
  if old.assigned_to_name is distinct from new.assigned_to_name then
   insert into audit_logs(action,entity_type,entity_id,actor_name,detail) values('assign','work_order',new.id,actor,coalesce(new.assigned_to_name,'Unassigned'));
  end if;
  if old.status is distinct from new.status then
   insert into audit_logs(action,entity_type,entity_id,actor_name,detail) values(case when new.status='resolved' then 'resolve' else 'status_change' end,'work_order',new.id,actor,old.status || ' → ' || new.status);
  end if;
 end if;
 return new;
end $$;
drop trigger if exists prepare_work_order on public.work_orders;
create trigger prepare_work_order before insert or update on public.work_orders for each row execute function private.prepare_work_order();
drop trigger if exists audit_work_order on public.work_orders;
create trigger audit_work_order after insert or update or delete on public.work_orders for each row execute function private.audit_work_order();
revoke all on function private.audit_work_order() from public,anon,authenticated;
revoke all on function private.prepare_work_order() from public,anon,authenticated;

alter table public.properties enable row level security;
alter table public.assets enable row level security;
alter table public.work_orders enable row level security;
alter table public.audit_logs enable row level security;
do $$ declare t text; begin
 foreach t in array array['properties','assets','work_orders'] loop
  execute format('drop policy if exists demo_access on public.%I',t);
  execute format('create policy demo_access on public.%I for all to anon, authenticated using (true) with check (true)',t);
  execute format('grant select,insert,update,delete on public.%I to anon,authenticated',t);
 end loop;
end $$;
drop policy if exists demo_read on public.audit_logs;
create policy demo_read on public.audit_logs for select to anon,authenticated using(true);
grant select on public.audit_logs to anon,authenticated;
revoke insert,update,delete on public.audit_logs from anon,authenticated;
