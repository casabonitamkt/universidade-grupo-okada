// Regressão da biblioteca editorial; não conecta usuários, banco, CRM ou mensageria.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AULAS_40_42 } from "../modules/trilha-90-dias-aulas-40-42.mjs";
import { AULAS_PILOTO, planoDia, questoesPara, corrigirProva, avaliarMarco } from "../modules/trilha-90-dias.mjs";

test("dias 40-42: conteúdo editorial aprofundado, prática e 24 questões", () => {
  assert.deepEqual(Object.keys(AULAS_40_42), ["40","41","42"]);
  for(const dia of [40,41,42]){
    const aula=AULAS_40_42[dia];
    assert.equal(planoDia(dia).conteudo,aula);
    assert.equal(planoDia(dia).estado,"conteudo_para_revisao");
    assert.equal(planoDia(dia).tempoPrevisto,15);
    assert.ok(aula.objetivo.length>=80);
    assert.equal(aula.aprender.length,5);
    assert.ok(aula.aprender.every(p=>p.length>=270));
    assert.ok(aula.demonstrar.certo.length>50 && aula.demonstrar.errado.length>50 && aula.demonstrar.porQue.length>50);
    assert.ok(aula.praticar.cenario.length>80 && aula.praticar.tarefa.length>80);
    assert.equal(aula.provar.criterios.length,6);
    assert.equal(aula.provar.perguntas.length,8);
    assert.equal(new Set(aula.provar.perguntas.map(q=>q[0])).size,8);
    for(const q of aula.provar.perguntas){
      assert.equal(q.length,5);
      assert.equal(new Set(q.slice(1)).size,4);
      assert.ok(q.every(Boolean));
    }
  }
});

test("dias 40-42: correção e retestes não gravam progresso",()=>{
  for(const dia of [40,41,42])for(let versao=0;versao<8;versao++){
    const q=questoesPara(dia,versao);
    assert.equal(q.length,8);
    const certas=q.map((item,i)=>{
      const pos=(versao+i)%4;
      assert.equal(item.alternativas[pos],AULAS_40_42[dia].provar.perguntas[i][1]);
      return pos;
    });
    assert.equal(corrigirProva(dia,certas,versao).nota,10);
    assert.equal(corrigirProva(dia,certas,versao).aprovado,true);
    const sete=certas.map((x,i)=>i===0?(x+1)%4:x);
    assert.equal(corrigirProva(dia,sete,versao).nota,8.8);
    assert.equal(corrigirProva(dia,sete,versao).aprovado,true);
    const seis=certas.map((x,i)=>i<2?(x+1)%4:x);
    assert.equal(corrigirProva(dia,seis,versao).aprovado,false);
  }
});

test("42 aulas editoriais, 43-90 planejadas e marcos protegidos",()=>{
  assert.equal(Object.keys(AULAS_PILOTO).length,42);
  for(let dia=1;dia<=90;dia++){
    const p=planoDia(dia);
    assert.equal(p.estado,dia<=42?"conteudo_para_revisao":"planejado");
    assert.equal(Boolean(p.conteudo),dia<=42);
  }
  assert.throws(()=>questoesPara(43),/não escrita/);
  assert.equal(avaliarMarco(60,{}).certificado,false);
  assert.equal(avaliarMarco(90,{}).certificado,false);
});

test("biblioteca isolada sem rede, persistência ou alteração do treinamento real",async()=>{
  const html=await readFile(new URL("../homologacao/trilha-90-dias.html",import.meta.url),"utf8");
  const src=await readFile(new URL("../modules/trilha-90-dias-aulas-40-42.mjs",import.meta.url),"utf8");
  assert.match(html,/aulas-piloto 1–42 completas/);
  assert.match(html,/Dias 43–90 continuam planejados/);
  assert.match(html,/não altera progresso, notas ou certificações reais/);
  assert.doesNotMatch(html+src,/supabase\.from\(|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|z-api|wa\.me\//i);
});
