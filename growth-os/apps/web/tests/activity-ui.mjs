import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// node tests/activity-ui.mjs <local-web-url> <playwright-module-path> [screenshot-directory]
const base=process.argv[2];
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const {chromium}=await import(pathToFileURL(process.argv[3]).href);
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'tr-TR',timezoneId:'Europe/Istanbul'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const workspace='550e8400-e29b-41d4-a716-446655440001';
const make=(id,action,entityName,extra={})=>({id,actorEmail:'teyfik@example.test',action,entityType:'project',entityId:'deleted-project',entityName,metadata:{domain:'olivon.test'},createdAt:'2026-09-13T08:45:00.000001Z',...extra});
const items=[make('1','project.archived','Olivon — Kurumsal Web'),make('2','project.restored','Olivon — E-ticaret'),make('3','project.deleted','Eski Kampanya Sitesi')];
let scenario='loading',release,activityRequests=[];
let ready=new Promise(resolve=>release=resolve);
await page.route('**/api/growth/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/growth/workspaces/me')return route.fulfill({json:{actor:{workspaceId:workspace,email:'viewer@example.test',role:'viewer'},workspace:{name:'Olivon Çalışma Alanı'}}});
  if(url.pathname!==`/api/growth/workspaces/${workspace}/activity`)return route.fulfill({json:{}});
  activityRequests.push(url);
  if(scenario==='loading')await ready;
  if(scenario==='error'||(scenario==='pagination-error'&&url.searchParams.has('cursor')))return route.fulfill({status:502,json:{error:'Test error'}});
  if(scenario==='empty')return route.fulfill({json:{items:[],nextCursor:null}});
  if(url.searchParams.has('cursor'))return route.fulfill({json:{items:[items[2],make('4','project.archived',null,{actorEmail:'very-long-actor-address-with-no-spaces-'.repeat(4)+'@example.test',metadata:{domain:'verylongdomain'.repeat(10)+'.test'}})],nextCursor:null}});
  return route.fulfill({json:{items,nextCursor:'next-page-token'}});
});
const list=page.getByRole('list',{name:'Aktivite kayıtları'});
const count=async n=>{await page.waitForFunction(n=>document.querySelectorAll('ol[aria-label="Aktivite kayıtları"]>li').length===n,n)};
try{
  await page.goto(base+'/activity');
  await page.getByText('Aktivite geçmişi yükleniyor…',{exact:true}).waitFor();
  assert.equal(await list.count(),0);console.log('PASS loading');
  scenario='list';release();await count(3);
  for(const text of ['Proje arşivlendi','Proje geri alındı','Proje kalıcı silindi','Eski Kampanya Sitesi'])await page.getByText(text,{exact:true}).waitFor();
  assert.match(await list.innerText(),/13 Eylül 2026/);assert.match(await list.innerText(),/11:45/);
  assert.equal(activityRequests[0].searchParams.get('limit'),'50');console.log('PASS list, viewer workspace, durable deleted entity, Turkish date');
  if(process.argv[4])await page.screenshot({path:path.join(process.argv[4],'activity-desktop.png'),fullPage:true});
  scenario='pagination-error';await page.getByRole('button',{name:'Daha fazla yükle',exact:true}).click();
  await page.getByRole('alert').waitFor();await count(3);console.log('PASS pagination error retains current list');
  scenario='list';await page.getByRole('button',{name:'Tekrar dene',exact:true}).click();await count(4);
  assert.equal(await page.getByText('Eski Kampanya Sitesi',{exact:true}).count(),1);
  await page.getByText('İsimsiz proje',{exact:true}).waitFor();
  assert.equal(activityRequests.at(-1).searchParams.get('cursor'),'next-page-token');
  assert.equal(await page.getByRole('button',{name:'Daha fazla yükle',exact:true}).count(),0);console.log('PASS pagination append, retry, deduplication and fallback');
  for(const width of [1440,1024,768,390,320]){
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,`overflow at ${width}`);
    assert.equal(await page.getByRole('link',{name:'Aktivite Geçmişi',exact:true}).isVisible(),true);
  }
  await page.setViewportSize({width:390,height:1000});
  if(process.argv[4])await page.screenshot({path:path.join(process.argv[4],'activity-mobile.png'),fullPage:true});
  console.log('PASS responsive layout including long domain/email at 1440/1024/768/390/320');
  scenario='empty';await page.reload();await page.getByText('Henüz bir hareket yok',{exact:true}).waitFor();assert.equal(await list.count(),0);console.log('PASS empty');
  scenario='error';await page.reload();await page.getByRole('alert').waitFor();assert.equal(await list.count(),0);console.log('PASS API error');
  scenario='list';await page.getByRole('button',{name:'Tekrar dene',exact:true}).click();await count(3);console.log('PASS initial retry');
  await page.goto(base+'/projects');assert.equal(await page.getByRole('link',{name:'Aktivite Geçmişi',exact:true}).getAttribute('href'),'/activity');
  await page.getByRole('link',{name:'Aktivite Geçmişi',exact:true}).click();await page.getByRole('heading',{name:'Aktivite Geçmişi.'}).waitFor();
  console.log('PASS projects navigation uses a real route');
  assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');
}finally{await browser.close()}
