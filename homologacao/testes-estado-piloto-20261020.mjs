import assert from "node:assert/strict";
import {novo,normalizar,avancar,corrigido,reteste,liberado} from "./trilha-90-piloto-estado.mjs";
import {questoesPara,corrigirProva} from "../modules/trilha-90-dias.mjs";
const longo="Diagnóstico consultivo, contexto do cliente, medidas e próximo passo combinado. ";
const estados={};
for(let dia=1;dia<=4;dia++){
 assert.equal(liberado(dia,estados,true),true);
 let s=novo(dia);s.aprendizado=longo;s=avancar(s,"demonstrar");
 assert.throws(()=>avancar(s,"aprender"));
 s.demonstracao=longo;s=avancar(s,"praticar");
 assert.throws(()=>avancar(s,"provar"));
 s.pratica=longo;s.simulacao=longo;s=avancar(s,"provar");
 const qs=questoesPara(dia,0),a=qs.map((_,i)=>i%4);
 a[0]=(a[0]+1)%4;a[1]=(a[1]+1)%4;
 const falha=corrigirProva(dia,a,0);assert.equal(falha.nota,7.5);
 s=corrigido(s,falha);assert.throws(()=>corrigido(s,falha));
 s=reteste(s);assert.equal(s.versao,1);
 assert.notEqual(qs[0].enunciado,questoesPara(dia,1)[0].enunciado);
 const b=questoesPara(dia,1).map((_,i)=>(i+1)%4);b[0]=(b[0]+1)%4;
 const sucesso=corrigirProva(dia,b,1);assert.equal(sucesso.nota,8.8);
 s=corrigido(s,sucesso);assert.equal(s.aprovado,true);
 const recuperado=normalizar(JSON.parse(JSON.stringify(s)),dia);
 assert.equal(recuperado.tentativa,2);estados[dia]=recuperado;
}
assert.equal(liberado(5,estados,false),false);
assert.throws(()=>corrigido({...novo(1),etapa:"provar"},{dia:1,nota:10}));
console.log("OK: quatro dias, ordem, reprovação, reteste diferente, aprovação >=8 e recarga JSON; sem banco.");
