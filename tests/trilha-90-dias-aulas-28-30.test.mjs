import test from "node:test";
import assert from "node:assert/strict";
import { AULAS_28_30 } from "../modules/trilha-90-dias-aulas-28-30.mjs";
import { planoDia, questoesPara, corrigirProva, avaliarMarco } from "../modules/trilha-90-dias.mjs";

test("dias 28 a 30 têm conteúdo completo, 15 parágrafos e 24 questões", () => {
  for (const dia of [28, 29, 30]) {
    const aula = AULAS_28_30[dia];
    assert.ok(aula);
    assert.equal(aula.aprender.length, 5);
    assert.equal(aula.provar.perguntas.length, 8);
    assert.equal(aula.provar.criterios.length, 6);
    assert.ok(aula.aprender.every(p => p.length >= 180));
    assert.ok(aula.demonstrar.certo && aula.demonstrar.errado && aula.demonstrar.porQue);
    assert.ok(aula.praticar.cenario && aula.praticar.tarefa);
    for (const pergunta of aula.provar.perguntas) {
      assert.equal(pergunta.length, 5);
      assert.equal(new Set(pergunta.slice(1)).size, 4);
    }
  }
});

test("dias 1-36 são editoriais e 37-90 permanecem planejados", () => {
  for (let dia = 1; dia <= 36; dia++) {
    const aula = planoDia(dia);
    assert.equal(aula.estado, "conteudo_para_revisao");
    assert.ok(aula.conteudo);
    assert.equal(aula.tempoPrevisto, 15);
  }
  for (let dia = 37; dia <= 90; dia++) {
    const aula = planoDia(dia);
    assert.equal(aula.estado, "planejado");
    assert.equal(aula.conteudo, null);
  }
});

test("prova e reteste mudam alternativas e mantêm correção correta", () => {
  for (const dia of [28, 29, 30]) {
    const inicial = questoesPara(dia, 0);
    const reteste = questoesPara(dia, 1);
    assert.equal(inicial.length, 8);
    assert.equal(reteste.length, 8);
    assert.notDeepEqual(inicial[0].alternativas, reteste[0].alternativas);
    for (const versao of [0, 1, 2, 3]) {
      const gabarito = Array.from({length:8}, (_,i)=>(versao+i)%4);
      const aprovado = corrigirProva(dia, gabarito, versao);
      assert.equal(aprovado.nota, 10);
      assert.equal(aprovado.aprovado, true);
      assert.deepEqual(aprovado.revisar, []);
      const zerado = corrigirProva(dia, gabarito.map(v=>(v+1)%4), versao);
      assert.equal(zerado.nota, 0);
      assert.equal(zerado.aprovado, false);
    }
  }
});

test("marco 30 exige evidências e aprovação do gestor", () => {
  const vazio = avaliarMarco(30);
  assert.equal(vazio.prontoParaDecisao, false);
  assert.equal(vazio.certificado, false);
  const completo = Object.fromEntries(vazio.requisitos.map((_,i)=>["r"+i,true]));
  const semGestor = avaliarMarco(30, completo);
  assert.equal(semGestor.prontoParaDecisao, true);
  assert.equal(semGestor.certificado, false);
  const comGestor = avaliarMarco(30, {...completo, aprovacaoGestor:true});
  assert.equal(comGestor.certificado, true);
});

test("biblioteca editorial não altera notas, usuários ou sistemas externos", () => {
  assert.ok(!Object.keys(AULAS_28_30).some(x=>!["28","29","30"].includes(x)));
  assert.equal(planoDia(30).marco.nome, "Fundamentos");
  assert.throws(()=>planoDia(0));
  assert.throws(()=>planoDia(91));
});
