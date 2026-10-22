import test from 'node:test';
import assert from 'node:assert/strict';
import { planoDia, questoesPara, corrigirProva } from '../modules/trilha-90-dias.mjs';

// Regressão pura: não acessa Supabase, usuários, notas ou dados de produção.
for (let dia = 1; dia <= 6; dia++) {
  for (let versao = 0; versao <= 3; versao++) {
    test(`dia ${dia}, versão ${versao}: prova e reteste com nota mínima 8`, () => {
      const questoes = questoesPara(dia, versao);
      assert.equal(questoes.length, 8);
      assert.ok(questoes.every(q => q.alternativas.length === 4));
      const corretas = questoes.map((_, i) => (versao + i) % 4);
      assert.deepEqual({ nota: corrigirProva(dia, corretas, versao).nota, aprovado: corrigirProva(dia, corretas, versao).aprovado }, { nota: 10, aprovado: true });
      const sete = [...corretas];
      sete[0] = (sete[0] + 1) % 4;
      assert.equal(corrigirProva(dia, sete, versao).aprovado, true);
      const seis = [...sete];
      seis[1] = (seis[1] + 1) % 4;
      assert.equal(corrigirProva(dia, seis, versao).aprovado, false);
      assert.throws(() => corrigirProva(dia, corretas.slice(1), versao));
      assert.throws(() => corrigirProva(dia, [...corretas.slice(0, 7), 4], versao));
    });
  }
}
test('rejeita versões inválidas e dias não escritos', () => {
  for (const versao of [-1, 1.5, '0', null, NaN]) {
    assert.throws(() => questoesPara(1, versao));
  }
  assert.throws(() => questoesPara(7, 0));
  assert.throws(() => planoDia(91));
});
