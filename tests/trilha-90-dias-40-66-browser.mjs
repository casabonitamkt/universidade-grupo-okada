// Smoke offline da consolidacao editorial 43-66; nenhuma mensagem, credencial ou persistencia.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
const root=resolve('.');
const server=createServer(async (req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+pathname);
    if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
    const bytes=await readFile(file);
    res.writeHead(200,{'content-type':extname(file)==='.mjs'?'text/javascript; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const ranges=[[43,45],[46,48],[49,51],[52,54],[55,57],[58,60],[61,63],[64,66]];
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const width of [1366,390,320]){
    const context=await browser.newContext({viewport:{width,height:850}});
    const errors=[];
    await context.route('**/*',route=>{
      if(new URL(route.request().url()).hostname==='127.0.0.1')return route.continue();
      errors.push('External request: '+route.request().url());return route.abort();
    });
    for(const [start,end] of ranges){
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      const response=await page.goto(base+'/homologacao/aulas-'+start+'-'+end+'.html',{waitUntil:'networkidle'});
      assert.equal(response.status(),200);
      assert.equal(await page.locator('#dia option').count(),3);
      for(let dia=start;dia<=end;dia++){
        await page.locator('#dia').selectOption(String(dia));
        assert.match(await page.locator('#titulo').innerText(),new RegExp('Dia '+dia));
        assert.equal(await page.locator('#questoes fieldset').count(),8);
      }
      await page.locator('#dia').selectOption(String(start));
      for(let i=0;i<8;i++)await page.locator('input[name="q'+i+'"][value="'+(i%4)+'"]').check();
      await page.locator('#corrigir').click();
      assert.match(await page.locator('#resultado').innerText(),/8\/8/);
      await page.locator('#refazer').click();
      for(let i=0;i<8;i++)await page.locator('input[name="q'+i+'"][value="'+((i+1)%4)+'"]').check();
      await page.locator('#corrigir').click();
      assert.match(await page.locator('#resultado').innerText(),/8\/8/);
      await page.locator('#praticar textarea').fill('Rascunho descartavel');
      await page.reload({waitUntil:'networkidle'});
      assert.equal(await page.locator('#praticar textarea').inputValue(),'');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'Overflow '+start+'-'+end+' '+width);
      await page.close();
    }
    assert.deepEqual(errors,[],'Nenhuma requisicao externa ou erro JS');
    await context.close();
  }
  console.log('Smoke editorial 43-66: 8 paginas, 24 aulas, desktop/390/320, prova, reteste e rascunho OK');
}finally{await browser?.close();await new Promise(ok=>server.close(ok))}
