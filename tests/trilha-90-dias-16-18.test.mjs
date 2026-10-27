/* Testes locais: node --test tests/trilha-90-dias-16-18.test.mjs
 * Conteúdo editorial puro; sem Supabase, WhatsApp, serviços pagos ou dados pessoais.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {planoDia,questoesPara,corrigirProva,avaliarMarco} from "../modules/trilha-90-dias.mjs";

for (const dia of [16,17,18]) {
 test("aula "+dia+" contém conteúdo aprofundado e prova íntegra",()=>{
  const aula=planoDia(dia);
  assert.equal(aula.estado,"conteudo_para_revisao");
  assert.equal(aula.tempoPrevisto,15);
  assert.ok(aula.conteudo.objetivo.length>90);
  assert.equal(aula.conteudo.aprender.length,5);
  for(const trecho of aula.conteudo.aprender)assert.ok(trecho.length>250);
  assert.ok(aula.conteudo.demonstrar.certo.length>60);
  assert.ok(aula.conteudo.demonstrar.errado.length>50);
  assert.ok(aula.conteudo.demonstrar.porQue.length>80);
  assert.ok(aula.conteudo.praticar.cenario.length>100);
  assert.ok(aula.conteudo.praticar.tarefa.length>100);
  assert.equal(aula.conteudo.provar.perguntas.length,8);
  assert.ok(aula.conteudo.provar.criterios.length>=6);
  for(const pergunta of aula.conteudo.provar.perguntas) {
   assert.equal(pergunta.length,5);
   assert.equal(new Set(pergunta.slice(1)).size,4);
  }
 });
 test("aula "+dia+" mantém retestes e exige mínimo para aprovação",()=>{
  for(let versao=0;versao<8;versao++){
   const q=questoesPara(dia,versao);
   const certas=q.map((_,i)=>(versao+i)%4);
   const resultado=corrigirProva(dia,certas,versao);
   assert.equal(resultado.nota,10);
   assert.equal(resultado.aprovado,true);
   const umaErrada=certas.slice();umaErrada[0]=(umaErrada[0]+1)%4;
   assert.equal(corrigirProva(dia,umaErrada,versao).aprovado,true);
   const duasErradas=certas.slice();duasErradas[0]=(duasErradas[0]+1)%4;duasErradas[1]=(duasErradas[1]+1)%4;
   assert.equal(corrigirProva(dia,duasErradas,versao).aprovado,false);
  }
 });
}
test("conteúdo novo não certifica automaticamente nem libera dias planejados",()=>{
 for(const dia of [30,60,90])assert.equal(avaliarMarco(dia,{}).certificado,false);
 for(let dia=37;dia<=90;dia++)assert.equal(planoDia(dia).conteudo,null);
});
