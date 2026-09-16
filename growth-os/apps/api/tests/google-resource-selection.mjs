import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const load=async(name)=>readFile(new URL(`../dist/${name}.js`,import.meta.url),'utf8');
const extract=(s,start,end)=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start))).replace(/^export /gm,'');
let metadata={};let reads=[];
const pool={query:async sql=>({rows:[sql.includes('select domain')?{domain:'example.com'}:{metadata}]})};
const common={pool,URL,Date,Error,process,googleAccessForProject:async()=> 'token',normalizeDomain:s=>s,searchConsoleSiteDomain:()=> 'example.com',isoDate:d=>d.toISOString().slice(0,10)};
const google=await load('google');
const legacy=vm.runInNewContext(extract(google,'export async function searchConsolePerformanceForProject','async function merchantCommerceForProject')+'\nsearchConsolePerformanceForProject',{
 ...common,getJson:async()=>({siteEntry:[{siteUrl:'sc-domain:example.com'},{siteUrl:'sc-domain:chosen.com'}]}),
 searchConsoleRows:async endpoint=>{reads.push(endpoint);return {rows:[],partial:false}},postJson:async()=>({})
});
metadata={selectedSearchConsoleSiteUrl:'sc-domain:missing.com'};
assert.equal((await legacy('p')).matched,false);assert.equal(reads.length,0);
metadata={selectedSearchConsoleSiteUrl:'sc-domain:chosen.com'};
assert.equal((await legacy('p')).siteUrl,'sc-domain:chosen.com');assert.ok(reads.every(url=>url.includes('chosen.com')));
for(const [name,fn,selection,listName,listValue,end] of [
 ['google-analytics','analyticsPerformanceForProject','selectedAnalyticsProperty','listProperties',[{property:'properties/other'}],null],
 ['google-search-console','searchConsolePerformanceForWorkspaceProject','selectedSearchConsoleSiteUrl','listSites',[{siteUrl:'sc-domain:example.com'}],null]
]){
 const s=await load(name);const body=s.slice(s.indexOf(`export async function ${fn}(`)).replace(/^export /gm,'');
 metadata={[selection]:'missing'};
 const run=vm.runInNewContext(body+`\n${fn}`,{...common,[listName]:async()=>listValue});
 assert.equal((await run('p')).matched,false);
}
metadata={selectedMerchantAccountName:'accounts/missing'};
const merchant=vm.runInNewContext(extract(google,'async function merchantCommerceForProject','export async function discoverGoogleResources')+'\nmerchantCommerceForProject',{
 ...common,merchantAccountPages:async()=>({accounts:[{name:'accounts/other'}]}),getJson:async()=>({uri:'example.com'})
});
assert.equal((await merchant('p','token')).matched,false);
assert.match(google,/\['analyticsPerformance',\s*\(\) => analyticsPerformanceForProject\(projectId\)\]/);
const ads=await load('ads-sync');
const metrics=vm.runInNewContext(extract(ads,'async function googleMetrics(','function metaActionValue(')+'\ngoogleMetrics',{
 ...common,integration:async()=>({metadata:{selectedCustomerId:'123'}}),lastNDays:()=>({start:'2026-01-01',end:'2026-01-02'}),assertProjectStillActive:async()=>{},providerFetchText:async url=>{assert.ok(url.includes('/customers/123/'));return {response:{status:403,ok:false},text:'secret'}}
});
await assert.rejects(()=>metrics('p',28),/yeniden seçin/);
console.log('PASS stale GA4, GSC, Merchant, Ads selection; legacy explicit selection and GA4 delegation');
