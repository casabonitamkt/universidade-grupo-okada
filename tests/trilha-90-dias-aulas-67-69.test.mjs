// Regressão editorial isolada: não usa credenciais, rede, banco nem dados reais.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AULAS_67_69 } from '../modules/trilha-90-dias-aulas-67-69.mjs';
import { planoDia } from '../modules/trilha-90-dias.mjs';

test('67–69: 3 aulas completas, 15 blocos, 24 questões únicas', () => {
  assert.deepEqual(Object.keys(AULAS_67_69), ['67', '68', '69']);
  const questions = [];
  for (const dia of [67, 68, 69]) {
    const a = AULAS_67_69[dia];
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
      questions.push(q);
    }
  }
  assert.equal(new Set(questions.map(q => q[0])).size, 24);
  assert.equal(new Set(questions.map(q => q[1])).size, 24);
});

test('67–69: permanecem planejadas no treinamento real; especialização ainda não integrada', () => {
  for (const dia of [67, 68, 69]) {
    const plano = planoDia(dia);
    assert.equal(plano.estado, 'planejado');
    assert.equal(plano.conteudo, null);
  }
});

test('67–69: módulo sem rede, segredos ou persistência', async () => {
  const source = await readFile(new URL('../modules/trilha-90-dias-aulas-67-69.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /supabase|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|service_role|z-api|zappy|wa\.me\//i);
  assert.doesNotMatch(source, /import\s+.*from\s+["']https?:/i);
});

test('67–69: página responsiva e demonstrativa sem gravação', async () => {
  const html = await readFile(new URL('../homologacao/aulas-67-69.html', import.meta.url), 'utf8');
  assert.match(html, /HOMOLOGAÇÃO EDITORIAL/);
  assert.match(html, /AULAS_67_69/);
  assert.match(html, /viewport/);
  assert.match(html, /corrigir/);
  assert.match(html, /refazer/);
  assert.match(html, /não concede certificação/);
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|supabase|service_role/i);
});

test('67–69: títulos da aula e do seletor respeitam o planejamento de 90 dias', async () => {
  const html = await readFile(new URL('../homologacao/aulas-67-69.html', import.meta.url), 'utf8');
  for (const dia of [67, 68, 69]) {
    const planejado = planoDia(dia);
    const aula = AULAS_67_69[dia];
    assert.equal(aula.titulo, planejado.titulo, 'Dia ' + dia + ' deve manter o tema planejado');
    assert.match(html, new RegExp('Dia ' + dia + ' — ' + aula.titulo));
  }
    assert.match(AULAS_67_69[67].objetivo, /arquiteto|blocos|referências/i);
  assert.match(AULAS_67_69[68].objetivo, /projeto|soluções/i);
  assert.match(AULAS_67_69[69].objetivo, /argumentos|ficha técnica/i);
  assert.match(html, /a\.titulo/);
});

test('67–69: correção local é coerente com alternativas reordenadas e não persiste nota', async () => {
  const html = await readFile(new URL('../homologacao/aulas-67-69.html', import.meta.url), 'utf8');
  assert.match(html, /idx=\(j-shift\+4\)%4/);
  assert.match(html, /marcado\.value\)===\(versao\+i\)%4/);
  assert.match(html, /Nenhuma nota foi registrada/);
  for (const dia of [67,68,69]) {
    const qs=AULAS_67_69[dia].provar.perguntas;
    for (let versao=0;versao<8;versao++) {
      qs.forEach((q,i)=>{
        const shift=(versao+i)%4;
        const rendered=q.slice(1).map((_,j)=>q.slice(1)[(j-shift+4)%4]);
        assert.equal(rendered[shift],q[1]);
      });
    }
  }
});
