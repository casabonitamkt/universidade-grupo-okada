import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AULAS_34_36 } from "../modules/trilha-90-dias-aulas-34-36.mjs";
import { AULAS_PILOTO, planoDia, questoesPara, corrigirProva, avaliarMarco, recomendacaoPorFalha } from "../modules/trilha-90-dias.mjs";

test("dias 34–36: três aulas completas com 24 questões distintas", () => {
  assert.deepEqual(Object.keys(AULAS_34_36).sort(), ["34","35","36"]);
  assert.equal(Object.keys(AULAS_PILOTO).length, 42);
  for(const dia of [34,35,36]) {
    const a=AULAS_34_36[dia],p=planoDia(dia);
    assert.equal(p.conteudo,a);
    assert.equal(p.estado,"conteudo_para_revisao");
    assert.equal(p.tempoPrevisto,15);
    assert.ok(a.objetivo.length>80);
    assert.equal(a.aprender.length,5);
    assert.ok(a.aprender.every(x=>x.length>=180));
    assert.ok(a.demonstrar.certo.length>50 && a.demonstrar.errado.length>50 && a.demonstrar.porQue.length>50);
    assert.ok(a.praticar.cenario.length>80 && a.praticar.tarefa.length>80);
    assert.equal(a.provar.criterios.length,6);
    assert.equal(a.provar.perguntas.length,8);
    assert.equal(new Set(a.provar.perguntas.map(q=>q[0])).size,8);
    for(const q of a.provar.perguntas) {
      assert.equal(q.length,5);
      assert.equal(new Set(q.slice(1)).size,4);
      assert.ok(q.every(Boolean));
    }
  }
});

test("90 dias planejados, 42 editoriais e futuros não publicados", () => {
  for(let dia=1;dia<=90;dia++) {
    const p=planoDia(dia);
    assert.equal(p.estado,dia<=42?"conteudo_para_revisao":"planejado");
    assert.equal(Boolean(p.conteudo),dia<=42);
  }
  assert.throws(()=>questoesPara(43),/não escrita/);
  assert.equal(recomendacaoPorFalha("arquiteto").disponibilidade,"conteudo_para_revisao");
});

test("provas 34–36: gabarito, reteste, aprovação, reprovação e entradas inválidas", () => {
  for(const dia of [34,35,36]) for(let versao=0;versao<8;versao++) {
    const q=questoesPara(dia,versao);
    assert.equal(q.length,8);
    const certas=q.map((item,i)=>{
      const correta=(versao+i)%4;
      assert.equal(item.alternativas[correta],AULAS_34_36[dia].provar.perguntas[i][1]);
      return correta;
    });
    assert.equal(corrigirProva(dia,certas,versao).nota,10);
    assert.equal(corrigirProva(dia,certas,versao).aprovado,true);
    const sete=certas.map((v,i)=>i===0?(v+1)%4:v);
    assert.equal(corrigirProva(dia,sete,versao).nota,8.8);
    assert.equal(corrigirProva(dia,sete,versao).aprovado,true);
    const seis=certas.map((v,i)=>i<2?(v+1)%4:v);
    assert.equal(corrigirProva(dia,seis,versao).nota,7.5);
    assert.equal(corrigirProva(dia,seis,versao).aprovado,false);
    assert.throws(()=>corrigirProva(dia,certas.slice(1),versao));
  }
  for(const marco of [30,60,90]) {
    assert.equal(avaliarMarco(marco,{}).certificado,false);
    const semGestor=Object.fromEntries(avaliarMarco(marco,{}).requisitos.map((_,i)=>["r"+i,true]));
    assert.equal(avaliarMarco(marco,semGestor).certificado,false);
  }
});

test("biblioteca 34–36 é editorial isolada, sem acesso a banco, CRM ou WhatsApp", async () => {
  const source=await readFile(new URL("../modules/trilha-90-dias-aulas-34-36.mjs",import.meta.url),"utf8");
  const html=await readFile(new URL("../homologacao/trilha-90-dias.html",import.meta.url),"utf8");
  assert.doesNotMatch(source,/supabase|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|z-api|whatsapp\.com/i);
  assert.match(html,/aulas-piloto 1–42 completas/);
  assert.match(html,/Dias 43–90 continuam planejados/);
  assert.match(html,/não altera progresso, notas ou certificações reais/);
});
