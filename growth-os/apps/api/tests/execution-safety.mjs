import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const load=async name=>(await readFile(new URL(`../dist/${name}.js`,import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/export (async function|function|const) /g,'$1 ');
// Isolated process stub: these combinations never change actual environment flags.
const env={};let row;
const policy=vm.runInNewContext(await load('execution-policy')+'\n({getExecutionPolicy,assertExecutionAllowed})',{Error,process:{env},pool:{query:async()=>({rows:row?[row]:[]})}});
const executors=vm.runInNewContext(await load('executors')+'\n({previewExecution,executorCapabilities,resolveExecutor})',{process:{env}});
const planner=vm.runInNewContext(await load('execution-planner')+'\nbuildExecutionPlan',executors);
for(const external of [undefined,'false','true'])for(const ads of [undefined,'false','true']){
 env.EXTERNAL_EXECUTION_ENABLED=external;env.ADS_WRITE_ENABLED=ads;
 row={ads_write_enabled:true,require_manual_approval:true,allowed_providers:['google_ads','meta_ads','tiktok_ads']};
 const enabled=external==='true'&&ads==='true';
 assert.equal((await policy.getExecutionPolicy('p')).canExecute,enabled);
 for(const provider of row.allowed_providers){
  if(!enabled)await assert.rejects(()=>policy.assertExecutionAllowed('p',provider,true),/gate kapalı/);
  const context={projectId:'p',recommendationId:'r',executionJobId:'j',provider,actionType:'budget_change',requestedState:{}};
  const result=await executors.previewExecution(context);
  assert.equal(result.externalExecution,false);assert.notEqual(result.status,'executed');
  assert.ok(planner(context).blockers.length>0);
 }
}
row=undefined;await assert.rejects(()=>policy.assertExecutionAllowed('p','google_ads',true),/proje/);
row={ads_write_enabled:false};await assert.rejects(()=>policy.assertExecutionAllowed('p','google_ads',true),/proje/);
row={ads_write_enabled:true,allowed_providers:[]};await assert.rejects(()=>policy.assertExecutionAllowed('p','google_ads',true),/listesinde/);
row={ads_write_enabled:true,allowed_providers:['google_ads']};await assert.rejects(()=>policy.assertExecutionAllowed('p','google_ads',false),/manuel onay/);
assert.equal((await policy.assertExecutionAllowed('p','google_ads',true)).requireManualApproval,true);
for(const provider of ['github','commerce','unknown'])assert.equal((await executors.previewExecution({provider,actionType:'test'})).externalExecution,false);
const orchestrator=await load('execution-orchestrator');
assert.match(orchestrator,/recommendation.status !== 'approved'/);
assert.match(orchestrator,/if \(!prepared.ready\)/);
for(const name of ['executors','execution-planner','execution-orchestrator','execution-workflow'])assert.doesNotMatch(await load(name),/\bfetch\s*\(|\bhttps?\.request\s*\(/);
console.log('PASS dual-gate matrix, project policy, allowlist, approval, read-only adapters and orchestration');
