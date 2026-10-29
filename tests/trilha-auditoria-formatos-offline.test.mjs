// Contratos de leitura: formatos heterogeneos encontrados nas aulas ocultas.
// Fixtures sinteticas, sem consulta ao Supabase ou dados reais do Thiago.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validarBancoAvaliacao } from '../modules/trilha-90-dias-avaliacao-offline.mjs';

const fixture = () => ({
  minimum_score: 8,
  retest_rule: 'Revisao escrita obrigatoria antes de novo teste B.',
  questions_a: Array.from({ length: 10 }, (_, i) => [
    'Cenario A ' + i, ['Nao', 'Sim', 'Verificar'], 1, i === 0
  ]),
  questions_b: Array.from({ length: 10 }, (_, i) => [
    'Cenario B ' + i, ['Nao', 'Sim', 'Verificar'], 1, i === 0
  ])
});

test('esquema canonico de avaliacao continua aceito apenas em modo offline', () => {
  assert.equal(validarBancoAvaliacao(fixture()).notaMinima, 8);
});

test('campo retest_policy alternativo nao e aceito por inferencia', () => {
  const aula = fixture();
  delete aula.retest_rule;
  aula.retest_policy = 'Revisao escrita antes do reteste B';
  assert.throws(() => validarBancoAvaliacao(aula), /Regra escrita/);
});

test('pass_score e flag de revisao nao sao normalizados silenciosamente', () => {
  const aula = fixture();
  delete aula.minimum_score;
  delete aula.retest_rule;
  aula.pass_score = 8;
  aula.requires_written_revision_before_retest = true;
  aula.critical_errors_allowed = 0;
  assert.throws(() => validarBancoAvaliacao(aula), /Nota minima/);
});

test('questoes em objeto sem marcador critico nao passam como array canonico', () => {
  const aula = fixture();
  aula.questions_a = Array.from({ length: 10 }, (_, i) => ({
    question: 'Cenario A ' + i,
    options: ['Nao', 'Sim'],
    correct_index: 1
  }));
  aula.questions_b = Array.from({ length: 10 }, (_, i) => ({
    question: 'Cenario B ' + i,
    options: ['Nao', 'Sim'],
    correct_index: 1
  }));
  assert.throws(() => validarBancoAvaliacao(aula), /Questao malformada/);
});
