/* Homologação: testes de lógica pura. Não são E2E autenticados, não usam Supabase e não certificam. */
import assert from "node:assert/strict";
import {novo,normalizar,avancar,corrigido,reteste,liberado} from "./trilha-90-piloto-estado.mjs";
import {planoDia,questoesPara,corrigirProva} from "../modules/trilha-90-dias.mjs";
const texto="Diagnóstico consultivo com escuta ativa, confirmação das medidas e próximo passo combinado.";
const progresso={};
for(let dia=1;dia<=90;dia++){
 const plano=planoDia(dia);
 assert.equal(plano.dia,dia);
 assert.ok(plano.titulo);
 if(dia>4)assert.throws(()=>questoesPara(dia));
}
for(let dia=1;dia<=4;dia++){
 assert.equal(liberado(dia,progresso,true),true);
 let s=novo(dia);
 assert.throws(()=>avancar(s,"provar"));
 s.aprendizado=texto;s=avancar(s,"demonstrar");
 s.demonstracao=texto;s=avancar(s,"praticar");
 s.pratica=texto;s.simulacao=texto;s=avancar(s,"provar");
 const prova=questoesPara(dia,0);
 assert.equal(prova.length,8);
 assert.throws(()=>corrigirProva(dia,[],0));
 const erradas=prova.map((_,i)=>(i+1)%4);
 const falha=corrigirProva(dia,erradas,0);
 assert.equal(falha.nota,0);
 s=corrigido(s,falha);
 assert.throws(()=>corrigido(s,falha));
 s=reteste(s);
 const alternativa=questoesPara(dia,1);
 assert.notEqual(alternativa[0].enunciado,prova[0].enunciado);
 const respostas=alternativa.map((_,i)=>(i+1)%4);
 respostas[0]=(respostas[0]+1)%4;
 const sucesso=corrigirProva(dia,respostas,1);
 assert.equal(sucesso.nota,8.8);
 s=corrigido(s,sucesso);
 assert.equal(s.aprovado,true);
 progresso[dia]=normalizar(JSON.parse(JSON.stringify(s)),dia);
 assert.equal(progresso[dia].tentativa,2);
}
assert.equal(liberado(5,progresso,false),false);
assert.equal(normalizar({...novo(1),nota:10,aprovado:true},2).aprovado,false);
console.log("PASS: 90 temas, 4 provas, bloqueios, reprovação, reteste, nota >=8 e recarga JSON local.");
console.log("LIMITAÇÃO: sem autenticação, banco, leitura remota, WhatsApp ou CRM real.");
