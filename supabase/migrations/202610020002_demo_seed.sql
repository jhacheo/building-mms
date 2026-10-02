-- Fixed IDs prevent duplicate seed records on reapplication.
insert into public.properties(id,name,address,floors,units) values
 ('10000000-0000-4000-8000-000000000001','Meridian Tower','18 Jalan Ampang, Kuala Lumpur',24,120),
 ('10000000-0000-4000-8000-000000000002','Parkside Residences','42 Jalan Tun Razak, Kuala Lumpur',12,72),
 ('10000000-0000-4000-8000-000000000003','Harbour Business Centre','8 Persiaran Waterfront, Klang',8,48)
on conflict(id) do nothing;
insert into public.assets(id,property_id,name,type,model_number,serial_number,purchase_date,install_date,warranty_expiry,location_floor,location_unit) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Floor 3 HVAC','HVAC','Daikin VRV IV','HVAC-305','2022-03-01','2022-03-15','2025-03-15','3','305'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Passenger Lift A','lift','Otis Gen2','LIFT-A01','2023-01-10','2023-02-01','2028-02-01','Lobby','A'),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Fire Alarm Panel','fire_alarm','Notifier NFS','FIRE-02','2021-04-01','2021-04-10','2026-04-10','G','Control room'),
 ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','Water Booster Pump','water_system','Grundfos Hydro','PUMP-02','2024-05-01','2024-05-10','2027-05-10','B1','Pump room'),
 ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000003','Main Electrical Panel','electrical_panel','Schneider Prisma','ELEC-03','2023-06-01','2023-06-15','2028-06-15','G','Switch room'),
 ('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000003','Office HVAC','HVAC','Mitsubishi City Multi','HVAC-03','2024-02-01','2024-02-15','2027-02-15','2','201')
on conflict(id) do nothing;
insert into public.work_orders(id,title,description,property_id,asset_id,reported_by_name) values
 ('30000000-0000-4000-8000-000000000001','HVAC not cooling on Floor 3','Unit 305 is warm; inspect the cooling circuit.','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Aisha'),
 ('30000000-0000-4000-8000-000000000002','Lift makes noise','Noise during ascent; inspect guide rollers.','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Aisha'),
 ('30000000-0000-4000-8000-000000000003','Fire panel intermittent fault','Inspect detector loop connections.','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','Daniel'),
 ('30000000-0000-4000-8000-000000000004','Water pump leak','Leak at discharge fitting.','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004','Daniel'),
 ('30000000-0000-4000-8000-000000000005','Electrical panel inspection','Check connections after scheduled inspection.','10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000005','Mei')
on conflict(id) do nothing;
update public.work_orders set assigned_to_name='John',status='wip'
where id in ('30000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000005') and status='pending';
update public.work_orders set status='resolved'
where id='30000000-0000-4000-8000-000000000005' and status='wip';
