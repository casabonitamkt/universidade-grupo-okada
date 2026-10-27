/* Execute: node --test tests/trilha-90-dias-19-21.test.mjs
 * Somente dados editoriais; não usa banco, rede, contas ou WhatsApp.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {planoDia,questoesPara,corrigirProva,avaliarMarco} from "../modules/trilha-90-dias.mjs";

for (const dia of [19,20,21]) {
 test("aula "+dia+" tem conteúdo completo e coerente",()=>{
  const aula=planoDia(dia);
  assert.equal(aula.estado,"conteudo_para_revisao");
  assert.equal(aula.tempoPrevisto,15);
  assert.ok(aula.conteudo.objetivo.length>100);
  assert.equal(aula.conteudo.aprender.length,5);
  for(const paragrafo of aula.conteudo.aprender)assert.ok(paragrafo.length>=270);
  assert.ok(aula.conteudo.demonstrar.certo.length>70);
  assert.ok(aula.conteudo.demonstrar.errado.length>65);
  assert.ok(aula.conteudo.demonstrar.porQue.length>70);
  assert.ok(aula.conteudo.praticar.cenario.length>120);
  assert.ok(aula.conteudo.praticar.tarefa.length>120);
  assert.equal(aula.conteudo.provar.criterios.length,6);
  assert.equal(aula.conteudo.provar.perguntas.length,8);
  for(const pergunta of aula.conteudo.provar.perguntas){
   assert.equal(pergunta.length,5);
   assert.equal(new Set(pergunta.slice(1)).size,4);
  }
 });
 test("aula "+dia+" tem correção consistente em 8 retestes",()=>{
  for(let versao=0;versao<8;versao++){
   const qs=questoesPara(dia,versao);
   assert.equal(qs.length,8);
   const corretas=qs.map((_,i)=>(versao+i)%4);
   const gabarito=corrigirProva(dia,corretas,versao);
   assert.equal(gabarito.nota,10);
   assert.equal(gabarito.aprovado,true);
   const uma=corretas.slice();uma[0]=(uma[0]+1)%4;
   assert.equal(corrigirProva(dia,uma,versao).aprovado,true);
   const duas=uma.slice();duas[1]=(duas[1]+1)%4;
   assert.equal(corrigirProva(dia,duas,versao).aprovado,false);
  }
 });
}
test("dias seguintes não são liberados e certificação exige gestor",()=>{
 for(let dia=31;dia<=90;dia++)assert.equal(planoDia(dia).conteudo,null);
 for(const dia of [30,60,90]){
  assert.equal(avaliarMarco(dia,{}).certificado,false);
  const requisitos=avaliarMarco(dia,{}).requisitos;
  const provas=Object.fromEntries(requisitos.map((_,i)=>["r"+i,true]));
  assert.equal(avaliarMarco(dia,provas).certificado,false);
  assert.equal(avaliarMarco(dia,{...provas,aprovacaoGestor:true}).certificado,true);
 }
});
