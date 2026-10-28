// Regressao editorial offline: conteudo isolado, sem aluno real, CRM, Supabase ou WhatsApp.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AULAS_40_42 } from '../modules/trilha-90-dias-aulas-40-42.mjs';
import { AULAS_PILOTO, planoDia, avaliarMarco } from '../modules/trilha-90-dias.mjs';

test('dias 40-42: conteudo completo e provas sem alternativas duplicadas', () => {
  assert.deepEqual(Object.keys(AULAS_40_42), ['40', '41', '42']);
  const enunciados = new Set();
  for (const dia of [40, 41, 42]) {
    const aula = AULAS_40_42[dia];
    assert.ok(aula.objetivo.length > 90);
    assert.equal(aula.aprender.length, 5);
    assert.ok(aula.aprender.every(texto => texto.length >= 270));
    assert.ok(aula.demonstrar.certo && aula.demonstrar.errado && aula.demonstrar.porQue);
    assert.ok(aula.praticar.cenario && aula.praticar.tarefa);
    assert.equal(aula.provar.criterios.length, 6);
    assert.equal(aula.provar.perguntas.length, 8);
    for (const q of aula.provar.perguntas) {
      assert.equal(q.length, 5);
      assert.equal(new Set(q.slice(1)).size, 4);
      assert.ok(!enunciados.has(q[0]), 'Pergunta repetida: ' + q[0]);
      enunciados.add(q[0]);
    }
  }
  assert.equal(enunciados.size, 24);
});

test('publicacao de arquivo editorial nao altera aulas reais, progresso ou marcos', () => {
  assert.equal(Object.keys(AULAS_PILOTO).length, 39);
  for (const dia of [40, 41, 42]) {
    assert.equal(planoDia(dia).estado, 'planejado');
    assert.equal(planoDia(dia).conteudo, null);
  }
  assert.equal(avaliarMarco(60, {}).certificado, false);
  assert.equal(avaliarMarco(90, {}).certificado, false);
});

test('texto editorial evita compromissos comerciais e tecnicos nao autorizados', () => {
  const texto = JSON.stringify(AULAS_40_42);
  assert.match(texto, /aprova[cç][aã]o|autoriza[cç][aã]o/i);
  assert.match(texto, /pend[eê]ncia|n[aã]o confirmado/i);
  assert.match(texto, /arquiteto|arquiteta/i);
  assert.match(texto, /concorr[eê]ncia|concorrente/i);
  assert.doesNotMatch(texto, /garantimos entrega em \d+ dias|desconto garantido de \d+%/i);
});
