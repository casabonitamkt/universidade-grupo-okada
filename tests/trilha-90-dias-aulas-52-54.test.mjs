// Testes editoriais isolados, sem credenciais, rede, banco ou dados reais.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AULAS_52_54 } from '../modules/trilha-90-dias-aulas-52-54.mjs';
import { planoDia } from '../modules/trilha-90-dias.mjs';

test('52–54: 3 aulas completas, 15 blocos, 24 questões únicas', () => {
  assert.deepEqual(Object.keys(AULAS_52_54), ['52', '53', '54']);
  const allQuestions = [];
  for (const dia of [52,53,54]) {
    const a = AULAS_52_54[dia];
    assert.ok(a.objetivo.length >= 80);
    assert.equal(a.aprender.length, 5);
    assert.ok(a.aprender.every(p => p.length >= 270));
    assert.ok(a.demonstrar.certo.length >= 60);
    assert.ok(a.demonstrar.errado.length >= 60);
    assert.ok(a.demonstrar.porQue.length >= 60);
    assert.ok(a.praticar.cenario.length >= 100);
    assert.ok(a.praticar.tarefa.length >= 100);
    assert.equal(a.provar.criterios.length, 6);
    assert.equal(a.provar.perguntas.length, 8);
    for (const q of a.provar.perguntas) {
      assert.equal(q.length, 5);
      assert.equal(new Set(q.slice(1)).size, 4);
      assert.ok(q.every(x => typeof x === 'string' && x.trim().length > 0));
      allQuestions.push(q);
    }
  }
  assert.equal(new Set(allQuestions.map(q => q[0])).size, 24);
  assert.equal(new Set(allQuestions.map(q => q[1])).size, 24);
});

test('52–54: permanecem planejadas, não gravam progresso nem integram painel real', () => {
  for (const dia of [52,53,54]) {
    const plano = planoDia(dia);
    assert.equal(plano.estado, 'planejado');
    assert.equal(plano.conteudo, null);
  }
});

test('52–54: sem chamadas externas, segredos ou persistência', async () => {
  const source = await readFile(new URL('../modules/trilha-90-dias-aulas-52-54.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /supabase|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|service_role|z-api|zappy|wa\.me\//i);
  assert.doesNotMatch(source, /import\s+.*from\s+["']https?:/i);
});

test('52–54: página demonstrativa não envia respostas nem grava dados', async () => {
  const html = await readFile(new URL('../homologacao/aulas-52-54.html', import.meta.url), 'utf8');
  assert.match(html, /HOMOLOGAÇÃO EDITORIAL/);
  assert.match(html, /AULAS_52_54/);
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|supabase|service_role/i);
  assert.match(html, /viewport/);
  assert.match(html, /corrigir/);
  assert.match(html, /refazer/);
});
