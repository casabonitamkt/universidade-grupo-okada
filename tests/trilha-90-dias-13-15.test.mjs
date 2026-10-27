/* Regressão editorial isolada: node --test tests/trilha-90-dias-13-15.test.mjs
 * Não lê credenciais, não escreve dados, não acessa WhatsApp/Supabase.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {FASES,planoDia,questoesPara,corrigirProva,avaliarMarco,MARCOS} from "../modules/trilha-90-dias.mjs";

test("plano conserva exatamente 90 dias e 3 fases",()=>{
 assert.equal(FASES.length,3);
 for(const fase of FASES)assert.equal(fase[1].length,30);
 for(let dia=1;dia<=90;dia++){
  const plano=planoDia(dia);
  assert.equal(plano.dia,dia);
  assert.equal(plano.tempoPrevisto,15);
  assert.equal(plano.conteudo!==null,dia<=39,"Dia "+dia);
 }
});

for(let dia=1;dia<=18;dia++)test("aula "+dia+" completa e prova/reteste consistente",()=>{
 const a=planoDia(dia);
 assert.equal(a.estado,"conteudo_para_revisao");
 assert.ok(a.conteudo.objetivo);
 assert.ok(a.conteudo.aprender.length>=5);
 assert.ok(a.conteudo.demonstrar.certo&&a.conteudo.demonstrar.errado&&a.conteudo.demonstrar.porQue);
 assert.ok(a.conteudo.praticar.cenario&&a.conteudo.praticar.tarefa);
 assert.equal(a.conteudo.provar.perguntas.length,8);
 for(const pergunta of a.conteudo.provar.perguntas)assert.equal(pergunta.length,5);
 for(let versao=0;versao<4;versao++){
  const qs=questoesPara(dia,versao);
  const certas=qs.map((q,i)=>{
   const indice=(versao+i)%4;
   assert.equal(q.alternativas[indice],a.conteudo.provar.perguntas[i][1]);
   return indice;
  });
  const aprovado=corrigirProva(dia,certas,versao);
  assert.equal(aprovado.nota,10);
  assert.equal(aprovado.aprovado,true);
  const reprovado=corrigirProva(dia,certas.map(x=>(x+1)%4),versao);
  assert.equal(reprovado.nota,0);
  assert.equal(reprovado.aprovado,false);
  assert.equal(reprovado.revisar.length,8);
 }
});

test("dias 40–90 continuam planejados, sem aula inventada",()=>{
 for(let dia=40;dia<=90;dia++)assert.equal(planoDia(dia).estado,"planejado");
 assert.throws(()=>questoesPara(40),/não escrita/);
});

test("marcos exigem evidências e aprovação explícita do gestor",()=>{
 for(const dia of [30,60,90]){
  assert.equal(avaliarMarco(dia,{}).certificado,false);
  const evidencia=Object.fromEntries(MARCOS[dia].exige.map((_,i)=>["r"+i,true]));
  assert.equal(avaliarMarco(dia,evidencia).certificado,false);
  assert.equal(avaliarMarco(dia,{...evidencia,aprovacaoGestor:true}).certificado,true);
 }
});
