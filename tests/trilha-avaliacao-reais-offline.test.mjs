// Regressao offline: nenhum teste acessa banco, rede, usuario ou dados do Thiago.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validarBancoAvaliacao, corrigirAvaliacaoOffline, avaliarPraticaOffline
} from '../modules/trilha-90-dias-avaliacao-offline.mjs';

const montar = () => ({
  minimum_score: 8,
  retest_rule: 'Revisao escrita dirigida antes do reteste B, com cenarios distintos.',
  questions_a: Array.from({ length: 10 }, (_, i) =>
    ['Cenario A ' + (i + 1), ['Inadequado', 'Adequado', 'Outro'], 1, i === 0]),
  questions_b: Array.from({ length: 10 }, (_, i) =>
    ['Cenario B ' + (i + 1), ['Inadequado', 'Adequado', 'Outro'], 1, i === 0])
});
const dezCorretas = () => Array(10).fill(1);
const corrigir = (respostas, extras = {}) =>
  corrigirAvaliacaoOffline({ conteudo: montar(), versao: 'A', respostas, ...extras });

test('aceita apenas provas A/B de dez questoes com gabarito e erros criticos', () => {
  assert.deepEqual(validarBancoAvaliacao(montar()).questoesPorVersao, 10);
  const semB = montar(); semB.questions_b.pop();
  assert.throws(() => validarBancoAvaliacao(semB), /10 questoes/);
  const semRegra = montar(); delete semRegra.retest_rule;
  assert.throws(() => validarBancoAvaliacao(semRegra), /Regra escrita/);
  const repetida = montar(); repetida.questions_b[0][0] = repetida.questions_a[0][0];
  assert.throws(() => validarBancoAvaliacao(repetida), /repetido/);
  const semCritico = montar(); semCritico.questions_b[0][3] = false;
  assert.throws(() => validarBancoAvaliacao(semCritico), /erro critico/);
  const gabaritoRuim = montar(); gabaritoRuim.questions_a[1][2] = 9;
  assert.throws(() => validarBancoAvaliacao(gabaritoRuim), /Gabarito/);
});

test('nota 8 aprova apenas sem erro critico, e nao conclui aula', () => {
  const respostas = dezCorretas(); respostas[1] = 0; respostas[2] = 0;
  const r = corrigir(respostas);
  assert.equal(r.acertos, 8);
  assert.equal(r.aprovado, true);
  assert.equal(r.conclusaoAutomatica, false);
  assert.equal(r.certificacaoAutomatica, false);
});

test('erro critico reprova mesmo com 9/10 e exige revisao antes do reteste B', () => {
  const respostas = dezCorretas(); respostas[0] = 0;
  const r = corrigir(respostas);
  assert.equal(r.acertos, 9);
  assert.equal(r.erroCritico, true);
  assert.equal(r.aprovado, false);
  assert.equal(r.proximaVersao, 'B');
  assert.throws(() => corrigirAvaliacaoOffline({
    conteudo: montar(), versao: 'B', respostas: dezCorretas(), resultadoA: r
  }), /revisao escrita/);
  const b = corrigirAvaliacaoOffline({
    conteudo: montar(), versao: 'B', respostas: dezCorretas(), resultadoA: r,
    revisaoEscrita: 'Revisei a necessidade de autorizacao e documentei a alternativa.'
  });
  assert.equal(b.aprovado, true);
  assert.equal(b.conclusaoAutomatica, false);
  assert.equal(b.proximaVersao, null);
});

test('reteste B nao e permitido depois de aprovacao A', () => {
  assert.throws(() => corrigirAvaliacaoOffline({
    conteudo: montar(), versao: 'B', respostas: dezCorretas(),
    resultadoA: corrigir(dezCorretas()),
    revisaoEscrita: 'Revisao de pelo menos vinte caracteres para teste.'
  }), /reprovacao A/);
});

test('respostas ausentes, fora da faixa e versao incorreta falham fechadas', () => {
  assert.throws(() => corrigir(Array(9).fill(1)), /dez respostas/);
  const invalidas = dezCorretas(); invalidas[3] = 7;
  assert.throws(() => corrigir(invalidas), /Resposta invalida/);
  assert.throws(() => corrigir(dezCorretas(), { versao: 'C' }), /Versao/);
});

test('teoria e pratica nao produzem certificacao nem liberacao automatica', () => {
  const teoria = corrigir(dezCorretas());
  const ok = avaliarPraticaOffline({ resultadoTeorico: teoria, notaPratica: 8, erroCriticoPratico: false });
  assert.equal(ok.prontoParaAnaliseDoGestor, true);
  assert.equal(ok.conclusaoAutomatica, false);
  assert.equal(ok.certificacaoAutomatica, false);
  const critico = avaliarPraticaOffline({ resultadoTeorico: teoria, notaPratica: 10, erroCriticoPratico: true });
  assert.equal(critico.prontoParaAnaliseDoGestor, false);
  assert.throws(() => avaliarPraticaOffline({
    resultadoTeorico: teoria, notaPratica: 11, erroCriticoPratico: false
  }), /pratica invalida/);
});
