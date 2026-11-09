// Regressao offline do marco 30: nao acessa Supabase, usuarios nem rede.
import test from 'node:test';
import assert from 'node:assert/strict';
import { avaliarMarco30Offline } from '../modules/trilha-90-dias-avaliacao-offline.mjs';

const teoria = { versao: 'A', aprovado: true };
const projeto = { nota: 8, erroCritico: false };
const avulsa = { nota: 9, erroCritico: false };
const executar = (extras = {}) => avaliarMarco30Offline({
  resultadoTeorico: teoria, simulacaoProjeto: projeto, simulacaoPecaAvulsa: avulsa, ...extras
});

test('marco 30 exige teoria e duas praticas aprovadas, sem conclusao automatica', () => {
  const r = executar();
  assert.equal(r.teoriaAprovada, true);
  assert.equal(r.projetoAprovado, true);
  assert.equal(r.pecaAvulsaAprovada, true);
  assert.equal(r.prontoParaAnaliseDoGestor, true);
  assert.equal(r.aprovacaoGestorNecessaria, true);
  assert.equal(r.conclusaoAutomatica, false);
  assert.equal(r.certificacaoAutomatica, false);
});

test('teoria reprovada impede elegibilidade mesmo com duas notas dez', () => {
  const r = executar({ resultadoTeorico: { aprovado: false } });
  assert.equal(r.prontoParaAnaliseDoGestor, false);
  assert.equal(r.conclusaoAutomatica, false);
});

test('cada pratica pode reprovar isoladamente por nota ou erro critico', () => {
  for (const extras of [
    { simulacaoProjeto: { nota: 7, erroCritico: false } },
    { simulacaoProjeto: { nota: 10, erroCritico: true } },
    { simulacaoPecaAvulsa: { nota: 7, erroCritico: false } },
    { simulacaoPecaAvulsa: { nota: 10, erroCritico: true } }
  ]) {
    const r = executar(extras);
    assert.equal(r.prontoParaAnaliseDoGestor, false);
    assert.equal(r.conclusaoAutomatica, false);
    assert.equal(r.certificacaoAutomatica, false);
  }
});

test('uma unica pratica, objeto reutilizado ou dados invalidos falham fechados', () => {
  assert.throws(() => executar({ simulacaoPecaAvulsa: null }), /duas simulacoes/);
  assert.throws(() => executar({ simulacaoPecaAvulsa: projeto }), /duas simulacoes/);
  assert.throws(() => executar({ simulacaoProjeto: { nota: 11, erroCritico: false } }), /pratica invalida/);
  assert.throws(() => executar({ simulacaoPecaAvulsa: { nota: 8 } }), /pratica invalida/);
});
