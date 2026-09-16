import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
for(const [name,label] of [['google','Google'],['google-analytics','Google Analytics'],['google-search-console','Search Console']]){
 const source=await readFile(new URL(`../dist/${name}.js`,import.meta.url),'utf8');
 let response={ok:true,status:200},text='';
 const start=source.indexOf('async function getJson('),end=source.indexOf('async function postJson(',start);
 const get=vm.runInNewContext(source.slice(start,end)+'\ngetJson',{Error,googleRequestText:async()=>({response,text}),fetchText:async()=>({response,text})});
 for(const body of ['secret-invalid-json','', 'null','"secret"','{"error":{"message":"secret"}}']){
  text=body;await assert.rejects(()=>get('url','token'),e=>!e.message.includes('secret'));
 }
 for(const status of [401,403,429,500]){
  response={ok:false,status};text='{"message":"secret"}';
  await assert.rejects(()=>get('url','token'),e=>e.message.includes(String(status))&&!e.message.includes('secret'));
 }
 response={ok:true,status:200};text='{"rows":[]}';assert.equal((await get('url','token')).rows.length,0);
}
for(const name of ['meta','tiktok']){
 const source=await readFile(new URL(`../dist/${name}.js`,import.meta.url),'utf8');
 const start=source.indexOf('async function fetchJson('),end=source.indexOf('export ',start);
 let text='secret-invalid-json';
 const run=vm.runInNewContext(source.slice(start,end)+'\nfetchJson',{Error,AbortController,setTimeout,clearTimeout,META_HTTP_TIMEOUT_MS:20,TIKTOK_HTTP_TIMEOUT_MS:20,fetch:async()=>({}),readLimitedText:async()=>text});
 await assert.rejects(()=>run('url'),e=>!e.message.includes('secret'));
 text='null';await assert.rejects(()=>run('url'),/geçersiz/);
}
const google=await readFile(new URL('../dist/google.js',import.meta.url),'utf8');
const start=google.indexOf('async function googleRequestText('),end=google.indexOf('export ',start);
const timed=vm.runInNewContext(google.slice(start,end)+'\ngoogleRequestText',{Error,AbortController,setTimeout,clearTimeout,GOOGLE_HTTP_TIMEOUT_MS:5,fetch:async(u,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(o.signal.reason))),readBoundedText:async()=>''});
await assert.rejects(()=>timed('url'),/zaman aşımına/);
const reader=vm.runInNewContext(google.slice(google.indexOf('async function readBoundedText('),start)+'\nreadBoundedText',{Error,TextDecoder,GOOGLE_HTTP_MAX_BYTES:4});
await assert.rejects(()=>reader(new Response('secret')),/boyut/);
console.log('PASS malformed/empty JSON, secret-free errors, 401/403/429/500, timeout and bounded response');
