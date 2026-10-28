import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {AULAS_73_75} from '../modules/trilha-90-dias-aulas-73-75.mjs';
import {planoDia} from '../modules/trilha-90-dias.mjs';
test('73–75: três aulas completas, 15 blocos e 24 questões únicas',()=>{
 assert.deepEqual(Object.keys(AULAS_73_75),['73','74','75']);
 const perguntas=[];
 for(let dia=73;dia<=75;dia++){
  const a=AULAS_73_75[dia],plano=planoDia(dia);
  assert.equal(a.titulo,plano.titulo);
  assert.equal(plano.estado,'planejado');assert.equal(plano.conteudo,null);
  assert.ok(a.objetivo.length>=80);
  assert.equal(a.aprender.length,5);
  assert.ok(a.aprender.every(p=>p.length>=250));
  for(const key of ['certo','errado','porQue'])assert.ok(a.demonstrar[key].length>=60);
  assert.ok(a.praticar.cenario.length>=100);
  assert.ok(a.praticar.tarefa.length>=100);
  assert.equal(a.provar.criterios.length,6);
  assert.equal(a.provar.perguntas.length,8);
  for(const q of a.provar.perguntas){
   assert.equal(q.length,5);
   assert.equal(new Set(q.slice(1)).size,4);
   assert.ok(q.every(v=>typeof v==='string'&&v.length>0));
   perguntas.push(q);
  }
 }
 assert.equal(new Set(perguntas.map(q=>q[0])).size,24);
 assert.equal(new Set(perguntas.map(q=>q[1])).size,24);
});
test('73–75: conteúdo isolado, sem rede, banco, WhatsApp ou credenciais',async()=>{
 const src=await readFile(new URL('../modules/trilha-90-dias-aulas-73-75.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/supabase|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|service_role|z-api|zappy|wa\.me\//i);
});

test('73–75: demonstração mobile sem rede ou gravação de notas',async()=>{
 const html=await readFile(new URL('../homologacao/aulas-73-75.html',import.meta.url),'utf8');
 assert.match(html,/HOMOLOGAÇÃO EDITORIAL/);
 assert.match(html,/AULAS_73_75/);
 assert.match(html,/viewport/);
 assert.match(html,/corrigir/);
 assert.match(html,/refazer/);
 assert.match(html,/não concede certificação/);
 assert.match(html,/Nenhuma nota foi registrada/);
 assert.doesNotMatch(html,/supabase|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|service_role|z-api|zappy/i);
 for(let dia=73;dia<=75;dia++)assert.match(html,new RegExp('Dia '+dia+' — '+AULAS_73_75[dia].titulo));
});
