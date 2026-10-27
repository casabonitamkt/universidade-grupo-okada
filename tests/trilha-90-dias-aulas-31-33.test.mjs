import test from "node:test";
import assert from "node:assert/strict";
import { AULAS_31_33 } from "../modules/trilha-90-dias-aulas-31-33.mjs";
import { planoDia, questoesPara, corrigirProva, avaliarMarco } from "../modules/trilha-90-dias.mjs";

test("dias 31-33: conteúdo editorial completo e 24 questões", () => {
  assert.deepEqual(Object.keys(AULAS_31_33).sort(), ["31","32","33"]);
  for (const dia of [31,32,33]) {
    const aula = AULAS_31_33[dia];
    assert.equal(aula.aprender.length,5);
    assert.ok(aula.aprender.every(p=>p.length>=180));
    assert.equal(aula.provar.criterios.length,6);
    assert.equal(aula.provar.perguntas.length,8);
    assert.ok(aula.demonstrar.certo && aula.demonstrar.errado && aula.demonstrar.porQue);
    assert.ok(aula.praticar.cenario && aula.praticar.tarefa);
    for(const q of aula.provar.perguntas){
      assert.equal(q.length,5);
      assert.equal(new Set(q.slice(1)).size,4);
    }
    const p=planoDia(dia);
    assert.equal(p.estado,"conteudo_para_revisao");
    assert.equal(p.conteudo,aula);
    assert.equal(p.tempoPrevisto,15);
  }
});

test("prova e reteste dos dias 31-33 corrigem sem gravar notas", () => {
  for(const dia of [31,32,33]) {
    for(const versao of [0,1,2,3]) {
      const q=questoesPara(dia,versao);
      assert.equal(q.length,8);
      const certas=Array.from({length:8},(_,i)=>(versao+i)%4);
      const nota=corrigirProva(dia,certas,versao);
      assert.equal(nota.nota,10);
      assert.equal(nota.aprovado,true);
      const erradas=certas.map(i=>(i+1)%4);
      assert.equal(corrigirProva(dia,erradas,versao).nota,0);
    }
  }
});

test("dias 34-90 permanecem planejados; marcos não certificam automaticamente", () => {
  for(let dia=1;dia<=33;dia++) assert.equal(planoDia(dia).estado,"conteudo_para_revisao");
  for(let dia=34;dia<=90;dia++) assert.equal(planoDia(dia).estado,"planejado");
  assert.throws(()=>questoesPara(34),/não escrita/);
  for(const dia of [30,60,90]) assert.equal(avaliarMarco(dia,{}).certificado,false);
});
