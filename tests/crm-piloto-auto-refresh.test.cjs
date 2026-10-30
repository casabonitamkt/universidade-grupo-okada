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
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.className='';this.onclick=null;this._text=''}
    set textContent(value){this._text=String(value);this.children=[]}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
    setAttribute(name,value){this.attrs[name]=value}
    replaceChildren(...children){this._text='';this.children=children}
    append(...children){this.children.push(...children)}
    querySelectorAll(tag){return this.children.filter(c=>c.tagName===tag.toUpperCase())}
  }
  const elements=new Map(['status','sync','reload','leads','title','messages'].map(id=>[id,new Element('div')]));
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
        select(){return this},
        eq(column,value){this.filter={column,value};return this},
        order(){return this},
        limit(){requests.push({table,filter:this.filter});
          if(table==='crm_pilot_leads')return Promise.resolve({data:leads.map(l=>({...l})),error:null});
          if(table==='crm_pilot_messages')return Promise.resolve({data:(messages[this.filter.value]||[]).map(m=>({...m})),error:null});
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

test('botão manual permanece disponível para checagem imediata',async()=>{
  const h=harness();await settle();
  const before=h.requests.length;
  h.elements.get('reload').onclick();await settle();
  assert.ok(h.requests.length>before);
});
