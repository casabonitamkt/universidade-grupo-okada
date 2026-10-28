// Regressao estrutural offline das aulas editoriais 1-39.
// Nao acessa rede, banco, dados de alunos, CRM, WhatsApp ou credenciais.
import test from 'node:test';
import assert from 'node:assert/strict';
import { planoDia, questoesPara, corrigirProva } from '../modules/trilha-90-dias.mjs';

for (let dia = 1; dia <= 39; dia++) {
  test('dia ' + dia + ': quatro etapas e oito questoes editoriais validas', () => {
    const plano = planoDia(dia);
    const aula = plano.conteudo;
    assert.equal(plano.estado, 'conteudo_para_revisao');
    assert.deepEqual(plano.etapas, ['APRENDER', 'DEMONSTRAR', 'PRATICAR', 'PROVAR']);
    assert.ok(aula && typeof aula.objetivo === 'string' && aula.objetivo.trim().length > 20);
    assert.ok(Array.isArray(aula.aprender) && aula.aprender.length >= 3);
    for (const paragrafo of aula.aprender) {
      assert.ok(typeof paragrafo === 'string' && paragrafo.trim().length > 40);
    }
    for (const campo of ['certo', 'errado', 'porQue']) {
      assert.ok(typeof aula.demonstrar?.[campo] === 'string' && aula.demonstrar[campo].trim().length > 15);
    }
    for (const campo of ['cenario', 'tarefa']) {
      assert.ok(typeof aula.praticar?.[campo] === 'string' && aula.praticar[campo].trim().length > 20);
    }
    assert.ok(Array.isArray(aula.provar?.criterios) && aula.provar.criterios.length >= 4);
    assert.ok(Array.isArray(aula.provar?.perguntas) && aula.provar.perguntas.length === 8);
    for (const pergunta of aula.provar.perguntas) {
      assert.equal(pergunta.length, 5, 'enunciado e quatro alternativas');
      for (const item of pergunta) assert.ok(typeof item === 'string' && item.trim().length > 2);
      assert.equal(new Set(pergunta.slice(1).map(s => s.trim().toLocaleLowerCase('pt-BR'))).size, 4);
    }
  });

  test('dia ' + dia + ': alternativas embaralhadas mantem gabarito e nota', () => {
    for (let versao = 0; versao < 4; versao++) {
      const questoes = questoesPara(dia, versao);
      assert.equal(questoes.length, 8);
      const corretas = questoes.map((_, i) => (versao + i) % 4);
      const aprovado = corrigirProva(dia, corretas, versao);
      assert.equal(aprovado.nota, 10);
      assert.equal(aprovado.aprovado, true);
      assert.equal(aprovado.revisar.length, 0);
      const erradas = corretas.map(x => (x + 1) % 4);
      const reprovado = corrigirProva(dia, erradas, versao);
      assert.equal(reprovado.nota, 0);
      assert.equal(reprovado.aprovado, false);
      assert.equal(reprovado.revisar.length, 8);
    }
    assert.throws(() => corrigirProva(dia, []), /Responda todas/);
  });
}
