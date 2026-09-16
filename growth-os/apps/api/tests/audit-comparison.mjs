import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Read only the compiled pure function; do not start the server or connect to providers.
const source=await readFile(new URL('../dist/server.js',import.meta.url),'utf8');
const start=source.indexOf('function compareAudits(');
const end=source.indexOf('async function refreshAuditActions(',start);
assert.ok(start>=0&&end>start);
const compareAudits=vm.runInNewContext(source.slice(start,end)+'\ncompareAudits');
const issue=(key,status)=>({key,status,title:key,severity:'high'});
const audit=issues=>({issues,overallScore:85,scores:{adsReadiness:85}});
const previous=audit([
  issue('fixed','fail'),issue('open-fail','fail'),issue('open-warn','fail'),
  issue('regressed','pass'),issue('regressed-warn','pass'),issue('removed','pass'),
  issue('unchanged-pass','pass'),issue('fixed-warn','warn'),issue('warn-open','warn')
]);
const current=audit([
  issue('fixed','pass'),issue('open-fail','fail'),issue('open-warn','warn'),
  issue('new','fail'),issue('new-warn','warn'),issue('regressed','fail'),
  issue('regressed-warn','warn'),issue('new-pass','pass'),issue('unchanged-pass','pass'),
  issue('fixed-warn','pass'),issue('warn-open','fail')
]);
const result=compareAudits(previous,current);
const expected={fixed:['fixed','fixed-warn'],stillOpen:['open-fail','open-warn','warn-open'],newIssues:['new','new-warn'],regressed:['regressed','regressed-warn']};
const categorized=[];
for(const [category,keys] of Object.entries(expected)){
  assert.equal(JSON.stringify(result[category].map(item=>item.key)),JSON.stringify(keys),category);
  categorized.push(...result[category].map(item=>item.key));
}
assert.equal(new Set(categorized).size,categorized.length,'Categories must not overlap');
assert.equal(compareAudits(null,current),null);
assert.equal(result.scoreDelta,0);
assert.equal(result.readiness,'not_ready');
const passing=compareAudits(audit([]),audit([issue('new-pass','pass')]));
for(const category of Object.keys(expected))assert.equal(passing[category].length,0);
assert.equal(passing.readiness,'ready');
console.log('PASS audit comparison categories, new pass, removed issue, exclusivity and readiness');
