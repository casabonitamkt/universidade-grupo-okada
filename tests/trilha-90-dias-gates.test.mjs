// Regressao offline: biblioteca editorial isolada nao habilita aula, nota ou certificacao real.
// Este teste nao usa Supabase, WhatsApp, credenciais, rede ou armazenamento.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AULAS_PILOTO, planoDia, questoesPara, corrigirProva, avaliarMarco } from '../modules/trilha-90-dias.mjs';

test('dias 1-39 permanecem em revisao editorial; 40-90 nao sao aulas ativas', () => {
  assert.deepEqual(Object.keys(AULAS_PILOTO).map(Number).sort((a,b) => a-b),
    Array.from({ length: 39 }, (_, i) => i + 1));
  for (let dia = 1; dia <= 90; dia++) {
    const plano = planoDia(dia);
    assert.equal(plano.dia, dia);
    assert.equal(plano.tempoPrevisto, 15);
    if (dia <= 39) {
      assert.equal(plano.estado, 'conteudo_para_revisao', 'Dia ' + dia);
      assert.ok(plano.conteudo, 'Dia ' + dia);
    } else {
      assert.equal(plano.estado, 'planejado', 'Dia ' + dia);
      assert.equal(plano.conteudo, null, 'Dia ' + dia);
    }
  }
});

test('dias nao integrados nao oferecem prova nem correcao de nota', () => {
  for (let dia = 40; dia <= 90; dia++) {
    assert.throws(() => questoesPara(dia), /Aula ainda n.o escrita/, 'Dia ' + dia);
    assert.throws(() => corrigirProva(dia, []), /Aula ainda n.o escrita/, 'Dia ' + dia);
  }
});

test('marco 90 nao certifica apenas com evidencias, exige aprovacao do gestor', () => {
  const marco = planoDia(90);
  assert.equal(marco.estado, 'planejado');
  assert.ok(marco.marco.exige.some(item => /gestor/i.test(item)));
  const evidencias = Object.fromEntries(marco.marco.exige.map((_, i) => ['r' + i, true]));
  const semGestor = avaliarMarco(90, evidencias);
  assert.equal(semGestor.prontoParaDecisao, true);
  assert.equal(semGestor.certificado, false);
  assert.match(semGestor.observacao, /n.o equivale a certifica..o/i);
  const incompleto = avaliarMarco(90, { ...evidencias, r0: false, aprovacaoGestor: true });
  assert.equal(incompleto.prontoParaDecisao, false);
  assert.equal(incompleto.certificado, false);
});

test('entradas invalidas nao acessam o plano', () => {
  for (const dia of [0, -1, 91, 1.5, NaN, '90', null]) {
    assert.throws(() => planoDia(dia), /Dia inv.lido/);
  }
});
