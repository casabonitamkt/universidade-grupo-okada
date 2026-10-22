import assert from "node:assert/strict";
import {planoDia,questoesPara} from "../modules/trilha-90-dias.mjs";
const aula=planoDia(5);
assert.equal(aula.estado,"conteudo_para_revisao");
assert.equal(aula.conteudo.provar.perguntas.length,8);
assert.notEqual(questoesPara(5,0)[0].enunciado,questoesPara(5,1)[0].enunciado);
console.log("PASS: Dia 5 com aula e prova alternativa.");
