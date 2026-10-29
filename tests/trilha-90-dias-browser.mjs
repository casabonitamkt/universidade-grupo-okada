// Smoke test visual/funcional local, sem credenciais, Supabase ou WhatsApp.
// Executar apos instalar playwright e Chromium: node tests/trilha-90-dias-browser.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('.');
const mime = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const full = resolve(root, '.' + pathname);
    if (!full.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const bytes = await readFile(full);
    res.writeHead(200, { 'content-type': mime[extname(full)] || 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    res.end(bytes);
  } catch (e) { res.writeHead(404); res.end('Not found'); }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const base = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  await mkdir('artifacts', { recursive: true });
  for (const [name, viewport] of Object.entries({ desktop: { width: 1366, height: 850 }, mobile: { width: 390, height: 844 } })) {
    const context = await browser.newContext({ viewport });
    const failures = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') return route.continue();
      failures.push('Requisicao externa bloqueada: ' + url.hostname);
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', e => failures.push('Erro JavaScript: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') failures.push('Console: ' + m.text()); });
    const response = await page.goto(base + '/homologacao/trilha-90-dias.html', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('#day option').count(), 90);
    await page.locator('#day').selectOption('30');
    assert.match(await page.locator('#title').innerText(), /Dia 30/);
    assert.equal(await page.locator('#questions > div').count(), 8);
    assert.match(await page.locator('#content').innerText(), /APRENDER/);
    await page.screenshot({ path: 'artifacts/trilha-30-' + name + '.png', fullPage: true });
    for (let i = 0; i < 8; i++) await page.locator('input[name="q' + i + '"][value="' + (i % 4) + '"]').check();
    await page.getByRole('button', { name: 'Corrigir prova' }).click();
    assert.match(await page.locator('#content').innerText(), /Nota 10\/10/);
    await page.getByRole('button', { name: /Reteste/ }).click();
    for (let i = 0; i < 8; i++) await page.locator('input[name="q' + i + '"][value="' + ((i + 1) % 4) + '"]').check();
    await page.getByRole('button', { name: 'Corrigir prova' }).click();
    assert.match(await page.locator('#content').innerText(), /Nota 10\/10/);
    await page.locator('#day').selectOption('39');
    assert.match(await page.locator('#state').innerText(), /revisão editorial/i);
    assert.equal(await page.locator('#questions > div').count(), 8);
    await page.locator('#day').selectOption('40');
    assert.match(await page.locator('#state').innerText(), /planejado/i);
    assert.equal(await page.locator('#questions').count(), 0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert.equal(overflow, false, 'Overflow horizontal no ' + name);
    assert.deepEqual(failures, [], 'Erros no ' + name);
    await context.close();
    process.stdout.write('OK ' + name + ': 90 dias, aula 30, prova, reteste, dias 39 e 40, sem requisicoes externas.\n');
  }
  // Smoke real do painel com Supabase simulado: nenhuma credencial, sessao ou escrita.
  for (const [name, viewport] of Object.entries({ desktop: { width: 1366, height: 850 }, mobile: { width: 390, height: 844 } })) {
    const context = await browser.newContext({ viewport });
    const errors = [];
    const stub = "window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{}},from(){throw Error('Acesso inesperado ao Supabase')}}}}";
    await context.route('**/*', route => {
      const hostname = new URL(route.request().url()).hostname;
      if (hostname === '127.0.0.1') return route.continue();
      if (hostname === 'cdn.jsdelivr.net') return route.fulfill({ status: 200, contentType: 'application/javascript', body: stub });
      errors.push('Requisicao externa inesperada: ' + hostname);
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.evaluate(() => {
      cache = { less: [
        { id: 'historica', code: 'S1-D1-A01', title: 'Aula historica', content: { body: 'Treino anterior', mission: 'Pratica', evidence: 'Relato' } },
        { id: 'nova', code: 'F1-D29-A01', title: 'Aula nova', content: { body: 'Treino futuro', mission: 'Pratica', questions_a: Array.from({length:10}, (_,i)=>['Pergunta '+i,['A','B','C'],i%3,i===2]), questions_b: Array.from({length:10}, (_,i)=>['Reteste '+i,['A','B','C'],i%3,i===5]), minimum_score: 8, aprender:'Aprender a conduzir' } }
      ], subs: [] };
      document.getElementById('app').classList.remove('hide');
      document.getElementById('login').classList.add('hide');
      // O container e criado pelo renderConsult apos login real; fixture sem autenticacao.
      const lessonBox = document.createElement('div');
      lessonBox.id = 'lessonBox';
      document.getElementById('app').appendChild(lessonBox);
      window.openLesson('historica');
    });
    assert.equal(await page.locator('#lessonBox button').count(), 1, 'Aula antiga deve manter botao no ' + name);
    await page.evaluate(() => window.openLesson('nova'));
    assert.equal(await page.locator('#lessonBox button:not(#lessonExamSubmit)').count(), 0, 'Aula com prova nao pode concluir diretamente no ' + name);
    assert.match(await page.locator('#lessonBox').textContent(), /PROVAR — avaliação teórica e prática/);
    assert.equal(await page.locator('#lessonBox fieldset').count(), 10);
    assert.equal(await page.locator('#lessonExamSubmit').count(), 1);
    assert.equal(await page.locator('#lessonExamEvidence').count(), 1);
    await page.evaluate(() => {
      cache.subs=[{lesson_id:'nova',submission_type:'lesson_exam_a',submitted_at:'2026-10-29T10:00:00Z',text_content:JSON.stringify({answers:Array(10).fill(0)})}];
      window.openLesson('nova');
    });
    assert.equal(await page.locator('#lessonExamReview').count(), 1, 'Reteste deve exigir revisao no '+name);
    assert.equal(await page.locator('#lessonBox fieldset').count(), 10);
    await page.evaluate(() => {
      cache.subs=[{lesson_id:'nova',submission_type:'lesson_exam_a',submitted_at:'2026-10-29T10:00:00Z',text_content:JSON.stringify({answers:Array.from({length:10},(_,i)=>i%3)})}];
      window.openLesson('nova');
    });
    assert.equal(await page.locator('#lessonExamSubmit').count(), 0, 'Aprovacao teorica aguarda gestor no '+name);
    assert.match(await page.locator('#lessonBox').textContent(), /Registro enviado para análise/);
    await page.evaluate(() => completeLesson('nova', '', true));
    // Auditoria gerencial em desktop/mobile: somente leitura e sem conta real.
    await page.evaluate(() => {
      const lesson = { id:'nova', code:'F2-D34-A01', content:{
        questions_a:Array.from({length:10},(_,i)=>['Pergunta '+i,['Correta','Incorreta'],0,i===2]),
        questions_b:Array.from({length:10},(_,i)=>['Reteste '+i,['Correta','Incorreta'],0,i===5]),
        minimum_score:8
      }};
      const payload = {version:1,stage:'a',requires_manager_validation:true,answers:Array(10).fill(0),
        evidence:'Exemplo fictício com contexto, especificações confirmadas, pendências, responsável e data do retorno combinado.',
        preview_score:1,preview_critical_errors:3,preview_passed:false};
      cache={ps:[{id:'u1',full_name:'Consultor teste'}],ls:[lesson],su:[{id:'e1',user_id:'u1',lesson_id:'nova',
        submission_type:'lesson_exam_a',text_content:JSON.stringify(payload),status:'pending',submitted_at:'2026-10-29T10:00:00Z'}]};
      const box=document.createElement('div');box.id='managerExamFixture';box.innerHTML=renderPendingLessonExams();document.body.appendChild(box);
    });
    assert.match(await page.locator('#managerExamFixture').innerText(), /Correção independente:/);
    assert.match(await page.locator('#managerExamFixture').innerText(), /nota preliminar enviada difere/);
    assert.equal(await page.locator('#managerExamFixture button').count(), 0, 'Nenhuma aprovação direta no '+name);
    assert.deepEqual(errors, [], 'Falha no navegador ' + name);
    process.stdout.write('OK ' + name + ': painel real bloqueia prova nova e preserva aula antiga sem Supabase.\\n');
    await context.close();
  }

} finally {
  if (browser) await browser.close();
  await new Promise(ok => server.close(ok));
}
