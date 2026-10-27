import test from "node:test";
import assert from "node:assert/strict";
import { AULAS_PILOTO, FASES, planoDia, questoesPara, corrigirProva, avaliarMarco } from "../modules/trilha-90-dias.mjs";

test("90 dias permanecem planejados; 1 a 42 possuem conteudo em homologacao", () => {
  assert.equal(FASES.length,3);
  assert.deepEqual(FASES.map(f=>f[1].length),[30,30,30]);
  assert.deepEqual(Object.keys(AULAS_PILOTO).map(Number).sort((a,b)=>a-b),Array.from({length:42},(_,i)=>i+1));
  for(let d=1;d<=90;d++){
    const p=planoDia(d);
    assert.equal(p.dia,d);
    assert.equal(p.tempoPrevisto,15);
    assert.equal(p.estado,d<=42?"conteudo_para_revisao":"planejado");
    assert.equal(Boolean(p.conteudo),d<=42);
  }
});

test("dias 7 a 9: conteudo, exemplos, pratica e prova completa", () => {
  for(const d of [7,8,9]){
    const p=planoDia(d),a=p.conteudo;
    assert.ok(p.titulo.length>10);
    assert.ok(a.objetivo.length>=80);
    assert.equal(a.aprender.length,5);
    assert.ok(a.aprender.every(x=>x.length>=150));
    for(const key of ["certo","errado","porQue"])assert.ok(a.demonstrar[key].length>=50);
    assert.ok(a.praticar.cenario.length>=80);
    assert.ok(a.praticar.tarefa.length>=80);
    assert.ok(a.provar.criterios.length>=6);
    assert.equal(a.provar.perguntas.length,8);
    for(const q of a.provar.perguntas){
      assert.equal(q.length,5);
      assert.ok(q.every(x=>typeof x==="string"&&x.trim().length>=4));
      assert.equal(new Set(q.slice(1)).size,4);
    }
  }
});

test("provas 7 a 9: gabaritos e retestes, nota minima e revisao", () => {
  for(const d of [7,8,9])for(const version of [0,1,2,3,4,5]){
    const questions=questoesPara(d,version);
    const correct=questions.map((_,i)=>(version+i)%4);
    const perfect=corrigirProva(d,correct,version);
    assert.equal(perfect.nota,10);
    assert.equal(perfect.aprovado,true);
    assert.equal(perfect.revisar.length,0);
    const seven=correct.map((v,i)=>i===0?(v+1)%4:v);
    assert.equal(corrigirProva(d,seven,version).nota,8.8);
    assert.equal(corrigirProva(d,seven,version).aprovado,true);
    const six=correct.map((v,i)=>i<2?(v+1)%4:v);
    assert.equal(corrigirProva(d,six,version).nota,7.5);
    assert.equal(corrigirProva(d,six,version).aprovado,false);
    assert.equal(corrigirProva(d,six,version).revisar.length,2);
    for(let i=0;i<questions.length;i++)
      assert.equal(questions[i].alternativas[correct[i]],planoDia(d).conteudo.provar.perguntas[i][1]);
  }
});

test("sem prova em dias planejados e sem certificacao automatica", () => {
  assert.throws(()=>corrigirProva(43,Array(8).fill(0)));
  assert.throws(()=>questoesPara(43));
  assert.throws(()=>corrigirProva(7,[]));
  for(const d of [30,60,90]){
    const evidence=Object.fromEntries(avaliarMarco(d).requisitos.map((_,i)=>["r"+i,true]));
    assert.equal(avaliarMarco(d,evidence).certificado,false);
    assert.equal(avaliarMarco(d,{...evidence,aprovacaoGestor:true}).certificado,true);
  }
});

test("seguranca editorial: nenhuma promessa comercial ou integracao de mensagens", () => {
  for(const d of [7,8,9]){
    const a=planoDia(d).conteudo;
    const text=[...a.aprender,a.demonstrar.certo,a.praticar.tarefa].join(" ").toLowerCase();
    assert.match(text,/autoriza|aprova|valid|confirm|consulta|verific/);
    assert.doesNotMatch(a.demonstrar.certo.toLowerCase(),/garanto desconto|entrega garantida|trocar sem avisar/);
  }
});
