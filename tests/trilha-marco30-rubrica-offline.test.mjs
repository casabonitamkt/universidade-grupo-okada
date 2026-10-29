import test from 'node:test';
import assert from 'node:assert/strict';
import { avaliarFichaPraticaOffline, avaliarMarco30ComRubricaOffline } from '../modules/trilha-marco30-rubrica-offline.mjs';

const ficha = (extras = {}) => ({
  criterios: Array(10).fill(1),
  erroCritico: false,
  evidencias: [
    'Confirmou duas medidas ausentes antes da proposta',
    'Registrou responsavel e data do retorno'
  ],
  acaoMelhoria: 'Aprofundar perguntas sobre circulacao do ambiente',
  ...extras
});
const avaliar = (extras = {}) => avaliarMarco30ComRubricaOffline({
  resultadoTeorico: { aprovado: true },
  simulacaoProjeto: ficha(),
  simulacaoPecaAvulsa: ficha(),
  ...extras
});

test('duas rubricas completas geram apenas parecer para gestor, nunca conclusao', () => {
  const resultado = avaliar();
  assert.equal(resultado.prontoParaAnaliseDoGestor, true);
  assert.equal(resultado.projeto.nota, 10);
  assert.equal(resultado.pecaAvulsa.nota, 10);
  assert.equal(resultado.aprovacaoGestorNecessaria, true);
  assert.equal(resultado.avaliacaoAutenticada, false);
  assert.equal(resultado.conclusaoAutomatica, false);
  assert.equal(resultado.certificacaoAutomatica, false);
});

test('cada criterio vale 0, 0.5 ou 1, e minimo 8 vale por simulacao', () => {
  assert.equal(avaliarFichaPraticaOffline(ficha({
    criterios: [0.5,0.5,...Array(8).fill(1)],
    justificativasParciais: {
      0: 'Confirmou parcialmente a necessidade do cliente',
      1: 'Pediu medida mas nao confirmou a planta'
    }
  })).nota, 9);
  assert.equal(avaliarFichaPraticaOffline(ficha({ criterios: [0,0,...Array(8).fill(1)] })).praticaAprovada, true);
  const resultado = avaliar({ simulacaoPecaAvulsa: ficha({ criterios: [0,0,0,...Array(7).fill(1)] }) });
  assert.equal(resultado.projeto.praticaAprovada, true);
  assert.equal(resultado.pecaAvulsa.praticaAprovada, false);
  assert.equal(resultado.prontoParaAnaliseDoGestor, false);
});

test('erro critico em qualquer simulacao reprova independentemente da nota', () => {
  for (const campo of ['simulacaoProjeto','simulacaoPecaAvulsa']) {
    const resultado = avaliar({ [campo]: ficha({ erroCritico: true }) });
    assert.equal(resultado.prontoParaAnaliseDoGestor, false);
    assert.equal(resultado.conclusaoAutomatica, false);
  }
});

test('teoria reprovada ou ausente impede elegibilidade', () => {
  assert.equal(avaliar({ resultadoTeorico: { aprovado: false } }).prontoParaAnaliseDoGestor, false);
  assert.throws(() => avaliar({ resultadoTeorico: { nota: 10 } }), /Resultado teorico/);
});

test('ficha incompleta, nota irregular ou erro critico ausente falha fechada', () => {
  for (const extras of [
    { criterios: Array(9).fill(1) },
    { criterios: [1.5,...Array(9).fill(1)] },
    { criterios: [NaN,...Array(9).fill(1)] },
    { criterios: [0.5,...Array(9).fill(1)] },
    { erroCritico: undefined },
    { evidencias: ['Somente uma evidencia registrada'] },
    { evidencias: ['Mesmo registro observavel', 'mesmo registro observavel'] },
    { acaoMelhoria: 'curta' }
  ]) {
    assert.throws(() => avaliarFichaPraticaOffline(ficha(extras)));
  }
});

test('duas fichas precisam ser objetos separados', () => {
  const mesma = ficha();
  assert.throws(() => avaliar({ simulacaoProjeto: mesma, simulacaoPecaAvulsa: mesma }), /duas fichas/);
  assert.throws(() => avaliar({ simulacaoPecaAvulsa: null }), /duas fichas/);
});
