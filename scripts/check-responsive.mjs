import { existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const executablePath = [
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
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
const widths=[320,360,390,430,820,1440];
const targets={
  tr:['https://ctseg.com.tr/tr/sourcing/iran-halisi/','https://ctseg.com.tr/tr/sourcing/el-dokumasi-ipek-hali/','https://ctseg.com.tr/tr/sourcing/toptan-tekstil-tedariki/'],
  en:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  mk:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  sr:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  sq:['https://ctseg.com.tr/en/sourcing/iranian-carpets/','https://ctseg.com.tr/en/sourcing/hand-knotted-silk-carpets/','https://ctseg.com.tr/en/sourcing/wholesale-textile-sourcing/'],
  fa:['https://ctseg.com.tr/fa/sourcing/فرش-ایرانی/','https://ctseg.com.tr/fa/sourcing/فرش-ابریشم-دستباف/','https://ctseg.com.tr/fa/sourcing/تامین-عمده-منسوجات/']
};
const mythbornDescriptions={
  tr:'Tarot, Katina, astroloji ve kişisel keşif deneyimlerini çok dilli dijital bir platformda birleştiren bağımsız tüketici markası.',
  en:'An independent multilingual consumer brand bringing together Tarot, Katina, astrology and personal discovery experiences in one digital platform.',
  mk:'Независен повеќејазичен потрошувачки бренд што на една дигитална платформа ги обединува искуствата со тарот, Катина, астрологија и лично самооткривање.',
  sr:'Nezavisan višejezični potrošački brend koji na jednoj digitalnoj platformi objedinjuje iskustva tarota, Katine, astrologije i ličnog otkrivanja.',
  sq:'Një markë e pavarur shumëgjuhëshe për konsumatorët, që bashkon në një platformë digjitale përvoja të Tarotit, Katinës, astrologjisë dhe zbulimit personal.',
  fa:'یک برند مستقل و چندزبانه برای تجربه‌های تاروت، کاتینا، طالع‌بینی و خودشناسی در یک پلتفرم دیجیتال.'
};
const failures=[];const results=[];let browser;
try{
  mkdirSync(resolve('.artifacts/visual'),{recursive:true});
  browser=await chromium.launch({executablePath,headless:true});
  for(const locale of locales){
    for(const width of widths){
      const page=await browser.newPage({viewport:{width,height:width<500?900:1100},reducedMotion:'reduce'});
      const homePath=locale==='tr'?'/' : `/${locale}/`;
      const response=await page.goto(`http://127.0.0.1:4323${homePath}`,{waitUntil:'networkidle'});
      const faMobile=locale==='fa'&&width<=430;
      let faMobileResult=null;
      if(faMobile){
        faMobileResult=await page.evaluate(()=>{
          const rect=element=>element.getBoundingClientRect();
          const header=rect(document.querySelector('.site-header'));
          const hero=rect(document.querySelector('.hero'));
          const containers=[...document.querySelectorAll('.hero.shell,#ctseg .shell,.founder-trade>.shell,#focus>.shell,#ventures>.shell,.section>.shell.split,#contact>.shell')];
          const headings=[...document.querySelectorAll('h1,h2')];
          const ctas=[...document.querySelectorAll('.hero-actions a,.trade-focus-card__link,.specialist-areas__links a')];
          return {
            gutters:containers.map(element=>({selector:element.className,left:rect(element).left,right:innerWidth-rect(element).right})),
            headings:headings.map(element=>({text:element.textContent.trim().slice(0,32),left:rect(element).left,right:rect(element).right,width:rect(element).width})),
            ctas:ctas.map(element=>({text:element.textContent.trim().slice(0,32),left:rect(element).left,right:rect(element).right})),
            headerBottom:header.bottom,
            heroTop:hero.top
          };
        });
        const badGutter=faMobileResult.gutters.some(item=>{const minimum=item.selector==='hero shell'?9.5:15.5;return item.left<minimum||item.right<minimum;});
        const badHeading=faMobileResult.headings.some(item=>item.left<0||item.right>width+.5||item.width>width+.5);
        const badCta=faMobileResult.ctas.some(item=>item.left<0||item.right>width+.5);
        if(badGutter||badHeading||badCta||faMobileResult.heroTop<faMobileResult.headerBottom-1){
          failures.push(`fa-${width} mobile geometry: ${JSON.stringify(faMobileResult)}`);
        }
        if(width===320||width===390)await page.screenshot({path:resolve('.artifacts/visual',`fa-${width}-hero.png`)});
      }
      await page.locator('.founder-trade').scrollIntoViewIfNeeded();
      await page.locator('.trade-focus-card__media img').first().evaluate(image=>image.complete?true:new Promise(resolvePromise=>image.addEventListener('load',()=>resolvePromise(true),{once:true})));
      const result=await page.evaluate(({locale,targets,mythbornDescriptions})=>{
        const section=document.querySelector('.founder-trade');
        const links=[...section.querySelectorAll('[data-specialist-link]')];
        const image=section.querySelector('.trade-focus-card__media img');
        const arrows=[...links].map(link=>link.querySelector('i'));
        const mythbornCard=[...document.querySelectorAll('#ventures a')].find(link=>new URL(link.href).hostname==='mythborn.co');
        const mythbornBox=mythbornCard?.getBoundingClientRect();
        const mythbornMarquee=[...document.querySelectorAll('.venture-marquee__item')].filter(link=>new URL(link.href).hostname==='mythborn.co');
        return {
          status:document.readyState==='complete',
          lang:document.documentElement.lang,dir:document.documentElement.dir,
          rootDirection:getComputedStyle(document.documentElement).direction,
          bodyDirection:getComputedStyle(document.body).direction,
          overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
          sectionVisible:Boolean(section?.getBoundingClientRect().height),
          imageVisible:Boolean(image?.complete&&image.naturalWidth>0&&image.getBoundingClientRect().height),
          links:links.map(link=>decodeURI(link.href)),
          arrowsLtr:arrows.every(arrow=>arrow?.textContent?.trim()==='↗'),
          headerVisible:Boolean(document.querySelector('header')?.getBoundingClientRect().height),
          footerVisible:Boolean(document.querySelector('footer')?.getBoundingClientRect().height),
          marqueeLinks:document.querySelectorAll('.venture-marquee__item').length,
          mythbornCard:Boolean(mythbornCard&&mythbornBox.height>0),
          mythbornHref:mythbornCard?.href,
          mythbornCopy:mythbornCard?.textContent.includes(mythbornDescriptions[locale]),
          mythbornInside:Boolean(mythbornBox&&mythbornBox.left>=-.5&&mythbornBox.right<=innerWidth+.5),
          mythbornOverflow:mythbornCard?Math.max(0,mythbornCard.scrollWidth-mythbornCard.clientWidth):null,
          mythbornMarquee:mythbornMarquee.length,
          mythbornMarqueeTargets:mythbornMarquee.every(link=>link.href==='https://mythborn.co/'),
          expected:targets[locale]
        };
      },{locale,targets,mythbornDescriptions});
      const bad=response?.status()!==200||!result.status||result.lang!==locale||
        result.dir!==(locale==='fa'?'rtl':'ltr')||result.rootDirection!==(locale==='fa'?'rtl':'ltr')||
        result.bodyDirection!==(locale==='fa'?'rtl':'ltr')||result.overflow!==0||!result.sectionVisible||!result.imageVisible||
        result.links.length!==3||!result.expected.every((href,index)=>result.links[index]===href)||
        !result.arrowsLtr||!result.headerVisible||!result.footerVisible||result.marqueeLinks!==8||!result.mythbornCard||
        result.mythbornHref!=='https://mythborn.co/'||!result.mythbornCopy||!result.mythbornInside||result.mythbornOverflow!==0||
        result.mythbornMarquee!==2||!result.mythbornMarqueeTargets;
      if(bad)failures.push(`${locale}-${width}: ${JSON.stringify(result)}`);
      results.push(`${locale}-${width}: overflow=${result.overflow}px, links=${result.links.length}, dir=${result.dir}`);
      if(faMobile){
        const captureTargets=width===390?[
          ['.trade-focus-grid','fa-390-carpet-textile.png'],
          ['.specialist-areas','fa-390-specialist-areas.png'],
          ['.site-footer','fa-390-footer.png']
        ]:[];
        for(const [selector,file] of captureTargets){
          await page.locator(selector).scrollIntoViewIfNeeded();
          await page.waitForTimeout(100);
          await page.screenshot({path:resolve('.artifacts/visual',file)});
          const overlap=await page.evaluate(()=>{
            const floating=[...document.querySelectorAll('.floating-action')].filter(element=>{const group=element.closest('.floating-actions');return getComputedStyle(element).visibility!=='hidden'&&Number(getComputedStyle(group).opacity)>.05});
            const content=[...document.querySelectorAll('h1,h2,.actions a,.sector-link,.fa-producer-strategy__actions a')].filter(element=>{const box=element.getBoundingClientRect();return box.bottom>0&&box.top<innerHeight});
            const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
            return floating.some(action=>content.some(element=>intersects(action.getBoundingClientRect(),element.getBoundingClientRect())));
          });
          if(overlap)failures.push(`fa-${width}: floating actions overlap text or CTA near ${selector}`);
        }
        if(width===430){
          await page.evaluate(()=>scrollTo(0,0));
          await page.screenshot({path:resolve('.artifacts/visual','fa-430-full-page.png'),fullPage:true});
        }
      }
      if(width===390||width===1440)await page.locator('.founder-trade').screenshot({path:resolve('.artifacts/visual',`trade-${locale}-${width}.png`)});
      if(width===390||width===1440){
        await page.locator('#ventures').scrollIntoViewIfNeeded();
        await page.locator('#ventures').screenshot({path:resolve('.artifacts/visual',`ventures-${locale}-${width}.png`)});
      }
      await page.close();
    }
  }
}finally{await browser?.close();await new Promise(resolvePromise=>server.close(resolvePromise))}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(results.join('\n'));
console.log('Responsive check passed: six locales, six widths, Mythborn venture card/copy/live target/marquee, three CTA targets, editorial visual, RTL/LTR, header/footer and zero horizontal overflow; FA mobile geometry verified.');
