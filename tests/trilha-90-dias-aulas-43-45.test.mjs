// Revisão editorial 43–45; testes puramente locais e sem credenciais.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AULAS_43_45 } from "../modules/trilha-90-dias-aulas-43-45.mjs";
import { planoDia } from "../modules/trilha-90-dias.mjs";

test("43–45: três aulas completas, 15 explicações e 24 questões distintas", () => {
  assert.deepEqual(Object.keys(AULAS_43_45), ["43", "44", "45"]);
  for (const dia of [43, 44, 45]) {
    const aula = AULAS_43_45[dia];
    assert.ok(aula.objetivo.length >= 80);
    assert.equal(aula.aprender.length, 5);
    assert.ok(aula.aprender.every(p => p.length >= 270));
    assert.ok(aula.demonstrar.certo.length > 60);
    assert.ok(aula.demonstrar.errado.length > 60);
    assert.ok(aula.demonstrar.porQue.length > 60);
    assert.ok(aula.praticar.cenario.length > 100);
    assert.ok(aula.praticar.tarefa.length > 100);
    assert.equal(aula.provar.criterios.length, 6);
    assert.equal(aula.provar.perguntas.length, 8);
    assert.equal(new Set(aula.provar.perguntas.map(q => q[0])).size, 8);
    for (const pergunta of aula.provar.perguntas) {
      assert.equal(pergunta.length, 5);
      assert.ok(pergunta.every(x => typeof x === "string" && x.trim().length > 0));
      assert.equal(new Set(pergunta.slice(1)).size, 4);
    }
  }
});

test("43–45: conteúdo permanece não integrado até regressão e homologação", () => {
  for (const dia of [43, 44, 45]) {
    const plano = planoDia(dia);
    assert.equal(plano.estado, "planejado");
    assert.equal(plano.conteudo, null);
  }
});

test("43–45: nenhuma comunicação, persistência ou mudança de usuário", async () => {
  const source = await readFile(new URL("../modules/trilha-90-dias-aulas-43-45.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /supabase|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|service_role|z-api|zappy|wa\.me\//i);
  assert.doesNotMatch(source, /import\s+.*from\s+["']https?:/i);
});

test("43–45: enunciados e respostas não se repetem entre aulas", () => {
  const all = Object.values(AULAS_43_45).flatMap(a => a.provar.perguntas);
  assert.equal(new Set(all.map(q => q[0])).size, 24);
  assert.equal(new Set(all.map(q => q[1])).size, 24);
});
