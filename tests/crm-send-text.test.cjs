'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/crm-send-text.js');
const owner='ff819b24-a03e-4e24-a37b-8369db465fd9';
const other='8f819b24-a03e-4e24-a37b-8369db465fd9';
const leadId='b2a03fa1-aac1-45a1-9d9d-03f096c47efa';
const reqId='b3a03fa1-aac1-45a1-9d9d-03f096c47efa';
const instance='7f611f42-990f-4c6c-9493-e182de3c759a';
const vars={
  VERCEL_ENV:'production',ZAPPY_SEND_ENABLED:'true',ZAPPY_API_KEY:'unit-zappy-key',
  ZAPPY_INSTANCE_ID:instance,CRM_THIAGO_USER_ID:owner,
  SUPABASE_URL:'https://supabase-unit.invalid',
  SUPABASE_SERVICE_ROLE_KEY:'service-unit'
};
const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
const res=()=>({
  code:200,headers:{},
  setHeader(name,value){this.headers[name]=value;return this},
  status(code){this.code=code;return this},
  json(body){this.body=body;return this}
});
function setup(overrides={}){
  const oldEnv={};
  for(const [key,value] of Object.entries(vars)){
    oldEnv[key]=process.env[key];process.env[key]=value;
  }
  for(const [key,value] of Object.entries(overrides))process.env[key]=value;
  const previousFetch=globalThis.fetch;
  let apiPosts=0,outboxPosts=0,msgPosts=0,patched=[],sentTo=null;
  globalThis.fetch=async(url,options={})=>{
    const path=String(url);
    if(path.endsWith('/auth/v1/user')){
      assert.equal(options.headers.Authorization,'Bearer user-unit-jwt');
      return response(200,{id:owner});
    }
    if(path.includes('crm_pilot_leads?')){
      return response(200,[{id:leadId,phone:'5544999999999',source:'zapi',owner_consultant_id:owner}]);
    }
    if(path.endsWith('crm_pilot_outbox')&&options.method==='POST'){
      outboxPosts++;
      return response(201,[{id:'d2a03fa1-aac1-45a1-9d9d-03f096c47efa'}]);
    }
    if(path.includes('crm_pilot_outbox?')&&options.method==='PATCH'){
      patched.push(JSON.parse(options.body));
      return response(204,[]);
    }
    if(path.endsWith('crm_pilot_messages')&&options.method==='POST'){
      msgPosts++;
      assert.equal(JSON.parse(options.body).direction,'saida');
      return response(201,[]);
    }
    if(path.startsWith('https://zappy.api.br/v1/instances/')){
      apiPosts++;
      sentTo=JSON.parse(options.body);
      assert.equal(options.headers.Authorization,'Bearer unit-zappy-key');
      return response(200,{message_id:'3EB0TESTE1234567'});
    }
    throw Error('unexpected fetch '+path);
  };
  const makeReq=()=>({method:'POST',headers:{origin:'https://universidade-grupo-okada.vercel.app',authorization:'Bearer user-unit-jwt'},body:{
    lead_id:leadId,request_id:reqId,content:'Boa tarde, segue atendimento.'
  }});
  return {makeReq,restore(){
    globalThis.fetch=previousFetch;
    for(const [key,value] of Object.entries(oldEnv)){
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
    for(const key of Object.keys(overrides)){
      if(!Object.hasOwn(oldEnv,key))delete process.env[key];
    }
  },setFetch(fn){globalThis.fetch=fn},
  get counts(){return {apiPosts,outboxPosts,msgPosts,patched,sentTo}}};
}
test('desabilitado por padrão sem chave ou flag: não envia mensagens',async()=>{
  const s=setup({ZAPPY_SEND_ENABLED:'false'});
  try{
    const x=res();await handler({method:'GET',headers:{}},x);
    assert.equal(x.code,200);assert.equal(x.body.enabled,false);
    const post=res();await handler(s.makeReq(),post);
    assert.equal(post.code,503);
    assert.equal(s.counts.apiPosts,0);
  }finally{s.restore()}
});
test('bloqueia requisições de outra origem antes de consultar dados',async()=>{
  const s=setup();try{
    const req=s.makeReq();req.headers.origin='https://site-malicioso.invalid';
    const x=res();await handler(req,x);
    assert.equal(x.code,403);assert.equal(s.counts.apiPosts,0);
  }finally{s.restore()}
});
test('valida sessão e não envia se usuário não for proprietário autorizado',async()=>{
  const s=setup();try{
    s.setFetch(async url=>{
      if(String(url).endsWith('/auth/v1/user'))return response(200,{id:other});
      throw Error('Nao deveria consultar nada apos negar permissao');
    });
    const x=res();await handler(s.makeReq(),x);
    assert.equal(x.code,403);
  }finally{s.restore()}
});
test('envio autenticado gera outbox, envia texto e grava mensagem de saída',async()=>{
  const s=setup();try{
    const x=res();await handler(s.makeReq(),x);
    assert.equal(x.code,200);
    assert.equal(x.body.status,'sent');
    assert.deepEqual(s.counts.sentTo,{to:'5544999999999',type:'text',content:'Boa tarde, segue atendimento.'});
    assert.equal(s.counts.apiPosts,1);
    assert.equal(s.counts.outboxPosts,1);
    assert.equal(s.counts.msgPosts,1);
    assert.equal(s.counts.patched.at(-1).status,'sent');
  }finally{s.restore()}
});
test('pedido repetido não pode gerar segunda mensagem na Zappy',async()=>{
  const s=setup();try{
    s.setFetch(async(url,options)=>{
      const path=String(url);
      if(path.endsWith('/auth/v1/user'))return response(200,{id:owner});
      if(path.includes('crm_pilot_leads?'))
        return response(200,[{id:leadId,phone:'5544999999999',source:'zapi',owner_consultant_id:owner}]);
      if(path.endsWith('crm_pilot_outbox')&&options.method==='POST')return response(409,{});
      if(path.includes('crm_pilot_outbox?')&&(!options.method||options.method==='GET'))
        return response(200,[{status:'sent',lead_id:leadId}]);
      throw Error('Zappy nao pode ser chamado com idempotencia duplicada');
    });
    const x=res();await handler(s.makeReq(),x);
    assert.equal(x.code,200);assert.equal(x.body.status,'already_sent');
  }finally{s.restore()}
});
test('timeout de envio marca estado incerto, sem tentar enviar de novo',async()=>{
  const s=setup();try{
    const normal=globalThis.fetch;
    s.setFetch(async(url,options)=>{
      if(String(url).startsWith('https://zappy.api.br/'))throw Error('timeout');
      return normal(url,options);
    });
    const x=res();await handler(s.makeReq(),x);
    assert.equal(x.code,202);
    assert.equal(x.body.status,'unknown');
    assert.equal(s.counts.patched.at(-1).status,'unknown');
    assert.equal(s.counts.msgPosts,0);
  }finally{s.restore()}
});
test('não envia texto vazio ou sem identificador de requisição',async()=>{
  const s=setup();try{
    const request=s.makeReq();request.body.content=' ';
    const x=res();await handler(request,x);
    assert.equal(x.code,400);assert.equal(s.counts.apiPosts,0);
  }finally{s.restore()}
});

test('modo de homologação bloqueia destinatário diferente sem chamar Zappy',async()=>{
  const s=setup({CRM_SEND_TEST_ONLY_PHONE:'554497713832'});
  try{
    const x=res();await handler(s.makeReq(),x);
    assert.equal(x.code,403);
    assert.equal(x.body.error,'test_recipient_only');
    assert.equal(s.counts.apiPosts,0);
    assert.equal(s.counts.outboxPosts,0);
  }finally{s.restore()}
});
