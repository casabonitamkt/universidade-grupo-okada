// Smoke isolado Sierra 67–69: localhost, sem credenciais ou rede externa.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const full=resolve(root,'.'+path);
    if(!full.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
    const data=await readFile(full);
    res.writeHead(200,{'content-type':extname(full)==='.mjs'?'text/javascript; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  await mkdir('artifacts',{recursive:true});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [mode,viewport] of Object.entries({desktop:{width:1366,height:850},mobile:{width:390,height:844}})){
    const ctx=await browser.newContext({viewport});
    const failures=[];
    await ctx.route('**/*',route=>{
      const u=new URL(route.request().url());
      if(u.hostname==='127.0.0.1')return route.continue();
      failures.push('Requisição externa: '+u.hostname);return route.abort();
    });
    const page=await ctx.newPage();
    page.on('pageerror',e=>failures.push('JS: '+e.message));
    page.on('console',m=>{if(m.type()==='error')failures.push('Console: '+m.text());});
    const response=await page.goto(base+'/homologacao/aulas-67-69.html',{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    assert.equal(await page.locator('#dia option').count(),3);
    for(const dia of ['67','68','69']){
      await page.locator('#dia').selectOption(dia);
      assert.match(await page.locator('#titulo').innerText(),new RegExp('Dia '+dia));
      assert.equal(await page.locator('#questoes fieldset').count(),8);
      for(let i=0;i<8;i++)await page.locator('input[name="q'+i+'"][value="'+(i%4)+'"]').check();
      await page.getByRole('button',{name:'Corrigir nesta tela'}).click();
      assert.match(await page.locator('#resultado').innerText(),/8\/8/);
      await page.getByRole('button',{name:/Refazer/}).click();
      for(let i=0;i<8;i++)await page.locator('input[name="q'+i+'"][value="'+((i+1)%4)+'"]').check();
      await page.getByRole('button',{name:'Corrigir nesta tela'}).click();
      assert.match(await page.locator('#resultado').innerText(),/8\/8/);
    }
    await page.locator('#praticar textarea').fill('Rascunho descartável de teste.');
    await page.screenshot({path:'artifacts/sierra-69-'+mode+'.png',fullPage:true});
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('#praticar textarea').inputValue(),'');
    assert.equal(await page.locator('#resultado').innerText(),'');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,'Overflow '+mode);
    assert.deepEqual(failures,[]);
    await ctx.close();
    process.stdout.write('OK Sierra 67–69 '+mode+': 3 aulas, 24 questões, reteste e descarte local.\n');
  }
}finally{
  if(browser)await browser.close();
  await new Promise(ok=>server.close(ok));
}
