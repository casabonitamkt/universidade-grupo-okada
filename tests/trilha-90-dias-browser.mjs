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
    await page.locator('#day').selectOption('42');
    assert.match(await page.locator('#state').innerText(), /revisão editorial/i);
    assert.equal(await page.locator('#questions > div').count(), 8);
    await page.locator('#day').selectOption('43');
    assert.match(await page.locator('#state').innerText(), /planejado/i);
    assert.equal(await page.locator('#questions').count(), 0);
    // Revisão isolada 46–48: prova/reteste, acessibilidade mobile e ausência de persistência.
    const review = await context.newPage();
    review.on('pageerror', e => failures.push('Erro na revisão 46-48: ' + e.message));
    review.on('console', m => { if (m.type() === 'error') failures.push('Console revisão: ' + m.text()); });
    const reviewResponse = await review.goto(base + '/homologacao/aulas-46-48.html', { waitUntil: 'networkidle' });
    assert.equal(reviewResponse.status(), 200);
    assert.equal(await review.locator('#dia option').count(), 3);
    for (const dia of [46,47,48]) {
      await review.locator('#dia').selectOption(String(dia));
      assert.match(await review.locator('#titulo').innerText(), new RegExp('Dia ' + dia));
      assert.equal(await review.locator('#questoes fieldset').count(), 8);
      for (let i = 0; i < 8; i++) await review.locator('input[name="q' + i + '"][value="' + (i % 4) + '"]').check();
      await review.locator('#corrigir').click();
      assert.match(await review.locator('#resultado').innerText(), /8\/8/);
      await review.locator('#refazer').click();
      for (let i = 0; i < 8; i++) await review.locator('input[name="q' + i + '"][value="' + ((i + 1) % 4) + '"]').check();
      await review.locator('#corrigir').click();
      assert.match(await review.locator('#resultado').innerText(), /8\/8/);
    }
    await review.locator('#praticar textarea').fill('Rascunho local que não deve persistir');
    await review.reload({ waitUntil: 'networkidle' });
    assert.equal(await review.locator('#praticar textarea').inputValue(), '');
    // Regressão específica do seletor de aulas e das alternativas em telas estreitas.
    // O seletor possui opções longas; sem max-width, causava overflow a 390px.
    for (const width of [viewport.width, 320]) {
      await review.setViewportSize({ width, height: viewport.height });
      const overflow = await review.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      assert.equal(overflow, false, 'Overflow na revisão 46-48 (' + name + ', ' + width + 'px)');
    }
    await review.setViewportSize(viewport);
    await review.screenshot({ path: 'artifacts/trilha-46-48-' + name + '.png', fullPage: true });
    await review.close();
    // Revisão isolada 49–51: prova/reteste, acessibilidade mobile e ausência de persistência.
    const review49 = await context.newPage();
    review49.on('pageerror', e => failures.push('Erro na revisão 49-51: ' + e.message));
    review49.on('console', m => { if (m.type() === 'error') failures.push('Console revisão: ' + m.text()); });
    const review49Response = await review49.goto(base + '/homologacao/aulas-49-51.html', { waitUntil: 'networkidle' });
    assert.equal(review49Response.status(), 200);
    assert.equal(await review49.locator('#dia option').count(), 3);
    for (const dia of [49,50,51]) {
      await review49.locator('#dia').selectOption(String(dia));
      assert.match(await review49.locator('#titulo').innerText(), new RegExp('Dia ' + dia));
      assert.equal(await review49.locator('#questoes fieldset').count(), 8);
      for (let i = 0; i < 8; i++) await review49.locator('input[name="q' + i + '"][value="' + (i % 4) + '"]').check();
      await review49.locator('#corrigir').click();
      assert.match(await review49.locator('#resultado').innerText(), /8\/8/);
      await review49.locator('#refazer').click();
      for (let i = 0; i < 8; i++) await review49.locator('input[name="q' + i + '"][value="' + ((i + 1) % 4) + '"]').check();
      await review49.locator('#corrigir').click();
      assert.match(await review49.locator('#resultado').innerText(), /8\/8/);
    }
    await review49.locator('#praticar textarea').fill('Rascunho local que não deve persistir');
    await review49.reload({ waitUntil: 'networkidle' });
    assert.equal(await review49.locator('#praticar textarea').inputValue(), '');
    // Regressão específica do seletor de aulas e das alternativas em telas estreitas.
    // O seletor possui opções longas; sem max-width, causava overflow a 390px.
    for (const width of [viewport.width, 320]) {
      await review49.setViewportSize({ width, height: viewport.height });
      const overflow = await review49.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      assert.equal(overflow, false, 'Overflow na revisão 49-51 (' + name + ', ' + width + 'px)');
    }
    await review49.setViewportSize(viewport);
    await review49.screenshot({ path: 'artifacts/trilha-49-51-' + name + '.png', fullPage: true });
    await review49.close();
    // Revisão isolada 52–54: prova/reteste, acessibilidade mobile e ausência de persistência.
    const review52 = await context.newPage();
    review52.on('pageerror', e => failures.push('Erro na revisão 52-54: ' + e.message));
    review52.on('console', m => { if (m.type() === 'error') failures.push('Console revisão: ' + m.text()); });
    const review52Response = await review52.goto(base + '/homologacao/aulas-52-54.html', { waitUntil: 'networkidle' });
    assert.equal(review52Response.status(), 200);
    assert.equal(await review52.locator('#dia option').count(), 3);
    for (const dia of [52,53,54]) {
      await review52.locator('#dia').selectOption(String(dia));
      assert.match(await review52.locator('#titulo').innerText(), new RegExp('Dia ' + dia));
      assert.equal(await review52.locator('#questoes fieldset').count(), 8);
      for (let i = 0; i < 8; i++) await review52.locator('input[name="q' + i + '"][value="' + (i % 4) + '"]').check();
      await review52.locator('#corrigir').click();
      assert.match(await review52.locator('#resultado').innerText(), /8\/8/);
      await review52.locator('#refazer').click();
      for (let i = 0; i < 8; i++) await review52.locator('input[name="q' + i + '"][value="' + ((i + 1) % 4) + '"]').check();
      await review52.locator('#corrigir').click();
      assert.match(await review52.locator('#resultado').innerText(), /8\/8/);
    }
    await review52.locator('#praticar textarea').fill('Rascunho local que não deve persistir');
    await review52.reload({ waitUntil: 'networkidle' });
    assert.equal(await review52.locator('#praticar textarea').inputValue(), '');
    // Regressão específica do seletor de aulas e das alternativas em telas estreitas.
    // O seletor possui opções longas; sem max-width, causava overflow a 390px.
    for (const width of [viewport.width, 320]) {
      await review52.setViewportSize({ width, height: viewport.height });
      const overflow = await review52.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      assert.equal(overflow, false, 'Overflow na revisão 52-54 (' + name + ', ' + width + 'px)');
    }
    await review52.setViewportSize(viewport);
    await review52.screenshot({ path: 'artifacts/trilha-52-54-' + name + '.png', fullPage: true });
    await review52.close();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert.equal(overflow, false, 'Overflow horizontal no ' + name);
    assert.deepEqual(failures, [], 'Erros no ' + name);
    await context.close();
    process.stdout.write('OK ' + name + ': 90 dias, aula 30, prova, reteste, dias 42 e 43, sem requisicoes externas.\n');
  }
} finally {
  if (browser) await browser.close();
  await new Promise(ok => server.close(ok));
}
