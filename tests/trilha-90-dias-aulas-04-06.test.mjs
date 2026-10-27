import test from "node:test";
import assert from "node:assert/strict";
import { FASES, AULAS_PILOTO, planoDia, questoesPara, corrigirProva, avaliarMarco } from "../modules/trilha-90-dias.mjs";

test("90 dias planejados em tres fases; 1 a 27 com conteudo editorial", () => {
  assert.equal(FASES.length, 3);
  assert.deepEqual(FASES.map(f => f[1].length), [30,30,30]);
  for(let dia=1;dia<=90;dia++){
    const p=planoDia(dia);
    assert.equal(p.dia,dia);
    assert.equal(p.tempoPrevisto,15);
    assert.equal(p.estado,dia<=27?"conteudo_para_revisao":"planejado");
    assert.equal(Boolean(p.conteudo),dia<=27);
  }
  assert.deepEqual(Object.keys(AULAS_PILOTO).map(Number).sort((a,b)=>a-b),Array.from({length:27},(_,i)=>i+1));
});

test("aulas 4 a 6 tem conteudo, demonstracao, pratica e 8 questoes validas", () => {
  for(const dia of [4,5,6]){
    const aula=planoDia(dia).conteudo;
    assert.ok(aula.objetivo.length>=50);
    assert.equal(aula.aprender.length,5);
    assert.ok(aula.aprender.every(p=>p.length>=150));
    for(const key of ["certo","errado","porQue"]) assert.ok(aula.demonstrar[key].length>=40);
    assert.ok(aula.praticar.cenario.length>=80);
    assert.ok(aula.praticar.tarefa.length>=80);
    assert.ok(aula.provar.criterios.length>=6);
    assert.equal(aula.provar.perguntas.length,8);
    for(const q of aula.provar.perguntas){
      assert.equal(q.length,5);
      assert.ok(q.every(x=>typeof x==="string"&&x.trim().length>2));
      assert.equal(new Set(q.slice(1)).size,4);
    }
  }
});

test("gabarito e reteste 4-6: 8/8 aprovado, 6/8 reprovado", () => {
  for(const dia of [4,5,6]){
    for(const versao of [0,1,2,3]){
      const q=questoesPara(dia,versao);
      const correct=q.map((_,i)=>(versao+i)%4);
      assert.equal(corrigirProva(dia,correct,versao).nota,10);
      assert.equal(corrigirProva(dia,correct,versao).aprovado,true);
      const fail=correct.map((v,i)=>i<2?(v+1)%4:v);
      assert.equal(corrigirProva(dia,fail,versao).nota,7.5);
      assert.equal(corrigirProva(dia,fail,versao).aprovado,false);
      for(let i=0;i<q.length;i++)assert.equal(q[i].alternativas[correct[i]],planoDia(dia).conteudo.provar.perguntas[i][1]);
    }
  }
});

test("marcos nunca certificam sem aprovacao do gestor", () => {
  for(const dia of [30,60,90]){
    const empty=avaliarMarco(dia,{});
    assert.equal(empty.certificado,false);
    const evidence=Object.fromEntries(empty.requisitos.map((_,i)=>["r"+i,true]));
    assert.equal(avaliarMarco(dia,evidence).certificado,false);
    assert.equal(avaliarMarco(dia,{...evidence,aprovacaoGestor:true}).certificado,true);
  }
});

test("dias invalidos e prova sem respostas sao rejeitados", () => {
  for(const d of [0,-1,91,1.2,"4",null])assert.throws(()=>planoDia(d));
  assert.throws(()=>corrigirProva(4,[]));
  assert.throws(()=>corrigirProva(28,Array(8).fill(0)));
});
