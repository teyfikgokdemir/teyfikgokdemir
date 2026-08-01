import { existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].find(existsSync);
if (!executablePath) throw new Error('Chrome or Edge executable was not found.');

const dist=resolve('dist');
const server=createServer(async(request,response)=>{
  const pathname=decodeURI(new URL(request.url??'/','http://127.0.0.1').pathname);
  let file=join(dist,pathname.replace(/^\/+/,'')); if(!extname(file))file=join(file,'index.html');
  try{
    const body=await readFile(file);
    const extension=extname(file);
    const type=extension==='.html'?'text/html; charset=utf-8':extension==='.css'?'text/css':extension==='.webp'?'image/webp':extension==='.png'?'image/png':'application/octet-stream';
    response.writeHead(200,{'content-type':type});response.end(body);
  }catch{response.writeHead(404);response.end('Not found')}
});
await new Promise(resolvePromise=>server.listen(4323,'127.0.0.1',resolvePromise));

const locales=['tr','en','mk','sr','sq','fa'];
const widths=[320,390,430,820,1440];
const targets={
  tr:['https://ctseg.com.tr/tr/sourcing/iran-halisi/','https://ctseg.com.tr/tr/sourcing/el-dokumasi-ipek-hali/','https://ctseg.com.tr/tr/sourcing/toptan-tekstil-tedariki/'],
  en:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  mk:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  sr:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  sq:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  fa:['https://ctseg.com.tr/fa/sourcing/فرش-ایرانی/','https://ctseg.com.tr/fa/sourcing/فرش-ابریشم-دستباف/','https://ctseg.com.tr/fa/sourcing/تامین-عمده-منسوجات/']
};
const failures=[];const results=[];let browser;
try{
  mkdirSync(resolve('.artifacts/visual'),{recursive:true});
  browser=await chromium.launch({executablePath,headless:true});
  for(const locale of locales){
    for(const width of widths){
      const page=await browser.newPage({viewport:{width,height:width<500?900:1100},reducedMotion:'reduce'});
      const response=await page.goto(`http://127.0.0.1:4323/${locale}/`,{waitUntil:'networkidle'});
      await page.locator('.founder-trade').scrollIntoViewIfNeeded();
      await page.locator('.founder-trade__editorial img').evaluate(image=>image.complete?true:new Promise(resolvePromise=>image.addEventListener('load',()=>resolvePromise(true),{once:true})));
      const result=await page.evaluate(({locale,targets})=>{
        const section=document.querySelector('.founder-trade');
        const links=[...section.querySelectorAll('[data-sector-link]')];
        const image=section.querySelector('.founder-trade__editorial img');
        const arrows=[...links].map(link=>link.querySelector('bdi'));
        return {
          status:document.readyState==='complete',
          lang:document.documentElement.lang,dir:document.documentElement.dir,
          rootDirection:getComputedStyle(document.documentElement).direction,
          bodyDirection:getComputedStyle(document.body).direction,
          overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
          sectionVisible:Boolean(section?.getBoundingClientRect().height),
          imageVisible:Boolean(image?.complete&&image.naturalWidth>0&&image.getBoundingClientRect().height),
          links:links.map(link=>decodeURI(link.href)),
          arrowsLtr:arrows.every(arrow=>arrow&&getComputedStyle(arrow).direction==='ltr'),
          headerVisible:Boolean(document.querySelector('header')?.getBoundingClientRect().height),
          footerVisible:Boolean(document.querySelector('footer')?.getBoundingClientRect().height),
          marqueeLinks:document.querySelectorAll('.venture-marquee__item').length,
          expected:targets[locale]
        };
      },{locale,targets});
      const bad=response?.status()!==200||!result.status||result.lang!==locale||
        result.dir!==(locale==='fa'?'rtl':'ltr')||result.rootDirection!==(locale==='fa'?'rtl':'ltr')||
        result.bodyDirection!==(locale==='fa'?'rtl':'ltr')||result.overflow!==0||!result.sectionVisible||!result.imageVisible||
        result.links.length!==3||!result.expected.every((href,index)=>result.links[index]===href)||
        !result.arrowsLtr||!result.headerVisible||!result.footerVisible||result.marqueeLinks!==8;
      if(bad)failures.push(`${locale}-${width}: ${JSON.stringify(result)}`);
      results.push(`${locale}-${width}: overflow=${result.overflow}px, links=${result.links.length}, dir=${result.dir}`);
      if(width===390||width===1440)await page.locator('.founder-trade').screenshot({path:resolve('.artifacts/visual',`trade-${locale}-${width}.png`)});
      await page.close();
    }
  }
}finally{await browser?.close();await new Promise(resolvePromise=>server.close(resolvePromise))}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(results.join('\n'));
console.log('Responsive check passed: six locales, five widths, three CTA targets, editorial visual, RTL/LTR, header/footer/marquee and zero horizontal overflow.');
