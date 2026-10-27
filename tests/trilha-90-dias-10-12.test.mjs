/* Testes editoriais isolados: node --test tests/trilha-90-dias-10-12.test.mjs
 * Não acessa Supabase, credenciais, progresso ou WhatsApp.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {planoDia,questoesPara,corrigirProva,avaliarMarco} from "../modules/trilha-90-dias.mjs";
test("trilha tem 90 dias, 1–36 completos e 37–90 planejados",()=>{
 for(let d=1;d<=90;d++){
  const l=planoDia(d);assert.equal(l.dia,d);assert.equal(l.tempoPrevisto,15);
  if(d<=36){assert.equal(l.conteudo.aprender.length,5);assert.equal(l.conteudo.provar.perguntas.length,8);assert.ok(l.conteudo.demonstrar.certo);assert.ok(l.conteudo.praticar.tarefa);}
  else assert.equal(l.conteudo,null);
 }
 for(const d of [0,91,1.5])assert.throws(()=>planoDia(d));
});
test("provas 1–12: correção, reteste e mínimo de sete acertos",()=>{
 for(let d=1;d<=12;d++)for(let versao=0;versao<4;versao++){
  const qs=questoesPara(d,versao);
  const certas=qs.map((_,i)=>(versao+i)%4);
  const umaErrada=certas.map((a,i)=>i===0?(a+1)%4:a);
  const duasErradas=certas.map((a,i)=>i<2?(a+1)%4:a);
  assert.equal(corrigirProva(d,certas,versao).nota,10);
  assert.equal(corrigirProva(d,umaErrada,versao).aprovado,true);
  assert.equal(corrigirProva(d,duasErradas,versao).aprovado,false);
  assert.throws(()=>corrigirProva(d,certas.slice(1),versao));
 }
});
test("marcos exigem evidências e aprovação explícita do gestor",()=>{
 for(const d of [30,60,90]){
  const sem=avaliarMarco(d);assert.equal(sem.certificado,false);
  const evidencias=Object.fromEntries(sem.requisitos.map((_,i)=>["r"+i,true]));
  assert.equal(avaliarMarco(d,evidencias).certificado,false);
  assert.equal(avaliarMarco(d,{...evidencias,aprovacaoGestor:true}).certificado,true);
 }
});
