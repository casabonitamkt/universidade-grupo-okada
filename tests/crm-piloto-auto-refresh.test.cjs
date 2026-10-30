'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync(require('node:path').join(__dirname,'..','crm-piloto.html'),'utf8');
const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const js=inlineScripts.at(-1)?.[1];
assert.ok(js && js.includes('REFRESH_MS=15000'),'CRM deve conter script de atualização automática');

function harness(){
  const leads=[{id:'lead-1',display_name:'Cliente Um',phone:'5544999991111',stage:'novo'}];
  const messages={'lead-1':[{id:'msg-1',direction:'entrada',kind:'text',body:'Mensagem original',event_at:'2026-10-30T12:00:00Z'}]};
  const requests=[];
  const mediaCalls=[];
  const intervals=[];
  const documentListeners={};
  const windowListeners={};
  class Element {
    constructor(tag){this.isConnected=true;this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.className='';this.onclick=null;this._text='';this.listeners={};this.hidden=false;this.value='';this.style={};this.classList={toggle(){},add(){},remove(){}}}
    set textContent(value){this._text=String(value);this.children=[]}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
    setAttribute(name,value){this.attrs[name]=value}
    addEventListener(type,cb){this.listeners[type]=cb}
    replaceChildren(...children){this._text='';this.children=children}
    append(...children){this.children.push(...children)}
    querySelectorAll(tag){return this.children.filter(c=>c.tagName===tag.toUpperCase())}
  }
  const elements=new Map(['status','sync','sync-light','search','filter-stage','empty-search','contact-tools','lead-stage','lead-notes','save-notes','action-status','reply-whatsapp','send-panel','send-content','send-button','send-status','leads','title','messages'].map(id=>[id,new Element('div')]));
  const document={
    hidden:false,
    getElementById:id=>{if(!elements.has(id))elements.set(id,new Element('div'));return elements.get(id)},
    querySelectorAll:()=>[],
    querySelector:()=>new Element('div'),
    createElement:tag=>new Element(tag),
    addEventListener:(type,handler)=>{documentListeners[type]=handler}
  };
  const window={addEventListener:(type,handler)=>{windowListeners[type]=handler}};
  const navigator={onLine:true};
  const localStorage={getItem:()=>null,removeItem:()=>{}};
  const sessionStorage={getItem:()=>null,removeItem:()=>{}};
  const supabase={createClient:()=>({
    auth:{getUser:async()=>({data:{user:{id:'thiago-test'}},error:null}),getSession:async()=>({data:{session:{access_token:'unit-token'}},error:null})},
    from:table=>{
      const q={filter:null,
        updated:null,
        select(){return this},
        eq(column,value){this.filter={column,value};return this},
        update(data){this.updated=data;return this},
        async single(){
          if(table!=='crm_pilot_leads'||!this.updated)throw Error('Unexpected single()');
          const lead=leads.find(l=>l.id===this.filter.value);
          if(!lead)return {data:null,error:{message:'Contato não encontrado'}};
          Object.assign(lead,this.updated);
          return {data:{id:lead.id,stage:lead.stage,notes:lead.notes||''},error:null};
        },
        order(column,options){this.orderColumn=column;this.ascending=options?.ascending!==false;return this},
        limit(max){requests.push({table,filter:this.filter});
          if(table==='crm_pilot_leads')return Promise.resolve({data:leads.map(l=>({...l})),error:null});
          if(table==='crm_pilot_messages'){
            const items=(messages[this.filter.value]||[]).map(m=>({...m}));
            items.sort((a,b)=>(this.ascending?1:-1)*(new Date(a.event_at)-new Date(b.event_at)));
            return Promise.resolve({data:items.slice(0,max),error:null});
          }
          throw new Error('Tabela não esperada: '+table);
        }};
      return q;
    }
  })};
  const context={supabase,document,window,navigator,localStorage,sessionStorage,
    URL:{createObjectURL:()=> 'blob:media-test',revokeObjectURL:()=>{}},
    fetch:async(path)=>{if(String(path).startsWith('/api/crm-media?')){
      mediaCalls.push(String(path));return {ok:true,blob:async()=>({size:64})};
    }return {json:async()=>({enabled:false})}},
    setInterval:(cb,ms)=>{intervals.push({cb,ms});return 1},
    console,Date,setTimeout:(cb)=>{cb();return 1}};
  vm.runInNewContext(js,context,{filename:'crm-piloto.html'});
  return {elements,leads,messages,requests,intervals,document,documentListeners,windowListeners,mediaCalls};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('abre caixa de entrada e registra atualização periódica de 15 segundos',async()=>{
  const h=harness();await settle();
  assert.equal(h.intervals.length,1);
  assert.equal(h.intervals[0].ms,15000);
  assert.match(h.elements.get('status').textContent,/1 contato/);
  assert.equal(h.elements.get('leads').children.length,1);
  assert.match(h.elements.get('sync').textContent,/Última checagem/);
});

test('adiciona novas mensagens automaticamente mantendo o contato selecionado e as mensagens anteriores',async()=>{
  const h=harness();await settle();
  h.elements.get('leads').children[0].onclick();await settle();
  const messagesEl=h.elements.get('messages');
  assert.equal(messagesEl.children.length,1);
  const existing=messagesEl.children[0];
  h.messages['lead-1'].push({id:'msg-2',direction:'entrada',kind:'text',body:'Nova mensagem sem clicar',event_at:'2026-10-30T12:01:00Z'});
  h.intervals[0].cb();await settle();
  assert.equal(messagesEl.children.length,2);
  assert.equal(messagesEl.children[0],existing,'Mensagem anterior deve preservar seu nó sem piscar');
  assert.match(messagesEl.children[1].textContent,/Nova mensagem sem clicar/);
  assert.equal(h.elements.get('leads').children[0].attrs['aria-pressed'],'true');
});

test('consulta novos contatos periodicamente sem redefinir conversa existente',async()=>{
  const h=harness();await settle();
  h.elements.get('leads').children[0].onclick();await settle();
  const existing=h.elements.get('messages').children[0];
  h.leads.unshift({id:'lead-2',display_name:'Cliente Dois',phone:'5544999992222',stage:'novo'});
  h.intervals[0].cb();await settle();
  assert.match(h.elements.get('status').textContent,/2 contato/);
  assert.equal(h.elements.get('leads').children.length,2);
  assert.equal(h.elements.get('leads').children[1].attrs['aria-pressed'],'true');
  assert.equal(h.elements.get('messages').children[0],existing);
});

test('pausa atualização com aba oculta e retoma quando ela volta ao primeiro plano',async()=>{
  const h=harness();await settle();
  const before=h.requests.length;
  h.document.hidden=true;h.intervals[0].cb();await settle();
  assert.equal(h.requests.length,before);
  h.document.hidden=false;h.documentListeners.visibilitychange();await settle();
  assert.ok(h.requests.length>before);
});

test('atualiza automaticamente sem exibir botão manual',async()=>{
  const h=harness();await settle();
  assert.ok(!html.includes('id="reload"'));
  const before=h.requests.length;
  h.intervals[0].cb();await settle();
  assert.ok(h.requests.length>before);
});

test('busca contatos por nome sem alterar a conversa aberta',async()=>{
  const h=harness();await settle();
  h.leads.push({id:'lead-2',display_name:'Outra Pessoa',phone:'5544999992222',stage:'novo'});
  h.intervals[0].cb();await settle();
  h.elements.get('leads').children[0].onclick();await settle();
  const selected=h.elements.get('messages').children[0];
  const search=h.elements.get('search');
  search.value='outra';search.listeners.input();
  assert.equal(h.elements.get('leads').children[0].hidden,true);
  assert.equal(h.elements.get('leads').children[1].hidden,false);
  assert.equal(h.elements.get('empty-search').hidden,true);
  search.value='inexistente';search.listeners.input();
  assert.equal(h.elements.get('empty-search').hidden,false);
  search.value='';search.listeners.input();
  assert.equal(h.elements.get('leads').children[0].hidden,false);
  assert.equal(h.elements.get('messages').children[0],selected);
});

test('layout desktop em três colunas e adaptação ao celular',()=>{
  assert.match(html,/grid-template-columns:minmax\(230px,25%\) minmax\(350px,1fr\) minmax\(240px,24%\)/);
  assert.match(html,/@media\(max-width:740px\)/);
  assert.match(html,/\.layout\{display:flex;flex-direction:column/);
  assert.match(html,/class="box contacts-box"/);
  assert.match(html,/class="box conversation-box"/);
  assert.match(html,/class="box details-box"/);
  assert.ok(!html.includes('id="reload"'));
});
test('bolhas à esquerda para cliente e à direita para consultor',async()=>{
  const h=harness();await settle();
  h.messages['lead-1'].push({id:'msg-out',direction:'saida',kind:'text',body:'Retorno ao cliente',event_at:'2026-10-30T12:01:00Z'});
  h.elements.get('leads').children[0].onclick();await settle();
  const bubbles=h.elements.get('messages').children;
  assert.match(bubbles[0].className,/from-client/);
  assert.match(bubbles[1].className,/from-consultant/);
  assert.match(bubbles[1].textContent,/Retorno ao cliente/);
});
test('tecla Enter envia e Shift+Enter preserva quebra de linha',async()=>{
  const h=harness();await settle();
  const cb=h.elements.get('send-content').listeners.keydown;
  assert.equal(typeof cb,'function');
  let prevented=false;
  cb({key:'Enter',shiftKey:true,isComposing:false,preventDefault(){prevented=true}});
  assert.equal(prevented,false);
  cb({key:'Enter',shiftKey:false,isComposing:false,preventDefault(){prevented=true}});
  assert.equal(prevented,true);
});


test('etapa e observações são gravadas somente no contato selecionado',async()=>{
  const h=harness();await settle();
  h.elements.get('leads').children[0].onclick();await settle();
  const stage=h.elements.get('lead-stage');
  stage.value='proposta';
  await stage.listeners.change();await settle();
  assert.equal(h.leads[0].stage,'proposta');
  const notes=h.elements.get('lead-notes');
  notes.value='Retornar ao cliente sobre o orçamento';
  await h.elements.get('save-notes').listeners.click();await settle();
  assert.equal(h.leads[0].notes,'Retornar ao cliente sobre o orçamento');
  assert.match(h.elements.get('action-status').textContent,/salva/);
  assert.equal(h.elements.get('contact-tools').hidden,false);
});

test('filtra por etapa sem perder a conversa selecionada',async()=>{
  const h=harness();await settle();
  h.leads.push({id:'lead-2',display_name:'Cliente Proposta',phone:'5544999992222',stage:'proposta'});
  h.intervals[0].cb();await settle();
  h.elements.get('leads').children[0].onclick();await settle();
  const filter=h.elements.get('filter-stage');
  filter.value='proposta';filter.listeners.change();
  assert.equal(h.elements.get('leads').children[0].hidden,true);
  assert.equal(h.elements.get('leads').children[1].hidden,false);
  assert.equal(h.elements.get('contact-tools').hidden,false);
});

test('legendas de mídia são apresentadas sem chaves de mídia no navegador',async()=>{
  const h=harness();await settle();
  h.messages['lead-1']=[{id:'media-1',direction:'entrada',kind:'image',body:'Foto do sofá',media_name:'sofa.jpg',event_at:'2026-10-30T13:00:00Z'}];
  h.elements.get('leads').children[0].onclick();await settle();
  const item=h.elements.get('messages').children[0].textContent;
  assert.match(item,/Imagem recebida/);
  assert.match(item,/Foto do sofá/);
  assert.match(item,/sofa.jpg/);
});

test('imagem e áudio aparecem automaticamente ao chegar, sem clicar em abrir',async()=>{
  const h=harness();await settle();
  h.elements.get('leads').children[0].onclick();await settle();
  h.messages['lead-1'].push(
    {id:'media-img',direction:'entrada',kind:'image',body:'',event_at:'2026-10-30T12:02:00Z'},
    {id:'media-audio',direction:'entrada',kind:'audio',body:'',event_at:'2026-10-30T12:03:00Z'}
  );
  h.intervals[0].cb();
  for(let i=0;i<5;i++)await settle();
  const items=h.elements.get('messages').children;
  assert.equal(items.length,3);
  assert.ok(items[1].children.some(n=>n.tagName==='IMG'),'Foto deve ficar visível na conversa');
  const audio=items[2].children.find(n=>n.tagName==='AUDIO');
  assert.ok(audio,'Áudio deve aparecer sem clique');
  assert.equal(audio.controls,true,'Áudio precisa ter controle de reprodução');
  assert.equal(h.mediaCalls.length,2,'Cada mídia deve ser baixada uma vez');
  const image=items[1].children.find(n=>n.tagName==='IMG');
  h.intervals[0].cb();await settle();
  assert.equal(h.mediaCalls.length,2,'Atualização não deve baixar a mesma mídia novamente');
  assert.equal(h.elements.get('messages').children[1].children.find(n=>n.tagName==='IMG'),image);
});

test('CRM ocupa largura do notebook e mantém painéis sem largura mínima excessiva',()=>{
  assert.match(html,/\.header-inner,main\{width:100%;max-width:100%;margin:0\}/);
  assert.match(html,/\.layout\{width:100%;grid-template-columns:minmax\(205px,23%\) minmax\(0,1fr\) minmax\(220px,23%\)/);
  assert.match(html,/@media\(max-width:1100px\)/);
  assert.match(html,/@media\(max-width:740px\)/);
});
test('botão de tela cheia acessível e reversível, sem acionamento automático',()=>{
  assert.match(html,/id="fullscreen-toggle"[^>]+aria-label="Expandir CRM em tela cheia"/);
  assert.match(html,/fullscreenToggle\.addEventListener\('click',async\(\)=>/);
  assert.match(html,/document\.documentElement\.requestFullscreen\(\)/);
  assert.match(html,/document\.exitFullscreen\(\)/);
  assert.match(html,/document\.addEventListener\('fullscreenchange'/);
});


test('Universidade apresenta CRM no menu lateral e no menu móvel, com navegação no mesmo domínio',()=>{
  const university=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
  assert.match(university,/items\.splice\(1,0,\{id:'crm',icon:'▣',label:isCrmMaster\(\)\?'CRM · Master':'CRM · Atendimentos'\}\)/);
  assert.match(university,/\{id:'crm',icon:'▣',label:isCrmMaster\(\)\?'CRM · Master':'CRM · Atendimentos'\}/);
  assert.match(university,/if\(id==='crm'\)\{window\.location\.assign\(isCrmMaster\(\)\?'\/crm-master\.html':'\/crm-piloto\.html'\);return\}/);
  assert.match(university,/id="nav" class="nav"/);
  assert.match(university,/id="mobileNav" class="mobileNav"/);
  assert.match(university,/id="crmHomeShortcut"/);
  assert.match(university,/id="openCrmFromHome" onclick="showSec\('crm'\)"/);
  assert.match(university,/ABRIR MEU CRM/);
});

test('CRM premium oferece menu, visão geral, follow-up e resultados sem dados fictícios',()=>{
  for(const view of ['inicio','conversas','leads','clientes','propostas','followup','resultados']){
    assert.match(html,new RegExp('data-crm-view="'+view+'"'));
  }
  assert.match(html,/id="overview"/);
  assert.match(html,/id="followup-panel"/);
  assert.match(html,/id="results-panel"/);
  assert.match(html,/id="suggestion-copy"/);
  assert.match(html,/CRM de Vendas/);
  assert.match(html,/CASA BONITA \| SIERRA/);
  assert.match(html,/Conversão por valor/);
  assert.match(html,/Aguardando integração de propostas e vendas/);
  assert.match(html,/\.crm-sidebar\{position:fixed/);
});
test('indicadores premium derivam de contatos reais, não números de exemplo',async()=>{
  const h=harness();await settle();
  assert.equal(h.elements.get('result-total').textContent,'1');
  assert.equal(h.elements.get('kpi-active').textContent,'1');
  assert.equal(h.elements.get('kpi-won').textContent,'0');
  assert.equal(h.elements.get('result-conversion').textContent,'0%');
  h.leads.push({id:'lead-2',display_name:'Cliente Dois',phone:'5544999992222',stage:'ganho'});
  h.intervals[0].cb();await settle();
  assert.equal(h.elements.get('result-total').textContent,'2');
  assert.equal(h.elements.get('kpi-won').textContent,'1');
  assert.equal(h.elements.get('result-conversion').textContent,'50%');
});
test('seleção de contato atualiza sugestão sem enviar mensagem',async()=>{
  const h=harness();await settle();
  h.elements.get('leads').children[0].onclick();await settle();
  assert.match(h.elements.get('suggestion-text').textContent,/Olá! Sou seu consultor da Casa Bonita/);
  assert.equal(h.elements.get('suggestion-copy').disabled,false);
});

test('follow-ups aparecem em destaque na primeira tela com cores e navegação',()=>{
  assert.match(html,/id="followup-alerts"/);
  assert.match(html,/id="followup-home-24"/);
  assert.match(html,/id="followup-home-72"/);
  assert.match(html,/id="followup-home-168"/);
  assert.match(html,/class="followup-alert-card warning"/);
  assert.match(html,/class="followup-alert-card urgent"/);
  assert.match(html,/class="followup-alert-card critical"/);
  assert.match(html,/id="open-followup-alerts"/);
  assert.ok(html.indexOf('id="followup-alerts"')<html.indexOf('class="overview-actions"'),'Alertas devem ficar acima da central de conversas');
});
test('alertas classificam contatos por inatividade sem inventar pendências',async()=>{
  const h=harness();await settle();
  const ago=days=>new Date(Date.now()-days*86400000).toISOString();
  h.leads[0].last_message_at=ago(2);
  h.leads.push(
    {id:'lead-2',display_name:'Cliente 4 dias',phone:'5544999992222',stage:'proposta',last_message_at:ago(4)},
    {id:'lead-3',display_name:'Cliente 9 dias',phone:'5544999993333',stage:'negociacao',last_message_at:ago(9)},
    {id:'lead-4',display_name:'Venda encerrada',phone:'5544999994444',stage:'ganho',last_message_at:ago(15)},
    {id:'lead-5',display_name:'Sem mensagem',phone:'5544999995555',stage:'novo'}
  );
  h.intervals[0].cb();await settle();
  assert.equal(h.elements.get('followup-home-24').textContent,'1');
  assert.equal(h.elements.get('followup-home-72').textContent,'1');
  assert.equal(h.elements.get('followup-home-168').textContent,'1');
  assert.equal(h.elements.get('followup-total').textContent,'3');
  assert.equal(h.elements.get('fu-24-count').textContent,'1');
  assert.equal(h.elements.get('fu-3-count').textContent,'1');
  assert.equal(h.elements.get('fu-7-count').textContent,'1');
  assert.equal(h.elements.get('followup-alert-quicklist').children.length,3);
  assert.match(h.elements.get('followup-alert-quicklist').children[0].textContent,/Cliente 9 dias/);
});
test('contatos sem mensagem ou encerrados não geram falsos alertas de follow-up',async()=>{
  const h=harness();await settle();
  assert.equal(h.elements.get('followup-total').textContent,'0');
  assert.equal(h.elements.get('followup-home-168').textContent,'0');
  assert.match(h.elements.get('followup-alert-summary').textContent,/Nenhum contato/);
});
