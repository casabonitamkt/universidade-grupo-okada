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
  const intervals=[];
  const documentListeners={};
  const windowListeners={};
  class Element {
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.className='';this.onclick=null;this._text='';this.listeners={};this.hidden=false;this.value=''}
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
    getElementById:id=>elements.get(id),
    createElement:tag=>new Element(tag),
    addEventListener:(type,handler)=>{documentListeners[type]=handler}
  };
  const window={addEventListener:(type,handler)=>{windowListeners[type]=handler}};
  const navigator={onLine:true};
  const localStorage={getItem:()=>null,removeItem:()=>{}};
  const sessionStorage={getItem:()=>null,removeItem:()=>{}};
  const supabase={createClient:()=>({
    auth:{getUser:async()=>({data:{user:{id:'thiago-test'}},error:null})},
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
    setInterval:(cb,ms)=>{intervals.push({cb,ms});return 1},
    console,Date};
  vm.runInNewContext(js,context,{filename:'crm-piloto.html'});
  return {elements,leads,messages,requests,intervals,document,documentListeners,windowListeners};
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

test('layout desktop duas colunas e celular uma coluna, sem botões manuais',()=>{
  assert.match(html,/grid-template-columns:minmax\(285px,350px\) minmax\(0,1fr\)/);
  assert.match(html,/@media\(max-width:740px\)/);
  assert.match(html,/\.layout\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(html,/class="box contacts-box"/);
  assert.match(html,/class="box conversation-box"/);
  assert.ok(!html.includes('id="reload"'));
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
