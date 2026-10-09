/* V33 - CRM demonstrativo isolado, sem Supabase, sem envio ou preços automatizados */
(function(){
'use strict';
if(window.CBV33)return;
const $=id=>document.getElementById(id);
const stages=['Lead','Diagnóstico/Projeto','Projeto recebido/Orçamento','Proposta','Follow-up','Negociação','Venda','Perda'];
const records=[];let selected=null,managerMode=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');style.textContent='#v33crm{margin-top:18px}#v33crm input,#v33crm select,#v33crm textarea{width:100%;padding:10px;background:#15171d;border:1px solid #52545b;color:#fff;border-radius:8px}#v33crm label{display:block;margin:9px 0;font-size:13px}#v33crm .v33grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}#v33crm .v33board{display:grid;grid-template-columns:repeat(4,minmax(190px,1fr));gap:10px;overflow-x:auto}#v33crm .v33stage{background:#121318;border:1px solid #484a51;border-radius:10px;padding:10px;min-height:90px}#v33crm .v33lead{padding:10px;background:#25252d;border-radius:8px;margin:8px 0;cursor:pointer}#v33crm .v33lead:focus{outline:2px solid #f2c46b}#v33crm .v33note{border-left:3px solid #d9b06b;padding:9px;background:#262017}#v33crm .v33actions{display:flex;flex-wrap:wrap;gap:8px}#v33crm .v33actions button{padding:9px;border-radius:8px;border:1px solid #8a6060;background:#311e22;color:white;cursor:pointer}#v33crm .v33result{white-space:pre-wrap;line-height:1.55}#v33crm .v33tag{font-size:11px;color:#ffde9b}@media(max-width:720px){#v33crm .v33grid{grid-template-columns:1fr}#v33crm .v33board{grid-template-columns:repeat(8,minmax(170px,1fr))}}';document.head.append(style);
const crm=$('crm');if(!crm)return;
const host=document.createElement('article');host.id='v33crm';host.className='card';crm.append(host);
host.innerHTML='<p class="kicker">V33 · DEMONSTRAÇÃO EM MEMÓRIA</p><h2>Pipeline completo + copiloto formativo</h2><p class="mut">Use somente informações fictícias. Nenhum dado é enviado ou salvo em banco; não há envio de WhatsApp, concessão de desconto ou distribuição automática de leads.</p><div class="v33actions"><button type="button" id="v33new">Nova oportunidade fictícia</button><button type="button" id="v33manager">Visualizar como gestor (simulação)</button></div><div id="v33board" class="v33board" aria-label="Etapas do funil"></div><div id="v33form" hidden></div><div id="v33metrics"></div>';
const fields=[['responsavel','Responsável'],['loja','Loja'],['cidade','Cidade'],['tipo','Projeto x peça'],['arquiteto','Arquiteto'],['origem','Origem'],['briefing','Briefing autorizado'],['valorProposto','Valor proposto (R$)'],['proximo','Próximo contato'],['ultima','Última interação'],['valorFechado','Valor fechado (R$)'],['motivo','Motivo de perda']];
const inputs={};
function form(){
 const box=$('v33form');box.hidden=false;box.replaceChildren();
 const h=document.createElement('h3');h.textContent=selected?'Editar oportunidade fictícia':'Nova oportunidade fictícia';box.append(h);
 const grid=document.createElement('div');grid.className='v33grid';box.append(grid);
 for(const [key,title] of fields){
  const lab=document.createElement('label');lab.textContent=title;
  let inp=key==='briefing'?document.createElement('textarea'):key==='tipo'||key==='loja'?document.createElement('select'):document.createElement('input');
  inp.id='v33-'+key;
  if(key==='tipo'){for(const v of ['Projeto completo','Peça avulsa'])inp.add(new Option(v,v))}
  else if(key==='loja'){for(const v of ['Casa Bonita Móveis','Móveis Modernos','Sierra Umuarama'])inp.add(new Option(v,v))}
  else if(['valorProposto','valorFechado'].includes(key)){inp.type='number';inp.min='0';inp.step='0.01'}
  else if(['proximo','ultima'].includes(key))inp.type='date';
  else if(key!=='briefing')inp.type='text';
  inp.value=selected?.[key]||'';lab.append(inp);grid.append(lab);inputs[key]=inp;
 }
 const lab=document.createElement('label');lab.textContent='Etapa comercial';const sel=document.createElement('select');sel.id='v33-stage';for(const s of stages)sel.add(new Option(s,s));sel.value=selected?.stage||stages[0];lab.append(sel);box.append(lab);
 const consent=document.createElement('label');consent.innerHTML='<input id="v33-consent" type="checkbox" style="width:auto"> Autorizo analisar SOMENTE os dados fictícios desta oportunidade nesta demonstração';box.append(consent);
 const buttons=document.createElement('div');buttons.className='v33actions';box.append(buttons);
 for(const [id,txt,fn] of [['v33save','Salvar somente nesta página',save],['v33analyze','Analisar e recomendar estudo',analyze],['v33cancel','Fechar',()=>{box.hidden=true}]]){
  const b=document.createElement('button');b.id=id;b.type='button';b.textContent=txt;b.onclick=fn;buttons.append(b)
 }
 const out=document.createElement('div');out.id='v33out';out.className='v33result';out.setAttribute('aria-live','polite');box.append(out);
 box.scrollIntoView({behavior:'smooth',block:'start'});
}
function collect(){const r={id:selected?.id||('demo-'+(records.length+1)),stage:$('v33-stage').value};for(const [k] of fields)r[k]=inputs[k].value.trim();return r}
function save(){
 const r=collect(),out=$('v33out');
 if(!r.responsavel||!r.loja||!r.cidade){out.textContent='Preencha responsável, loja e cidade.';return false}
 if(r.stage==='Perda'&&!managerMode){r.stage='Negociação';r.lossPending=true;out.textContent='Perda solicitada para validação gerencial; etapa mantida em Negociação nesta simulação.'}
 else if(r.stage==='Perda'&&!r.motivo){out.textContent='Informe o motivo antes da validação gerencial.';return false}
 else{r.lossPending=false;out.textContent='Registro atualizado somente na memória desta página.'}
 const i=records.findIndex(x=>x.id===r.id);if(i>=0)records[i]=r;else records.push(r);
 selected=r;render();return true
}
function dateLate(d){return d&&d<new Date().toISOString().slice(0,10)}
function diagnose(r){
 const missing=[];if(!r.briefing)missing.push('briefing');if(!r.proximo&&!['Venda','Perda'].includes(r.stage))missing.push('próximo contato');if(!r.ultima)missing.push('última interação');
 if(r.tipo==='Projeto completo'&&!/projeto (recebido|enviado|anexado)|planta recebida|foto recebida/i.test(r.briefing))missing.push('confirmar recebimento do projeto/fotos e medidas');
 if(!r.arquiteto)missing.push('participação de arquiteto');if(!r.valorProposto&&['Proposta','Follow-up','Negociação'].includes(r.stage))missing.push('valor proposto');
 let day=3,skill='Diagnóstico e briefing';if(r.stage==='Negociação'||/contraproposta|desconto|condição comercial/i.test(r.briefing)){day=45;skill='Negociação e limites de alçada'}else if(['Proposta','Follow-up'].includes(r.stage)||dateLate(r.proximo)){day=22;skill='Follow-up e recuperação'}else if(/arquiteto/i.test(r.briefing)){day=32;skill='Alinhamento com arquitetos'}
 let response='Olá! Para indicar uma opção adequada ao seu ambiente, você poderia compartilhar o projeto ou fotos com medidas? Também gostaria de confirmar a cidade, o prazo e se há arquiteto acompanhando.';
 if(day===22)response='Olá! Retomo nossa proposta para saber se surgiu alguma dúvida sobre o projeto ou os ambientes. Podemos combinar um horário para revisar os pontos que faltam para sua decisão?';
 if(day===45)response='Entendi a condição que você busca. Poderia me encaminhar sua contraproposta? Se eu conseguir validar essa condição, ou algo próximo, conseguimos concluir a proposta hoje? Vou submeter o pedido à direção e retorno após a análise.';
 return {missing,day,skill,response};
}
function analyze(){
 const out=$('v33out');if(!$('v33-consent').checked){out.textContent='Análise bloqueada: marque a autorização específica para os dados fictícios.';return}
 if(!save())return;const r=selected,{missing,day,skill,response}=diagnose(r);
 out.replaceChildren();
 const h=document.createElement('h4');h.textContent='Briefing de atendimento · análise por regras, NÃO IA generativa';out.append(h);
 const p=document.createElement('p');p.textContent='Etapa: '+r.stage+'. Responsável: '+r.responsavel+'. Loja: '+r.loja+'. Cidade: '+r.cidade+'. Tipo: '+r.tipo+'. Próxima ação: '+(r.proximo||'não registrada')+'.';out.append(p);
 const m=document.createElement('p');m.textContent=missing.length?'Pendências: '+missing.join('; ')+'.':'Campos básicos conferidos; validar sempre o conteúdo do projeto.';out.append(m);
 const k=document.createElement('p');k.textContent='Competência a revisar: '+skill+' · Dia '+day+'.';out.append(k);
 const msg=document.createElement('p');msg.textContent='Sugestão WhatsApp (revisar antes de usar): '+response;out.append(msg);
 const copy=document.createElement('button');copy.textContent='Copiar sugestão';copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(response);copy.textContent='Copiado'}catch(e){copy.textContent='Selecione e copie o texto acima'}};out.append(copy);
 const study=document.createElement('button');study.textContent='Abrir estudo recomendado';study.type='button';study.onclick=()=>{if(typeof window.openPlanDay==='function')window.openPlanDay(day);if(typeof window.tab==='function')window.tab('trilha')};out.append(study);
 const dia=$('dia');if(dia){let box=$('v33today');if(!box){box=document.createElement('div');box.id='v33today';box.className='card';dia.prepend(box)}box.replaceChildren();const hh=document.createElement('h3');hh.textContent='Meu Dia · estudo direcionado';const pp=document.createElement('p');pp.textContent='Após análise autorizada de um caso fictício: '+skill+' (Dia '+day+').';const b=document.createElement('button');b.className='btn';b.textContent='Revisar agora';b.onclick=study.onclick;box.append(hh,pp,b)}
}
function render(){
 const board=$('v33board');board.replaceChildren();
 for(const s of stages){const col=document.createElement('div');col.className='v33stage';const h=document.createElement('strong');h.textContent=s+' ('+records.filter(r=>r.stage===s).length+')';col.append(h);for(const r of records.filter(r=>r.stage===s)){const item=document.createElement('div');item.className='v33lead';item.tabIndex=0;item.textContent=(r.responsavel||'Sem responsável')+' · '+(r.cidade||'')+(r.lossPending?' · Perda aguardando gestor':'');item.onclick=()=>{selected=r;form()};item.onkeydown=e=>{if(e.key==='Enter')item.click()};col.append(item)}board.append(col)}
 const met=$('v33metrics');const won=records.filter(r=>r.stage==='Venda'),closed=won.reduce((a,r)=>a+Number(r.valorFechado||0),0),proposed=records.reduce((a,r)=>a+Number(r.valorProposto||0),0);
 met.textContent='Indicadores fictícios: '+records.length+' oportunidades · '+won.length+' vendas · R$ '+proposed.toLocaleString('pt-BR')+' propostos · R$ '+closed.toLocaleString('pt-BR')+' fechados · '+records.filter(r=>dateLate(r.proximo)&&!['Venda','Perda'].includes(r.stage)).length+' contatos vencidos.';
}
$('v33new').onclick=()=>{selected=null;form()};
$('v33manager').onclick=()=>{managerMode=!managerMode;$('v33manager').textContent=managerMode?'Modo gestor SIMULADO (clique para sair)':'Visualizar como gestor (simulação)';render()};
render();
window.CBV33={stages,records,diagnose,render,version:'33-demo'};
})();