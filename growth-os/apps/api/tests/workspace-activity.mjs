import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import express from 'express';
import { z } from 'zod';
import { Pool } from 'pg';

// npm run build && node tests/workspace-activity.mjs <disposable-local-postgres-url>
const url=new URL(process.argv[2]||'');
assert.ok(['127.0.0.1','localhost'].includes(url.hostname));
const admin=new Pool({connectionString:url.href});
const schema='activity_test_'+Date.now();
await admin.query(`create schema ${schema}`);
const db=new Pool({connectionString:url.href,options:`-c search_path=${schema}`});
let queries=[];
const pool={query(sql,values){queries.push({sql,values});return db.query(sql,values)}};
async function load(name,bindings,exports){
  const source=(await readFile(new URL(`../dist/${name}.js`,import.meta.url),'utf8'))
    .replace(/^import .*;\r?\n/gm,'').replace(/export (async function|function|const) /g,'$1 ');
  return vm.runInNewContext(source+`\n({${exports}})`,{Error,Buffer,...bindings});
}
const cloudflareAccessConfigured=()=>true;
async function verifiedCloudflareAccessEmail(req){
  const email=req.header('cf-access-authenticated-user-email')||'';
  if(!email)throw new Error('CF_ACCESS_JWT_MISSING');
  return email.trim().toLowerCase();
}
const access=await load('workspace-access',{pool,process:{env:{NODE_ENV:'production'}},cloudflareAccessConfigured,verifiedCloudflareAccessEmail},'resolveWorkspaceActor,workspaceErrorMessage,workspaceErrorStatus');
const {workspaceActivityRouter}=await load('workspace-activity',{Router:express.Router,z,pool,...access},'workspaceActivityRouter');
const {workspaceRouter}=await load('workspace-routes',{
  Router:express.Router,z,pool,...access,workspaceActivityRouter,
  clientPortalRouter:express.Router(),clientInviteRouter:express.Router(),projectLifecycleRouter:express.Router(),
},'workspaceRouter');
const {initProjectLifecycleSchema}=await load('project-lifecycle-schema',{pool},'initProjectLifecycleSchema');
const {writeWorkspaceActivity}=await load('workspace-activity-log',{},'writeWorkspaceActivity');
const a='550e8400-e29b-41d4-a716-446655440001',b='550e8400-e29b-41d4-a716-446655440002';
const project='550e8400-e29b-41d4-a716-446655440003';
const app=express();app.use('/workspaces',workspaceRouter);
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let checks=0;
async function get(workspace=a,query='',email='viewer@example.test'){
  queries=[];
  const response=await fetch(`${base}/workspaces/${workspace}/activity${query}`,{headers:email?{'cf-access-authenticated-user-email':email}:{}});
  return {status:response.status,body:await response.json()};
}
function pass(name){checks++;console.log('PASS',name)}
try{
  await db.query(`
    create table agency_workspaces(id uuid primary key,status text);
    create table workspace_members(workspace_id uuid,email text,role text,permissions jsonb,status text,created_at timestamptz default now());
    create table projects(id uuid primary key,workspace_id uuid,created_at timestamptz default now());
  `);
  await initProjectLifecycleSchema();
  await db.query("insert into agency_workspaces values($1,'active'),($2,'active')",[a,b]);
  await db.query("insert into workspace_members(workspace_id,email,role,status) values($1,'viewer@example.test','viewer','active'),($2,'other@example.test','owner','active'),($1,'shared@example.test','viewer','active'),($2,'shared@example.test','viewer','active')",[a,b]);
  await db.query(`insert into workspace_activity_log(id,workspace_id,actor_email,action,entity_type,entity_id,entity_name,metadata,created_at)
    select ('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,$1,'actor@example.test',
      case when i%2=0 then 'project.archived' else 'project.restored' end,
      case when i%3=0 then 'note' else 'project' end,'durable-id','Original name','{"domain":"example.test"}',
      '2026-01-01T00:00:00Z'::timestamptz+(i/3)*interval '1 microsecond'
    from generate_series(1,105) i`,[a]);
  await writeWorkspaceActivity(db,{workspaceId:b,actorEmail:'other@example.test',action:'project.deleted',entityType:'project',entityName:'Other workspace secret'});
  await db.query('insert into projects(id,workspace_id) values($1,$2)',[project,a]);
  await writeWorkspaceActivity(db,{workspaceId:a,actorEmail:'owner@example.test',action:'project.deleted',entityType:'project',entityId:project,entityName:'Deleted project',metadata:{domain:'deleted.test'}});
  await db.query('delete from projects where id=$1',[project]);

  let result=await get();
  assert.equal(result.status,200);assert.equal(result.body.items.length,50);assert.ok(result.body.nextCursor);
  assert.equal(queries.length,2);assert.equal(queries.filter(q=>q.sql.includes('from workspace_activity_log')).length,1);
  assert.deepEqual(Object.keys(result.body.items[0]).sort(),['id','actorEmail','action','entityType','entityId','entityName','metadata','createdAt'].sort());
  pass('viewer access, default 50, response shape, one log query');
  assert.equal(result.body.items[0].entityName,'Deleted project');assert.equal(result.body.items[0].metadata.domain,'deleted.test');
  pass('hard-deleted project event survives without a project join');

  result=await get(b);assert.equal(result.status,403);assert.equal(queries.length,1);pass('workspace isolation denies nonmember');
  result=await get(b,'','other@example.test');assert.equal(result.status,200);assert.equal(result.body.items.length,1);assert.equal(result.body.items[0].entityName,'Other workspace secret');pass('other workspace returns only own log');
  result=await get('malformed');assert.equal(result.status,400);assert.equal(result.body.error,'Geçerli bir workspace kimliği gerekli.');assert.equal(queries.length,0);pass('central workspace UUID guard rejects before DB');
  result=await get(a,'',null);assert.equal(result.status,403);assert.equal(queries.length,0);pass('unauthenticated production request denied');

  for(const limit of ['101','0','-1','1.5','abc','', '1&limit=2']){
    result=await get(a,'?limit='+limit);assert.equal(result.status,400);assert.equal(queries.length,1);
  }
  result=await get(a,'?limit=100');assert.equal(result.body.items.length,100);pass('limit bounds reject, max 100 accepted');

  const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  for(const cursor of ['!!!','e30',encode({v:1,workspaceId:a,createdAt:'2026-02-30T00:00:00.000000Z',id:project}),encode({v:1,workspaceId:a,createdAt:'2026-01-01T00:00:00.000001Z',id:'bad'}),encode({v:2,workspaceId:a,createdAt:'2026-01-01T00:00:00.000001Z',id:project}),'a'.repeat(1025)]){
    result=await get(a,'?cursor='+encodeURIComponent(cursor));assert.equal(result.status,400);assert.equal(queries.length,1);
  }
  pass('malformed cursor encoding, structure, date, UUID and length rejected');

  const first=await get(a,'?limit=1','shared@example.test');
  result=await get(b,'?cursor='+first.body.nextCursor,'shared@example.test');assert.equal(result.status,400);pass('cursor cannot cross workspaces even for a shared member');

  for(const filter of ['action=project.archived','entityType=note','action=project.archived&entityType=note']){
    result=await get(a,'?limit=100&'+filter);assert.equal(result.status,200);assert.ok(result.body.items.length);
    for(const item of result.body.items){if(filter.includes('action='))assert.equal(item.action,'project.archived');if(filter.includes('entityType='))assert.equal(item.entityType,'note');}
  }
  result=await get(a,'?action='+encodeURIComponent("' OR 1=1 --"));assert.equal(result.status,200);assert.deepEqual(result.body.items,[]);assert.ok(!queries[1].sql.includes("' OR 1=1 --"));pass('parameterized action/entityType and combined filters');

  const expected=(await db.query('select id from workspace_activity_log where workspace_id=$1 order by created_at desc,id desc',[a])).rows.map(r=>r.id);
  const seen=[];let cursor=null;
  do{
    result=await get(a,'?limit=2'+(cursor?'&cursor='+cursor:''));assert.equal(result.status,200);
    seen.push(...result.body.items.map(r=>r.id));cursor=result.body.nextCursor;
  }while(cursor);
  assert.deepEqual(seen,expected);assert.equal(new Set(seen).size,106);pass('keyset pages preserve microseconds and tied timestamp UUID order');
  result=await get(a,'?action=missing');assert.deepEqual(result.body,{items:[],nextCursor:null});pass('empty result has null cursor');
  console.log(`PASS: ${checks} checks against PostgreSQL and real HTTP routes/access guard`);
}finally{
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await db.end();await admin.query(`drop schema ${schema} cascade`);await admin.end();
}
