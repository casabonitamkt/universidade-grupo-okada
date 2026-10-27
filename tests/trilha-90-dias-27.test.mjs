// Regressão editorial isolada: não usa Supabase, WhatsApp, credenciais nem dados reais.
// Executar: node --test tests/trilha-90-dias-27.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FASES, AULAS_PILOTO, MARCOS, planoDia, questoesPara,
  corrigirProva, avaliarMarco, recomendacaoPorFalha
} from '../modules/trilha-90-dias.mjs';

test('trilha de 90 dias preserva fases, títulos e conteúdos planejados', () => {
  assert.equal(FASES.length, 3);
  assert.equal(Object.keys(AULAS_PILOTO).length, 33);
  for (let dia = 1; dia <= 90; dia++) {
    const plano = planoDia(dia);
    assert.equal(plano.dia, dia);
    assert.equal(plano.tempoPrevisto, 15);
    assert.ok(plano.titulo);
    assert.equal(plano.etapas.join(','), 'APRENDER,DEMONSTRAR,PRATICAR,PROVAR');
    if (dia <= 33) {
      assert.equal(plano.estado, 'conteudo_para_revisao');
      assert.ok(plano.conteudo);
    } else {
      assert.equal(plano.estado, 'planejado');
      assert.equal(plano.conteudo, null);
    }
  }
  for (const dia of [0, -1, 91, 1.5, NaN]) {
    assert.throws(() => planoDia(dia), /Dia inválido/);
  }
});

test('33 aulas editoriais possuem conteúdo completo e oito questões', () => {
  for (let dia = 1; dia <= 33; dia++) {
    const aula = planoDia(dia).conteudo;
    assert.ok(aula.objetivo, 'objetivo dia ' + dia);
    assert.equal(aula.aprender.length, 5, 'aprender dia ' + dia);
    assert.ok(aula.demonstrar.certo && aula.demonstrar.errado && aula.demonstrar.porQue);
    assert.ok(aula.praticar.cenario && aula.praticar.tarefa);
    assert.equal(aula.provar.perguntas.length, 8);
    for (const pergunta of aula.provar.perguntas) {
      assert.equal(pergunta.length, 5);
      assert.ok(pergunta.every(Boolean));
    }
  }
});

test('prova e reteste reordenam respostas corretamente e respeitam nota mínima', () => {
  for (let dia = 1; dia <= 33; dia++) {
    const aula = planoDia(dia).conteudo;
    for (let versao = 0; versao < 8; versao++) {
      const questoes = questoesPara(dia, versao);
      assert.equal(questoes.length, 8);
      const corretas = questoes.map((q, i) => {
        const indice = (versao + i) % 4;
        assert.equal(q.alternativas.length, 4);
        assert.equal(q.alternativas[indice], aula.provar.perguntas[i][1]);
        return indice;
      });
      const total = corrigirProva(dia, corretas, versao);
      assert.equal(total.nota, 10);
      assert.equal(total.aprovado, true);
      assert.equal(total.revisar.length, 0);
      const sete = corrigirProva(dia, corretas.map((a, i) => i === 0 ? (a + 1) % 4 : a), versao);
      assert.equal(sete.nota, 8.8);
      assert.equal(sete.aprovado, true);
      assert.equal(sete.revisar.length, 1);
      const seis = corrigirProva(dia, corretas.map((a, i) => i < 2 ? (a + 1) % 4 : a), versao);
      assert.equal(seis.nota, 7.5);
      assert.equal(seis.aprovado, false);
      assert.equal(seis.revisar.length, 2);
    }
  }
  assert.throws(() => corrigirProva(1, [0]), /Responda todas as questões/);
  for (const dia of [34, 60, 90]) {
    assert.throws(() => questoesPara(dia), /Aula ainda não escrita/);
  }
});

test('marcos 30, 60 e 90 exigem evidências e aprovação expressa do gestor', () => {
  for (const dia of [30, 60, 90]) {
    const requisitos = MARCOS[dia].exige;
    const vazio = avaliarMarco(dia);
    assert.equal(vazio.certificado, false);
    assert.equal(vazio.prontoParaDecisao, false);
    assert.equal(vazio.faltantes.length, requisitos.length);
    const evidencias = Object.fromEntries(requisitos.map((_, i) => ['r' + i, true]));
    const semGestor = avaliarMarco(dia, evidencias);
    assert.equal(semGestor.prontoParaDecisao, true);
    assert.equal(semGestor.certificado, false);
    assert.equal(avaliarMarco(dia, { ...evidencias, aprovacaoGestor: true }).certificado, true);
  }
  assert.throws(() => avaliarMarco(29), /Sem marco/);
});

test('recomendações apontam para dias válidos sem conceder certificados', () => {
  for (const codigo of ['abertura', 'escuta', 'escopo', 'projeto', 'arquiteto', 'negociacao', 'sierra']) {
    const r = recomendacaoPorFalha(codigo);
    assert.ok(r);
    assert.ok(r.dia >= 1 && r.dia <= 90);
    assert.equal(r.titulo, planoDia(r.dia).titulo);
  }
  assert.equal(recomendacaoPorFalha('desconhecido'), null);
});
