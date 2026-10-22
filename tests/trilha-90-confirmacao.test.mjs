import test from "node:test";
import assert from "node:assert/strict";
import {confirmarRegistroPersistido} from "../homologacao/trilha-90-confirmacao.mjs";
test("não confirma registro ausente",()=>assert.equal(confirmarRegistroPersistido(null,null),false));
test("não confirma nota inferior a oito",()=>{
 const r={user_id:"x",dia:1,pratica_texto:"a".repeat(60),simulacao_texto:"b".repeat(60),respostas:[],tentativa:1,nota_provisoria:7.5,aprovado_provisorio:true,etapa:"concluido"};
 assert.equal(confirmarRegistroPersistido(r,r),false);
});
