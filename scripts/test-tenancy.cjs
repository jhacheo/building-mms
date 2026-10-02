// Emit a rollback-only database authorization test. Run the output with the
// project SQL editor or a privileged PostgreSQL connection; no API secrets needed.
// These JWT claims simulate Data API roles. Browser checks separately verify Auth.
console.log(String.raw`
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end $$;
create function pg_temp.assert_denied(statement text, label text) returns void language plpgsql as $$
declare rejected boolean := false;
begin
 begin execute statement; exception when others then rejected := true; end;
 perform pg_temp.assert_true(rejected,label);
end $$;
create temp table test_context(key text primary key,id uuid);
grant select,insert on test_context to authenticated;
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,created_at,updated_at) values
 ('a1000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenancy-owner-a@example.invalid',now(),now(),now()),
 ('a1000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenancy-owner-b@example.invalid',now(),now(),now()),
 ('a1000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenancy-tech@example.invalid',now(),now(),now()),
 ('a1000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenancy-inspector@example.invalid',now(),now(),now()),
 ('a1000000-0000-4000-8000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenancy-asset@example.invalid',now(),now(),now());
set local role anon;
select pg_temp.assert_denied('select * from public.properties','anonymous reads denied');
select pg_temp.assert_denied('select * from public.assets','anonymous asset reads denied');
select pg_temp.assert_denied('select * from public.work_orders','anonymous work order reads denied');
select pg_temp.assert_denied('select * from public.audit_logs','anonymous audit reads denied');
select pg_temp.assert_denied('select * from public.tenants','anonymous organization reads denied');
select pg_temp.assert_denied('select * from public.tenant_members','anonymous membership reads denied');
select pg_temp.assert_denied('select public.create_tenant(''Intruder'',null)','anonymous onboarding denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
insert into test_context values('A',public.create_tenant('Isolation A','Owner A'));
select public.add_tenant_member((select id from test_context where key='A'),'tenancy-tech@example.invalid','technician');
select public.add_tenant_member((select id from test_context where key='A'),'tenancy-inspector@example.invalid','inspection_manager');
select public.add_tenant_member((select id from test_context where key='A'),'tenancy-asset@example.invalid','asset_manager');
insert into public.properties(id,tenant_id,name) values('a2000000-0000-4000-8000-000000000001',(select id from test_context where key='A'),'A Building');
insert into public.assets(id,tenant_id,property_id,name,type,warranty_expiry) values('a3000000-0000-4000-8000-000000000001',(select id from test_context where key='A'),'a2000000-0000-4000-8000-000000000001','Floor 3 HVAC','HVAC','2020-01-01');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
insert into test_context values('B',public.create_tenant('Isolation B','Owner B'));
insert into public.properties(id,tenant_id,name) values('a2000000-0000-4000-8000-000000000002',(select id from test_context where key='B'),'B Building');
select pg_temp.assert_true((select count(*)=1 from public.tenants),'owner B sees only their tenant');
select pg_temp.assert_true((select count(*)=0 from public.properties where id='a2000000-0000-4000-8000-000000000001'),'foreign property ID hidden');
do $$ declare affected integer; begin
 update public.properties set name='Hacked' where id='a2000000-0000-4000-8000-000000000001'; get diagnostics affected=row_count;
 perform pg_temp.assert_true(affected=0,'foreign property update rejected');
 delete from public.properties where id='a2000000-0000-4000-8000-000000000001'; get diagnostics affected=row_count;
 perform pg_temp.assert_true(affected=0,'foreign property delete rejected');
end $$;
select pg_temp.assert_denied('insert into public.properties(tenant_id,name) select id,''Hacked'' from test_context where key=''A''','foreign tenant insert rejected');
select pg_temp.assert_denied('insert into public.assets(tenant_id,property_id,name,type) select id,''a2000000-0000-4000-8000-000000000001'',''Cross tenant'',''HVAC'' from test_context where key=''B''','cross tenant property FK rejected');
select pg_temp.assert_denied('insert into public.work_orders(tenant_id,property_id,asset_id,title) select id,''a2000000-0000-4000-8000-000000000002'',''a3000000-0000-4000-8000-000000000001'',''Cross tenant'' from test_context where key=''B''','cross tenant asset FK rejected');
select pg_temp.assert_denied('select public.add_tenant_member((select id from test_context where key=''A''),''tenancy-owner-b@example.invalid'',''admin'')','foreign tenant membership escalation rejected');
select pg_temp.assert_denied('select public.refresh_tenant_scores((select id from test_context where key=''A''))','foreign tenant scoring RPC rejected');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000004',true);
select set_config('request.headers','{"x-actor-name":"Forged admin"}',true);
insert into public.work_orders(id,tenant_id,property_id,asset_id,title,reported_by_name,reported_by) values('a4000000-0000-4000-8000-000000000001',(select id from test_context where key='A'),'a2000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','HVAC not cooling 3rd floor','Forged admin','a1000000-0000-4000-8000-000000000001');
select pg_temp.assert_true((select status='pending' and priority_score=40 and reported_by=auth.uid() from public.work_orders where id='a4000000-0000-4000-8000-000000000001'),'inspector reports; identity and scoring authoritative');
select pg_temp.assert_true((select count(*)=1 from public.audit_logs where entity_id='a4000000-0000-4000-8000-000000000001' and actor_id=auth.uid() and actor_name<>'Forged admin'),'audit actor cannot be spoofed');
select pg_temp.assert_denied('insert into public.properties(tenant_id,name) select id,''Inspector property'' from test_context where key=''A''','inspector registry write rejected');
select pg_temp.assert_denied('select public.add_tenant_member((select id from test_context where key=''A''),''tenancy-owner-b@example.invalid'',''admin'')','inspector cannot add admin');
do $$ declare affected integer; begin
 update public.work_orders set title='Inspector tampered' where id='a4000000-0000-4000-8000-000000000001'; get diagnostics affected=row_count;
 perform pg_temp.assert_true(affected=0,'inspector cannot modify reported issue');
end $$;
select public.refresh_tenant_scores((select id from test_context where key='A'));
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select pg_temp.assert_denied('update public.work_orders set status=''wip'' where id=''a4000000-0000-4000-8000-000000000001''','unassigned start rejected');
select pg_temp.assert_denied('update public.work_orders set status=''resolved'' where id=''a4000000-0000-4000-8000-000000000001''','resolution before start rejected');
select pg_temp.assert_denied('update public.work_orders set assigned_to=''a1000000-0000-4000-8000-000000000002'' where id=''a4000000-0000-4000-8000-000000000001''','foreign technician assignment rejected');
update public.work_orders set assigned_to='a1000000-0000-4000-8000-000000000003' where id='a4000000-0000-4000-8000-000000000001';
insert into public.work_orders(id,tenant_id,property_id,title) values('a4000000-0000-4000-8000-000000000002',(select id from test_context where key='A'),'a2000000-0000-4000-8000-000000000001','Unassigned issue');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000003',true);
select pg_temp.assert_true((select count(*)=1 from public.work_orders),'technician sees assigned orders only');
select pg_temp.assert_denied('update public.work_orders set title=''Tampered'' where id=''a4000000-0000-4000-8000-000000000001''','technician cannot edit issue fields');
select pg_temp.assert_denied('update public.work_orders set assigned_to=''a1000000-0000-4000-8000-000000000001'' where id=''a4000000-0000-4000-8000-000000000001''','technician cannot reassign');
update public.work_orders set status='wip' where id='a4000000-0000-4000-8000-000000000001';
update public.work_orders set status='resolved' where id='a4000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select responded_at is not null and resolved_at is not null and resolution_time_hours between 0 and 24 from public.work_orders where id='a4000000-0000-4000-8000-000000000001'),'assigned technician completes core lifecycle under 24h');
select pg_temp.assert_denied('update public.work_orders set status=''pending'' where id=''a4000000-0000-4000-8000-000000000001''','resolved orders cannot reopen');
select pg_temp.assert_denied('update public.audit_logs set actor_name=''Fake''','audit update denied');
select pg_temp.assert_denied('delete from public.audit_logs','audit deletion denied');
select pg_temp.assert_true((select count(distinct action)=4 from public.audit_logs where entity_id='a4000000-0000-4000-8000-000000000001' and action in ('work_order.created','assign','status_change','resolve')),'all core lifecycle audit actions persisted');
do $$ declare affected integer; begin
 delete from public.work_orders where id='a4000000-0000-4000-8000-000000000001'; get diagnostics affected=row_count;
 perform pg_temp.assert_true(affected=0,'technician cannot delete assigned issue');
end $$;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000005',true);
insert into public.properties(tenant_id,name) select id,'Asset managed property' from test_context where key='A';
select pg_temp.assert_denied('update public.work_orders set title=''Tampered'' where id=''a4000000-0000-4000-8000-000000000001''','asset manager cannot edit work orders');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select public.add_tenant_member((select id from test_context where key='A'),'tenancy-owner-b@example.invalid','building_manager');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select pg_temp.assert_true((select count(*)=2 from public.tenants),'multiple memberships expose both organizations');
select pg_temp.assert_true((select count(*)=1 from public.properties where tenant_id=(select id from test_context where key='B')),'switch filter B contains only B property');
select pg_temp.assert_true((select count(*)=2 from public.work_orders where tenant_id=(select id from test_context where key='A')),'switch filter A preserves completed workflow');
select pg_temp.assert_denied('update public.properties set tenant_id=(select id from test_context where key=''B'') where id=''a2000000-0000-4000-8000-000000000001''','member of both tenants cannot move property');
select pg_temp.assert_denied('update public.work_orders set tenant_id=(select id from test_context where key=''B'') where id=''a4000000-0000-4000-8000-000000000001''','member of both tenants cannot move work order');
select pg_temp.assert_denied('insert into public.tenant_members(tenant_id,user_id,role,display_name) select id,''a1000000-0000-4000-8000-000000000004'',''admin'',''Fake'' from test_context where key=''B''','direct membership mutation denied');
select 'PASS: anonymous lockdown; tenant isolation; immutable ownership; role permissions; assignment; audit; lifecycle; multi-membership switching' as result;
rollback;
`);
