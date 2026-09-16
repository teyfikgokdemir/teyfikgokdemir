import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=(await readFile(new URL('../dist/ads-sync.js',import.meta.url),'utf8'))
  .replace(/^import .*;\r?\n/gm,'')
  .replace(/export async function /g,'async function ');

let integrationProvider='meta_ads';
let fetchImpl=async()=>{throw new Error('fetch not configured')};
const jsonResponse=payload=>new Response(JSON.stringify(payload),{status:200,headers:{'content-type':'application/json'}});
const pool={
  async query(sql,params){
    if(sql.includes('select status from projects'))return {rows:[{status:'active'}]};
    if(sql.includes('from integrations')){
      if(integrationProvider==='meta_ads')return {rows:[{metadata:{accessTokenEncrypted:'test',selectedAdAccountId:'123'}}]};
      if(integrationProvider==='tiktok_ads')return {rows:[{metadata:{accessTokenEncrypted:'test',selectedAdvertiserId:'456'}}]};
    }
    throw new Error(`Unexpected query: ${sql} ${JSON.stringify(params||[])}`);
  }
};
const api=vm.runInNewContext(source+'\n({metaMetrics,tiktokMetrics})',{
  pool,
  process,
  URL,
  Error,
  AbortController,
  TextDecoder,
  decryptSecret:()=> 'token',
  googleAccessForProject:async()=> 'token',
  refreshGrowthIntelligence:async()=>({counts:{alerts:0,recommendations:0}}),
  fetch:(...args)=>fetchImpl(...args),
});

const metaRow=id=>({campaign_id:id,campaign_name:`Campaign ${id}`,date_start:'2026-09-15',spend:'1',impressions:'10',clicks:'1'});
const tiktokRow=id=>({dimensions:{campaign_id:id,stat_time_day:'2026-09-15'},metrics:{campaign_name:`Campaign ${id}`,spend:'1',impressions:'10',clicks:'1',conversion:'0'}});

integrationProvider='meta_ads';
let fetches=0;
fetchImpl=async input=>{
  fetches++;
  assert.match(String(input),/^https:\/\/graph.facebook.com\//);
  if(fetches===1)return jsonResponse({data:[metaRow('a')],paging:{next:'https://graph.facebook.com/next'}});
  return jsonResponse({data:[metaRow('b')]});
};
const metaRows=await api.metaMetrics('project',30);
assert.equal(fetches,2);
assert.equal(metaRows.map(row=>row.campaignId).join(','),'a,b');
console.log('PASS meta pagination');

fetches=0;
fetchImpl=async()=>{
  fetches++;
  return jsonResponse({data:Array.from({length:5000},(_,i)=>metaRow(String(i))),paging:{next:'https://graph.facebook.com/next'}});
};
await assert.rejects(()=>api.metaMetrics('project',30),/5000 kayıt limitini aştı/);
assert.equal(fetches,1);
console.log('PASS meta truncation guard');

integrationProvider='tiktok_ads';
fetches=0;
fetchImpl=async input=>{
  fetches++;
  const page=Number(new URL(String(input)).searchParams.get('page')||'1');
  return jsonResponse({code:0,message:'OK',data:{list:[tiktokRow(page===1?'a':'b')],page_info:{page,page_size:1000,total_page:2,total_number:2}}});
};
const tiktokRows=await api.tiktokMetrics('project',30);
assert.equal(fetches,2);
assert.equal(tiktokRows.map(row=>row.campaignId).join(','),'a,b');
console.log('PASS tiktok pagination');

fetches=0;
fetchImpl=async input=>{
  fetches++;
  const page=Number(new URL(String(input)).searchParams.get('page')||'1');
  return jsonResponse({code:0,message:'OK',data:{list:[tiktokRow('a')],page_info:{page,page_size:1000,total_page:101,total_number:101000}}});
};
await assert.rejects(()=>api.tiktokMetrics('project',30),/100 sayfa limitini aştı/);
assert.equal(fetches,1);
console.log('PASS tiktok truncation guard');
