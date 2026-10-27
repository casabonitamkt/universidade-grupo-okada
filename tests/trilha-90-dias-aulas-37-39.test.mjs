// Regressão editorial isolada; não acessa Supabase, WhatsApp, dados pessoais ou serviços pagos.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AULAS_37_39 } from "../modules/trilha-90-dias-aulas-37-39.mjs";
import { AULAS_PILOTO, planoDia, questoesPara, corrigirProva, avaliarMarco } from "../modules/trilha-90-dias.mjs";

test("dias 37-39: conteúdo completo e 24 questões distintas", () => {
  assert.deepEqual(Object.keys(AULAS_37_39), ["37", "38", "39"]);
  for (const dia of [37, 38, 39]) {
    const l = planoDia(dia);
    assert.equal(l.estado, "conteudo_para_revisao");
    assert.equal(l.tempoPrevisto, 15);
    assert.equal(l.conteudo.aprender.length, 5);
    assert.ok(l.conteudo.aprender.every(p => p.length >= 270));
    assert.ok(l.conteudo.demonstrar.certo && l.conteudo.demonstrar.errado && l.conteudo.demonstrar.porQue);
    assert.ok(l.conteudo.praticar.cenario && l.conteudo.praticar.tarefa);
    assert.equal(l.conteudo.provar.criterios.length, 6);
    assert.equal(l.conteudo.provar.perguntas.length, 8);
    for (const p of l.conteudo.provar.perguntas) {
      assert.equal(p.length, 5);
      assert.equal(new Set(p.slice(1)).size, 4);
    }
  }
});

test("provas e retestes das aulas 37-39 mantêm gabarito e corte", () => {
  for (const dia of [37, 38, 39]) for (let versao = 0; versao < 8; versao++) {
    const questoes = questoesPara(dia, versao);
    assert.equal(questoes.length, 8);
    const respostas = questoes.map((_, i) => (versao + i) % 4);
    assert.equal(corrigirProva(dia, respostas, versao).nota, 10);
    const sete = respostas.slice();
    sete[0] = (sete[0] + 1) % 4;
    assert.equal(corrigirProva(dia, sete, versao).aprovado, true);
    sete[1] = (sete[1] + 1) % 4;
    assert.equal(corrigirProva(dia, sete, versao).aprovado, false);
  }
});

test("fronteira editorial: 39 completas e 40-90 planejadas", () => {
  assert.equal(Object.keys(AULAS_PILOTO).length, 39);
  assert.equal(planoDia(39).estado, "conteudo_para_revisao");
  for (let d = 40; d <= 90; d++) {
    assert.equal(planoDia(d).estado, "planejado");
    assert.equal(planoDia(d).conteudo, null);
  }
  assert.equal(avaliarMarco(60, {}).certificado, false);
  assert.equal(avaliarMarco(90, {}).certificado, false);
});

test("prévia é somente demonstrativa e sem persistência", async () => {
  const html = await readFile(new URL("../homologacao/trilha-90-dias.html", import.meta.url), "utf8");
  assert.match(html, /1–39 completas/);
  assert.match(html, /Dias 40–90 continuam planejados/);
  assert.doesNotMatch(html, /supabase\.from\(|fetch\(|XMLHttpRequest|localStorage|sessionStorage|z-api|wa\.me\//i);
});
