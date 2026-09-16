import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../dist/google.js',import.meta.url),'utf8');
const section=source.slice(source.indexOf('const SEARCH_CONSOLE_PAGE_SIZE'),source.indexOf('async function merchantCommerceForProject')).replaceAll('export async function','async function');
let impl;const calls=[];
const api=vm.runInNewContext(section+'\n({searchConsoleRows,searchConsolePerformanceForProject})',{
  URL,Date,Error,isoDate:d=>d.toISOString().slice(0,10),searchConsoleSiteDomain:()=> 'example.com',
  pool:{query:async()=>({rows:[{domain:'example.com'}]})},googleAccessForProject:async()=> 'token',
  getJson:async()=>({siteEntry:[{siteUrl:'sc-domain:example.com'}]}),postJson:async(e,t,b)=>{calls.push(b);return impl(b)}
});
const rows=(start,n)=>Array.from({length:n},(_,i)=>({keys:[String(start+i)],clicks:1,impressions:2,position:3}));
impl=b=>b.dimensions.length===0?{rows:[{clicks:9000,impressions:18000,position:4}]}:{rows:rows(b.startRow,b.dimensions[0]==='query'?(b.startRow===0?1000:2):1)};
const result=await api.searchConsolePerformanceForProject('p');
assert.equal(result.summary.clicks,9000);assert.equal(result.summary.position,4);
assert.equal(result.queries.length,100);assert.equal(result.pages.length,1);
assert.equal(result.partial,false);assert.equal(result.detailCoverage,'top_rows');
assert.equal(calls.filter(b=>b.dimensions[0]==='query').map(b=>b.startRow).join(','),'0,1000');
assert.equal(calls.filter(b=>b.dimensions[0]==='page').map(b=>b.startRow).join(','),'0');
impl=b=>({rows:rows(b.startRow,1000)});calls.length=0;
const capped=await api.searchConsoleRows('url','token',{},'query');
assert.equal(capped.partial,true);assert.equal(capped.rows.length,20000);assert.equal(calls.length,20);
impl=b=>({rows:b.startRow?[]:rows(0,1000)});
assert.equal((await api.searchConsoleRows('url','token',{},'page')).partial,false);
impl=()=>({rows:rows(0,1000)});
await assert.rejects(()=>api.searchConsoleRows('url','token',{},'query'),/tekrar eden/);
impl=()=>{throw new Error('upstream failed')};
await assert.rejects(()=>api.searchConsoleRows('url','token',{},'query'),/upstream failed/);
console.log('PASS Search Console offsets, independent datasets, total summary, cap, boundary, loop and upstream failure');
