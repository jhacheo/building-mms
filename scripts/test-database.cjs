const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false},global:{headers:{'x-actor-name':'Integration tester'}}});
const ids={};
async function result(q){const {data,error}=await q;if(error)throw Error(error.message);return data;}
(async()=>{try{
 const p=await result(db.from('properties').insert({name:'E2E Test Building '+Date.now(),floors:3,units:12}).select().single());ids.property=p.id;
 const a=await result(db.from('assets').insert({property_id:p.id,name:'Floor 3 HVAC',type:'HVAC',location_floor:'3',location_unit:'305',warranty_expiry:'2020-01-01'}).select().single());ids.asset=a.id;
 const o=await result(db.from('work_orders').insert({title:'HVAC not cooling 3rd floor',description:'Not cooling in unit 305',property_id:p.id,asset_id:a.id,reported_by_name:'Inspection manager'}).select().single());ids.order=o.id;
 assert.equal(o.status,'pending');assert.equal(o.priority_score,40);assert.equal(o.priority,'medium');assert.equal(o.responded_at,null);
 const invalid=await db.from('work_orders').update({status:'resolved'}).eq('id',o.id);assert.ok(invalid.error,'Cannot resolve before starting work');
 const unassigned=await db.from('work_orders').update({status:'wip'}).eq('id',o.id);assert.ok(unassigned.error,'Cannot start without technician');
 await result(db.from('work_orders').update({assigned_to_name:'John'}).eq('id',o.id));
 const wip=await result(db.from('work_orders').update({status:'wip'}).eq('id',o.id).select().single());assert.ok(wip.responded_at);assert.ok(wip.response_time_hours>=0);
 const closed=await result(db.from('work_orders').update({status:'resolved'}).eq('id',o.id).select().single());assert.ok(closed.resolved_at);assert.ok(closed.resolution_time_hours>=0&&closed.resolution_time_hours<24);
 const persisted=await result(db.from('work_orders').select('*').eq('id',o.id).single());assert.equal(persisted.status,'resolved');assert.equal(persisted.assigned_to_name,'John');
 const edited=await result(db.from('work_orders').update({title:'HVAC fixed on Floor 3'}).eq('id',o.id).select().single());assert.equal(edited.resolved_at,closed.resolved_at);
 const logs=await result(db.from('audit_logs').select('*').eq('entity_id',o.id));for(const action of ['work_order.created','assign','status_change','resolve'])assert.ok(logs.some(l=>l.action===action));
 const tamper=await db.from('audit_logs').insert({action:'fake',entity_type:'work_order',entity_id:o.id,actor_name:'fake',detail:'fake'});assert.ok(tamper.error,'Audit insert blocked');
 const broken=await db.from('assets').delete().eq('id',a.id);assert.ok(broken.error,'Linked asset deletion blocked');
 const scoreAsset=await result(db.from('assets').update({type:'water_system'}).eq('id',a.id).select().single());assert.equal(scoreAsset.type,'water_system');
 const cross=await db.from('work_orders').insert({title:'Cross-property mismatch',property_id:'10000000-0000-4000-8000-000000000001',asset_id:a.id,reported_by_name:'Tester'});assert.ok(cross.error,'Cross-property assets blocked');
 const leak=await result(db.from('work_orders').insert({title:'Water leak',property_id:p.id,asset_id:a.id,reported_by_name:'Tester'}).select().single());ids.leak=leak.id;assert.equal(leak.priority_score,65);assert.equal(leak.priority,'high');
 const aged=await result(db.from('work_orders').insert({title:'Water leak older than 48 hours',property_id:p.id,asset_id:a.id,reported_by_name:'Tester',created_at:new Date(Date.now()-72*3600000).toISOString()}).select().single());ids.aged=aged.id;assert.equal(aged.priority_score,85);assert.equal(aged.priority,'critical');
 console.log('PASS: report → assign John → WIP → resolve; persisted times under 24h; scoring; audit; invalid transitions; foreign keys.');
 }finally{for(const k of ['aged','leak','order'])if(ids[k])await result(db.from('work_orders').delete().eq('id',ids[k]));if(ids.asset)await result(db.from('assets').delete().eq('id',ids.asset));if(ids.property)await result(db.from('properties').delete().eq('id',ids.property));console.log('Temporary test records cleaned up.');}})().catch(e=>{console.error(e.message);process.exitCode=1;});