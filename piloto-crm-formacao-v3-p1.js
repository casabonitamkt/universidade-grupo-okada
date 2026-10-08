
'use strict';
const $=id=>document.getElementById(id),key='grupo_okada_piloto_local_v1';
const stages={lead:'Lead',diagnostico:'Diagnóstico/Projeto',projeto:'Projeto recebido/Orçamento',proposta:'Proposta',followup:'Follow-up',negociacao:'Negociação',venda:'Venda',perda:'Perda'};
const fields=['client','owner','store','city','kind','architect','source','stage','proposed','closed','next','last','brief','loss'];
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function dayShift(n){const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function examples(){return [
{id:'ex1',client:'Cliente Exemplo A',owner:'Thiago (piloto)',store:'Casa Bonita Móveis',city:'Umuarama',kind:'projeto',architect:'',source:'WhatsApp',stage:'proposta',proposed:'58000',closed:'',next:dayShift(-2),last:dayShift(-4),brief:'Cliente quer mobiliar sala, mas ainda não enviou projeto nem medidas.',loss:'',approved:false},
{id:'ex2',client:'Cliente Exemplo B',owner:'Thiago (piloto)',store:'Móveis Modernos',city:'Dourados',kind:'peca',architect:'Arquiteta Exemplo',source:'Arquiteto',stage:'negociacao',proposed:'18000',closed:'',next:dayShift(1),last:today(),brief:'Cliente busca uma peça. Confirmar prazo e medidas.',loss:'',approved:false},
{id:'ex3',client:'Cliente Exemplo C',owner:'Consultora A (exemplo)',store:'Casa Bonita Móveis',city:'Maringá',kind:'projeto',architect:'',source:'Instagram',stage:'followup',proposed:'95000',closed:'',next:dayShift(-1),last:dayShift(-3),brief:'Projeto de três ambientes, sem orçamento informado.',loss:'',approved:false}];}
let rows;try{rows=JSON.parse(sessionStorage.getItem(key)||'null');if(!Array.isArray(rows))rows=examples()}catch(e){rows=examples()}
function persist(){try{sessionStorage.setItem(key,JSON.stringify(rows))}catch(e){/* modo sem armazenamento: permanece na memória desta página */}}
function recordFromForm(){const id=$('lead-id').value||'p'+Date.now(),old=rows.find(r=>r.id===id),r={id,approved:old?!!old.approved:false};fields.forEach(f=>r[f]=$(f).value.trim());if(old&&old.stage!=='perda'&&r.stage==='perda')r.approved=false;return r}
function fill(r){$('lead-id').value=r.id;fields.forEach(f=>$(f).value=r[f]||'');$('save-state').textContent='Editando oportunidade fictícia.';document.querySelector('[data-tab="crm"]').click();window.scrollTo({top:0,behavior:'smooth'})}
function clearForm(){$('lead-form').reset();$('lead-id').value='';$('save-state').textContent='Novo atendimento fictício.'}
function priority(r){return (r.next&&r.next<today()?100:0)+({negociacao:30,followup:20,proposta:10}[r.stage]||0)+Math.min(Number(r.proposed||0)/10000,20)}
function recovery(r){return ['proposta','followup','negociacao'].includes(r.stage)}
function render(){const open=rows.filter(r=>!['venda','perda'].includes(r.stage)),won=rows.filter(r=>r.stage==='venda'),lost=rows.filter(r=>r.stage==='perda'&&!r.approved);
$('stats').innerHTML=[['Oportunidades ativas',open.length],['Potencial aberto',money(open.reduce((a,r)=>a+Number(r.proposed||0),0))],['Vendas (fictícias)',money(won.reduce((a,r)=>a+Number(r.closed||0),0))],['Perdas pendentes',lost.length]].map(x=>'<div class="stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
$('recovery-body').innerHTML=rows.filter(recovery).sort((a,b)=>priority(b)-priority(a)).map((r,i)=>'<tr><td>'+(i+1)+' · '+(r.next&&r.next<today()?'<span class="danger">Vencido</span>':'<span class="warn">Em dia</span>')+'</td><td>'+esc(r.client)+'</td><td>'+esc(stages[r.stage])+'</td><td>'+esc(r.next||'Sem data')+'</td><td>'+money(r.proposed)+'</td><td><button data-action="prepare" data-id="'+esc(r.id)+'">Preparar</button></td></tr>').join('')||'<tr><td colspan="6">Sem oportunidades nesta etapa.</td></tr>';
$('pipeline-body').innerHTML=rows.map(r=>'<tr><td><b>'+esc(r.client)+'</b><br><small>'+esc(r.city)+'</small></td><td>'+esc(r.owner)+'<br><small>'+esc(r.store)+'</small></td><td><select data-action="stage" data-id="'+esc(r.id)+'">'+Object.keys(stages).map(k=>'<option value="'+k+'"'+(r.stage===k?' selected':'')+'>'+stages[k]+'</option>').join('')+'</select></td><td>'+money(r.proposed)+'</td><td>'+esc(r.next||'Não definido')+'</td><td><button class="secondary" data-action="edit" data-id="'+esc(r.id)+'">Editar</button> <button data-action="prepare" data-id="'+esc(r.id)+'">Copiloto</button></td></tr>').join('');
$('loss-body').innerHTML=rows.filter(r=>r.stage==='perda').map(r=>'<tr><td>'+esc(r.client)+'</td><td>Perda</td><td>'+esc(r.loss||'Não informado')+'</td><td>'+(r.approved?'<span class="good">Validada no piloto</span>':'<span class="warn">Pendente</span>')+'</td><td>'+(r.approved?'—':'<button data-action="approve" data-id="'+esc(r.id)+'">Validar (demo)</button>')+'</td></tr>').join('')||'<tr><td colspan="5">Nenhuma perda fictícia.</td></tr>';
$('manager-summary').textContent='Oportunidades fictícias: '+rows.length+' · Perdas aguardando validação: '+lost.length+' · Não representa acesso gerencial real.';
}
