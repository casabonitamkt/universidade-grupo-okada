import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../crm-piloto.html',import.meta.url),'utf8');
const js=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const source=js.slice(js.indexOf('function redactCrmContext'),js.indexOf('function updateSuggestion'));

test('JavaScript inline do CRM compila',()=>{
  assert.doesNotThrow(()=>new Function(js));
});
test('Copiloto só chama IA após clique e não envia WhatsApp automaticamente',()=>{
  assert.match(html,/id="ai-generate"/);
  assert.match(js,/el\('ai-generate'\)\.addEventListener\('click'/);
  assert.match(js,/sb\.functions\.invoke\('crm-copiloto-homologacao'/);
  assert.match(html,/A IA não envia mensagens/);
  assert.doesNotMatch(source,/fetch\(|sendWhatsApp\(/);
});
test('Contexto contém etapa e histórico sem telefone, CPF, e-mail ou links',()=>{
  const {buildCopilotBriefing}=new Function('STAGE_LABELS','renderedMessages',source+';return {buildCopilotBriefing}')(
    {proposta:'Proposta enviada'},
    [{direction:'entrada',content:'Quero sofá Sierra; meu contato é 41999998888, ana@example.com, CPF 123.456.789-09. Veja https://example.com/teste'},
     {direction:'saida',content:'Pode mandar uma foto?'},
     {direction:'entrada',content:'📷 Imagem recebida'}]
  );
  const briefing=buildCopilotBriefing({stage:'proposta',notes:'Aguardando decisão sobre sofá'});
  assert.match(briefing,/Proposta enviada/);
  assert.match(briefing,/sofá Sierra/);
  assert.match(briefing,/Imagem recebida/);
  assert.doesNotMatch(briefing,/41999998888|ana@example.com|123\.456\.789-09|https:\/\//);
  assert.ok(briefing.length<=4400);
});
test('Mensagem sugerida é separada do diagnóstico antes de copiar',()=>{
  assert.match(js,/analysis\.match\(\/Mensagem para WhatsApp:/);
  assert.match(js,/el\('suggestion-text'\)\.textContent=message/);
  assert.match(js,/el\('suggestion-copy'\)\.disabled=false/);
});
