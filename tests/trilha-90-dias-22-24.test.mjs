import test from "node:test";
import assert from "node:assert/strict";
import {planoDia,questoesPara,corrigirProva,avaliarMarco} from "../modules/trilha-90-dias.mjs";
for(const dia of [22,23,24]){
 test("aula "+dia+" possui conteúdo editorial completo",()=>{const l=planoDia(dia);assert.equal(l.estado,"conteudo_para_revisao");assert.equal(l.conteudo.aprender.length,5);for(const p of l.conteudo.aprender)assert.ok(p.length>=270);assert.equal(l.conteudo.provar.perguntas.length,8);assert.equal(l.conteudo.provar.criterios.length,6);for(const q of l.conteudo.provar.perguntas){assert.equal(q.length,5);assert.equal(new Set(q.slice(1)).size,4)}});
 test("aula "+dia+" tem gabarito e retestes coerentes",()=>{for(let v=0;v<8;v++){const qs=questoesPara(dia,v);assert.equal(qs.length,8);const respostas=qs.map((_,i)=>(v+i)%4);assert.equal(corrigirProva(dia,respostas,v).nota,10);const uma=respostas.slice();uma[0]=(uma[0]+1)%4;assert.equal(corrigirProva(dia,uma,v).aprovado,true);uma[1]=(uma[1]+1)%4;assert.equal(corrigirProva(dia,uma,v).aprovado,false)}});
}
test("dias 25–90 planejados e certificação exige gestor",()=>{for(let dia=25;dia<=90;dia++)assert.equal(planoDia(dia).conteudo,null);for(const dia of [30,60,90]){const x=avaliarMarco(dia,{});assert.equal(x.certificado,false);const e=Object.fromEntries(x.requisitos.map((_,i)=>["r"+i,true]));assert.equal(avaliarMarco(dia,e).certificado,false)}});
