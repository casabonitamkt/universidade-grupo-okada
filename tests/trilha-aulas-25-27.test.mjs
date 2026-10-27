import assert from "node:assert/strict";
import { AULAS_25_27 } from "../modules/trilha-90-dias-aulas-25-27.mjs";
import { planoDia, questoesPara, corrigirProva, avaliarMarco } from "../modules/trilha-90-dias.mjs";

for (const dia of [25, 26, 27]) {
  const l = planoDia(dia);
  assert.equal(l.estado, "conteudo_para_revisao");
  assert.equal(l.conteudo, AULAS_25_27[dia]);
  assert.equal(l.conteudo.aprender.length, 5);
  assert.equal(l.conteudo.provar.perguntas.length, 8);
  assert.ok(l.conteudo.objetivo.length > 50);
  assert.ok(l.conteudo.praticar.tarefa.length > 50);
  for (const pergunta of l.conteudo.provar.perguntas) {
    assert.equal(pergunta.length, 5);
    assert.equal(new Set(pergunta.slice(1)).size, 4);
  }
  for (const versao of [0, 1, 2, 3]) {
    const qs = questoesPara(dia, versao);
    const corretas = qs.map((_, i) => (versao + i) % 4);
    const aprovado = corrigirProva(dia, corretas, versao);
    assert.equal(aprovado.nota, 10);
    assert.equal(aprovado.aprovado, true);
    const errado = corrigirProva(dia, corretas.map(x => (x + 1) % 4), versao);
    assert.equal(errado.nota, 0);
    assert.equal(errado.aprovado, false);
  }
}
assert.equal(planoDia(31).estado, "planejado");
assert.equal(planoDia(90).estado, "planejado");
assert.equal(avaliarMarco(30, {}).certificado, false);
console.log("OK: aulas 25-27, 24 questões, 4 versões, limites e certificação.");
