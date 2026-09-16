import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const src=await readFile(new URL('../dist/google-analytics.js',import.meta.url),'utf8');
const partial=vm.runInNewContext(src.slice(src.indexOf('function reportIsPartial'),src.indexOf('const ANALYTICS_HTTP_TIMEOUT_MS'))+'\nreportIsPartial');
assert.equal(partial({rows:[{}],rowCount:1}),false);
assert.equal(partial({rows:[],rowCount:0}),false);
assert.equal(partial({rows:[{}],rowCount:51}),true);
for(const metadata of [{dataLossFromOtherRow:true},{subjectToThresholding:true},{samplingMetadatas:[{}]},{dataTruncationReasons:[{}]},{emptyReason:'restricted'},{schemaRestrictionResponse:{activeMetricRestrictions:[{}]}}])assert.equal(partial({metadata}),true);
const meta=await readFile(new URL('../dist/meta.js',import.meta.url),'utf8');
let count=0;
const getPaged=vm.runInNewContext(meta.slice(meta.indexOf('async function getPagedCollection'),meta.indexOf('export async function discoverMetaResources'))+'\ngetPagedCollection',{Error,META_MAX_PAGES:2,getJson:async()=>({data:[],paging:{cursors:{after:String(++count)}}})});
await assert.rejects(()=>getPaged('/test','token'),/sayfa limitini/);
const gsc=await readFile(new URL('../dist/google-search-console.js',import.meta.url),'utf8');
const seen=[];
const run=vm.runInNewContext(gsc.slice(gsc.indexOf('export async function searchConsolePerformanceForWorkspaceProject')).replace('export async','async')+'\nsearchConsolePerformanceForWorkspaceProject',{
  Date,normalizeDomain:s=>s,isoDate:d=>d.toISOString().slice(0,10),pool:{query:async()=>({rows:[{domain:'example.com',metadata:{}}]})},googleAccessForProject:async()=> 'token',listSites:async()=>[{siteUrl:'sc-domain:example.com'}],postJson:async()=>({rows:[{clicks:10}]}),searchConsoleRows:async(e,t,b,d)=>{seen.push(d);return {rows:[],partial:d==='query'}}
});
const result=await run('p');assert.equal(result.partial,true);assert.equal(result.partialQueries,true);assert.equal(result.partialPages,false);assert.deepEqual(seen.sort(),['page','query']);
console.log('PASS partial report metadata, empty Meta cap and workspace GSC propagation');
