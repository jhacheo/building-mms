-- Lock down the former public demo, preserving its data in an inaccessible legacy tenant.
begin;
create table public.tenants (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 120),
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.tenant_members (
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('admin','building_manager','inspection_manager','technician','asset_manager')),
 display_name text not null check(length(trim(display_name)) between 1 and 120),
 created_at timestamptz not null default now(), primary key(tenant_id,user_id)
);
create index tenant_members_user_idx on public.tenant_members(user_id,tenant_id);
insert into public.tenants(id,name) values('40000000-0000-4000-8000-000000000001','Legacy public demo');
alter table public.properties add column tenant_id uuid references public.tenants(id);
alter table public.assets add column tenant_id uuid references public.tenants(id);
alter table public.work_orders add column tenant_id uuid references public.tenants(id);
alter table public.audit_logs add column tenant_id uuid references public.tenants(id);
-- Disable the existing auditing trigger for the data backfill only.
alter table public.work_orders disable trigger audit_work_order;
update public.properties set tenant_id='40000000-0000-4000-8000-000000000001';
update public.assets set tenant_id='40000000-0000-4000-8000-000000000001';
update public.work_orders set tenant_id='40000000-0000-4000-8000-000000000001';
update public.audit_logs set tenant_id='40000000-0000-4000-8000-000000000001';
alter table public.work_orders enable trigger audit_work_order;
alter table public.properties alter column tenant_id set not null;
alter table public.assets alter column tenant_id set not null;
alter table public.work_orders alter column tenant_id set not null;
alter table public.audit_logs alter column tenant_id set not null;
alter table public.properties add unique(id,tenant_id);
alter table public.assets add unique(id,property_id,tenant_id);
alter table public.assets add foreign key(property_id,tenant_id) references public.properties(id,tenant_id) on delete restrict;
alter table public.work_orders add foreign key(property_id,tenant_id) references public.properties(id,tenant_id) on delete restrict;
alter table public.work_orders add foreign key(asset_id,property_id,tenant_id) references public.assets(id,property_id,tenant_id) on delete restrict;
alter table public.work_orders add column reported_by uuid references auth.users(id);
alter table public.work_orders add column assigned_to uuid;
alter table public.work_orders add foreign key(tenant_id,assigned_to) references public.tenant_members(tenant_id,user_id) on delete restrict;
alter table public.audit_logs add column actor_id uuid references auth.users(id);
create index properties_tenant_idx on public.properties(tenant_id);
create index assets_tenant_idx on public.assets(tenant_id);
create index work_orders_tenant_status_idx on public.work_orders(tenant_id,status);
create index work_orders_assignee_idx on public.work_orders(assigned_to,tenant_id);
create index audit_tenant_created_idx on public.audit_logs(tenant_id,created_at);

-- Membership lookup avoids recursive membership-table RLS and ignores client metadata.
create or replace function private.tenant_role(target uuid) returns text
 language sql stable security definer set search_path='' as $$
 select role from public.tenant_members where tenant_id=target and user_id=(select auth.uid())
$$;
revoke all on function private.tenant_role(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.tenant_role(uuid) to authenticated;

create or replace function public.create_tenant(tenant_name text,member_name text default null)
 returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); tid uuid; label text;
begin
 if uid is null then raise exception 'Sign in to create an organization'; end if;
 if tenant_name is null or length(trim(tenant_name)) not between 1 and 120 then raise exception 'Organization name must be 1–120 characters'; end if;
 select coalesce(nullif(trim(member_name),''),split_part(email,'@',1),'Manager') into label from auth.users where id=uid;
 if length(label)>120 then raise exception 'Your name must be at most 120 characters'; end if;
 insert into public.tenants(name,created_by) values(trim(tenant_name),uid) returning id into tid;
 insert into public.tenant_members(tenant_id,user_id,role,display_name) values(tid,uid,'admin',label);
 return tid;
end $$;
create or replace function public.add_tenant_member(target_tenant uuid,member_email text,member_role text)
 returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid; label text;
begin
 if private.tenant_role(target_tenant) is distinct from 'admin' then raise exception 'Only organization administrators can add members'; end if;
 if member_role not in ('admin','building_manager','inspection_manager','technician','asset_manager') then raise exception 'Choose a supported role'; end if;
 select id,split_part(email,'@',1) into uid,label from auth.users where lower(email)=lower(trim(member_email)) and email_confirmed_at is not null;
 if uid is null then raise exception 'This user must sign up and verify their email first'; end if;
 insert into public.tenant_members(tenant_id,user_id,role,display_name) values(target_tenant,uid,member_role,left(label,120));
 return uid;
exception when unique_violation then raise exception 'This user is already an organization member';
end $$;
revoke all on function public.create_tenant(text,text) from public,anon;
revoke all on function public.add_tenant_member(uuid,text,text) from public,anon;
grant execute on function public.create_tenant(text,text), public.add_tenant_member(uuid,text,text) to authenticated;

create or replace function private.prevent_tenant_move() returns trigger language plpgsql set search_path='' as $$
begin
 if new.tenant_id is distinct from old.tenant_id then raise exception 'Records cannot be moved between organizations'; end if;
 return new;
end $$;
create trigger prevent_tenant_move before update on public.properties for each row execute function private.prevent_tenant_move();
create trigger prevent_tenant_move before update on public.assets for each row execute function private.prevent_tenant_move();
create or replace function private.guard_work_order() returns trigger language plpgsql security definer set search_path='' as $$
declare member_role text := private.tenant_role(new.tenant_id); label text;
begin
 if TG_OP='UPDATE' and new.tenant_id is distinct from old.tenant_id then raise exception 'Records cannot be moved between organizations'; end if;
 -- Migration/service-role maintenance still uses constraints and lifecycle triggers.
 if auth.uid() is null then return new; end if;
 if TG_OP='INSERT' then
  if member_role not in ('admin','building_manager','inspection_manager') or member_role is null then raise exception 'Your role cannot report issues'; end if;
  if new.assigned_to is not null or nullif(trim(new.assigned_to_name),'') is not null then raise exception 'Report first, then assign a technician'; end if;
  new.reported_by := auth.uid();
  new.created_at := now();
  new.responded_at := null;
  new.resolved_at := null;
  select display_name into new.reported_by_name from public.tenant_members where tenant_id=new.tenant_id and user_id=auth.uid();
 else
  new.reported_by := old.reported_by;
  new.reported_by_name := old.reported_by_name;
  -- The scorer always overwrites this marker and exposes no editable fields.
  -- This also permits the authorized tenant-scoring RPC for read-only roles.
  if member_role is not null and (to_jsonb(new)-'priority_source') is not distinct from (to_jsonb(old)-'priority_source') then return new; end if;
  if member_role='technician' then
   if old.assigned_to is distinct from auth.uid() or (to_jsonb(new)-'status') is distinct from (to_jsonb(old)-'status') then raise exception 'Technicians may only change the status of their assigned work'; end if;
  elsif member_role='asset_manager' then
   if (to_jsonb(new)-'priority_source') is distinct from (to_jsonb(old)-'priority_source') then raise exception 'Asset managers cannot modify work orders'; end if;
  elsif member_role is null or member_role not in ('admin','building_manager') then raise exception 'Your role cannot modify work orders';
  end if;
 end if;
 if new.assigned_to is not null then
  select display_name into label from public.tenant_members where tenant_id=new.tenant_id and user_id=new.assigned_to and role in ('technician','admin','building_manager');
  if label is null then raise exception 'Assign a technician from this organization'; end if;
  new.assigned_to_name := label;
 elsif TG_OP='UPDATE' and old.assigned_to is distinct from new.assigned_to then new.assigned_to_name := null;
 elsif TG_OP='UPDATE' and old.assigned_to_name is distinct from new.assigned_to_name then raise exception 'Choose an organization member to assign';
 end if;
 if new.status='wip' and new.assigned_to is null then raise exception 'Assign an organization technician before starting work'; end if;
 return new;
end $$;
-- Alphabetic trigger order ensures authorization runs before lifecycle/scoring.
create trigger guard_work_order before insert or update on public.work_orders for each row execute function private.guard_work_order();
alter function private.prepare_work_order() set search_path='';
create or replace function private.audit_work_order() returns trigger language plpgsql security definer set search_path='' as $$
declare actor text; tid uuid; eid uuid; title text;
begin
 if TG_OP='DELETE' then tid:=old.tenant_id; eid:=old.id; title:=old.title; else tid:=new.tenant_id; eid:=new.id; title:=new.title; end if;
 select display_name into actor from public.tenant_members where tenant_id=tid and user_id=auth.uid();
 actor:=coalesce(actor,'System');
 if TG_OP='DELETE' then
  insert into public.audit_logs(tenant_id,actor_id,action,entity_type,entity_id,actor_name,detail) values(tid,auth.uid(),'delete','work_order',eid,actor,title); return old;
 elsif TG_OP='INSERT' then
  insert into public.audit_logs(tenant_id,actor_id,action,entity_type,entity_id,actor_name,detail) values(tid,auth.uid(),'work_order.created','work_order',eid,actor,title);
 else
  if old.assigned_to is distinct from new.assigned_to then
   insert into public.audit_logs(tenant_id,actor_id,action,entity_type,entity_id,actor_name,detail) values(tid,auth.uid(),'assign','work_order',eid,actor,coalesce(new.assigned_to_name,'Unassigned'));
  end if;
  if old.status is distinct from new.status then
   insert into public.audit_logs(tenant_id,actor_id,action,entity_type,entity_id,actor_name,detail) values(tid,auth.uid(),case when new.status='resolved' then 'resolve' else 'status_change' end,'work_order',eid,actor,old.status||' → '||new.status);
  end if;
 end if;
 return new;
end $$;
revoke all on function private.prevent_tenant_move(),private.guard_work_order(),private.audit_work_order() from public,anon,authenticated;

create or replace function public.refresh_tenant_scores(target_tenant uuid) returns void
 language plpgsql security definer set search_path='' as $$
begin
 if private.tenant_role(target_tenant) is null then raise exception 'Organization membership required'; end if;
 update public.work_orders set priority_source='rule_engine' where tenant_id=target_tenant and status='pending';
end $$;
revoke all on function public.refresh_tenant_scores(uuid) from public,anon;
grant execute on function public.refresh_tenant_scores(uuid) to authenticated;
create or replace function private.refresh_asset_orders() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 update public.work_orders set priority_source='rule_engine' where tenant_id=new.tenant_id and asset_id=new.id and status<>'resolved';
 return new;
end $$;
revoke all on function private.refresh_asset_orders() from public,anon,authenticated;
create trigger refresh_asset_orders after update on public.assets for each row execute function private.refresh_asset_orders();

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
create policy tenants_read on public.tenants for select to authenticated using(private.tenant_role(id) is not null);
create policy members_read on public.tenant_members for select to authenticated using(private.tenant_role(tenant_id) is not null);
grant select on public.tenants,public.tenant_members to authenticated;
revoke all on public.tenants,public.tenant_members from anon;
revoke insert,update,delete on public.tenants,public.tenant_members from authenticated;
drop policy demo_access on public.properties;
drop policy demo_access on public.assets;
drop policy demo_access on public.work_orders;
drop policy demo_read on public.audit_logs;
revoke all on public.properties,public.assets,public.work_orders,public.audit_logs from anon;
create policy property_read on public.properties for select to authenticated using(private.tenant_role(tenant_id) is not null);
create policy property_insert on public.properties for insert to authenticated with check(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager'));
create policy property_update on public.properties for update to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager')) with check(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager'));
create policy property_delete on public.properties for delete to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager'));
create policy asset_read on public.assets for select to authenticated using(private.tenant_role(tenant_id) is not null);
create policy asset_insert on public.assets for insert to authenticated with check(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager'));
create policy asset_update on public.assets for update to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager')) with check(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager'));
create policy asset_delete on public.assets for delete to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager'));
create policy order_read on public.work_orders for select to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager','inspection_manager','asset_manager') or (private.tenant_role(tenant_id)='technician' and assigned_to=(select auth.uid())));
create policy order_insert on public.work_orders for insert to authenticated with check(private.tenant_role(tenant_id) in ('admin','building_manager','inspection_manager'));
create policy order_update on public.work_orders for update to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager') or (private.tenant_role(tenant_id)='technician' and assigned_to=(select auth.uid()))) with check(private.tenant_role(tenant_id) in ('admin','building_manager','asset_manager') or (private.tenant_role(tenant_id)='technician' and assigned_to=(select auth.uid())));
create policy order_delete on public.work_orders for delete to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager'));
create policy audit_read on public.audit_logs for select to authenticated using(private.tenant_role(tenant_id) in ('admin','building_manager','inspection_manager','asset_manager') or (private.tenant_role(tenant_id)='technician' and exists(select 1 from public.work_orders w where w.id=entity_id and w.tenant_id=audit_logs.tenant_id and w.assigned_to=(select auth.uid()))));
revoke insert,update,delete on public.audit_logs from authenticated;
commit;
