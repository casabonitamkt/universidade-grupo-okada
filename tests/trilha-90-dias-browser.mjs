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
    // Aulas Sierra 64–66: teste real de interface local, sem rede externa ou persistencia.
    const pageSierra = await context.newPage();
    pageSierra.on('pageerror', e => failures.push('Erro Sierra: ' + e.message));
    pageSierra.on('console', m => { if (m.type() === 'error') failures.push('Console Sierra: ' + m.text()); });
    const responseSierra = await pageSierra.goto(base + '/homologacao/aulas-64-66.html', { waitUntil: 'networkidle' });
    assert.equal(responseSierra.status(), 200);
    assert.equal(await pageSierra.locator('#dia option').count(), 3);
    for (const dia of ['64', '65', '66']) {
      await pageSierra.locator('#dia').selectOption(dia);
      assert.match(await pageSierra.locator('#titulo').innerText(), new RegExp('Dia ' + dia));
      assert.equal(await pageSierra.locator('#questoes fieldset').count(), 8);
      for (let i = 0; i < 8; i++) await pageSierra.locator('input[name="q' + i + '"][value="' + (i % 4) + '"]').check();
      await pageSierra.getByRole('button', { name: 'Corrigir nesta tela' }).click();
      assert.match(await pageSierra.locator('#resultado').innerText(), /8\/8/);
      await pageSierra.getByRole('button', { name: /Refazer/ }).click();
      for (let i = 0; i < 8; i++) await pageSierra.locator('input[name="q' + i + '"][value="' + ((i + 1) % 4) + '"]').check();
      await pageSierra.getByRole('button', { name: 'Corrigir nesta tela' }).click();
      assert.match(await pageSierra.locator('#resultado').innerText(), /8\/8/);
    }
    await pageSierra.locator('#praticar textarea').fill('Rascunho temporario, nao salvar.');
    await pageSierra.screenshot({ path: 'artifacts/sierra-66-' + name + '.png', fullPage: true });
    await pageSierra.reload({ waitUntil: 'networkidle' });
    assert.equal(await pageSierra.locator('#praticar textarea').inputValue(), '');
    assert.equal(await pageSierra.locator('#resultado').innerText(), '');
    assert.equal(await pageSierra.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2), false, 'Overflow Sierra no ' + name);
    assert.deepEqual(failures, [], 'Erros Sierra no ' + name);
    await pageSierra.close();
    process.stdout.write('OK Sierra 64-66 ' + name + ': 3 aulas, prova, reteste, rascunho descartado, sem requisicoes externas.\n');
    await context.close();
    process.stdout.write('OK ' + name + ': 90 dias, aula 30, prova, reteste, dias 39 e 40, sem requisicoes externas.\n');
  }
} finally {
  if (browser) await browser.close();
  await new Promise(ok => server.close(ok));
}
