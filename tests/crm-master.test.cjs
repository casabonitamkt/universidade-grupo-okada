'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const handler=require('../api/crm-master.js');
const html=fs.readFileSync(path.join(__dirname,'..','crm-master.html'),'utf8');
const BRUNO='4215da90-7c48-4c6b-bd96-af504c9557b5',FERNANDA='2846416e-03af-432d-b2d2-26431d5d069f';
const THIAGO='c6e732c0-30d8-4d70-85b1-573a853f71e8',MARKETING='b9354276-76f9-43f2-ae67-2af2a35e9a80';
const LEAD='11111111-1111-4111-8111-111111111111';
function mockRes(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(data){this.data=data;return this}}}
function harness(userId,view='summary',leadId){
  const oldEnv={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};
  process.env.SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='service-test';
  const oldFetch=global.fetch;const calls=[];
  global.fetch=async(url,opts)=>{
    calls.push({url:String(url),method:opts?.method||'GET'});
    const u=new URL(url);
    let data=[];
    if(u.pathname==='/auth/v1/user')data={id:userId};
    else if(u.pathname==='/rest/v1/profiles'&&u.searchParams.get('id'))data=[{id:userId,role:userId===BRUNO||userId===FERNANDA?'admin':'consultant'}];
    else if(u.pathname==='/rest/v1/profiles')data=[{id:THIAGO,full_name:'Thiago Gomes',store:'Sierra',role:'consultant'}];
    else if(u.pathname==='/rest/v1/crm_pilot_leads'&&u.searchParams.get('id'))data=leadId===LEAD?[{id:LEAD,owner_consultant_id:THIAGO}]:[];
    else if(u.pathname==='/rest/v1/crm_pilot_leads')data=[{id:LEAD,owner_consultant_id:THIAGO,display_name:'Cliente real',stage:'novo'}];
    else if(u.pathname==='/rest/v1/crm_pilot_messages')data=[{id:'m1',lead_id:LEAD,kind:'text',body:'Teste'}];
    return {ok:true,json:async()=>data};
  };
  return {calls,restore(){global.fetch=oldFetch;for(const [k,v] of Object.entries(oldEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v}},
    request:{method:'GET',headers:{authorization:'Bearer token-valid-12345'},query:{view,...(leadId?{lead_id:leadId}:{})}}};
}
test('CRM Master mantém interface de quatro consultores e acesso separado',()=>{
  assert.match(html,/CRM MASTER · DIRETORIA/);
  for(const view of ['overview','consultants','conversations','followup','results'])assert.match(html,new RegExp('data-view="'+view+'"'));
  assert.match(html,/id="kpi-consultants"/);
  assert.match(html,/id="overview-consultants"/);
  assert.match(html,/id="conversation-list"/);
  assert.match(html,/id="followup"/);
  assert.match(html,/id="result-conversion"/);
  assert.match(html,/Aguardando integração de PDFs/);
  assert.doesNotMatch(html,/SUPABASE_SERVICE_ROLE_KEY/);
});
test('Master exige sessão e não aceita POST',async()=>{
  const res=mockRes();
  await handler({method:'POST',headers:{},query:{}},res);
  assert.equal(res.statusCode,405);
});
test('Master rejeita usuários que não são Bruno ou Fernanda, inclusive administrador do marketing',async()=>{
  for(const id of [THIAGO,MARKETING]){
    const h=harness(id),res=mockRes();
    try{await handler(h.request,res);assert.equal(res.statusCode,403);assert.equal(h.calls.filter(x=>x.url.includes('crm_pilot_leads')).length,0)}
    finally{h.restore()}
  }
});
test('Master autoriza Bruno e Fernanda, limita a 4 consultores e nunca modifica dados',async()=>{
  for(const id of [BRUNO,FERNANDA]){
    const h=harness(id),res=mockRes();
    try{await handler(h.request,res);assert.equal(res.statusCode,200);assert.equal(res.data.consultants.length,1);assert.equal(res.data.slots,4);assert.equal(res.data.leads.length,1);assert.ok(h.calls.every(c=>c.method==='GET'));assert.equal(res.headers['Cache-Control'],'private, no-store, max-age=0')}
    finally{h.restore()}
  }
});
test('Mensagens gerenciais exigem lead pertencente a consultor autorizado',async()=>{
  const h=harness(BRUNO,'messages',LEAD),res=mockRes();
  try{await handler(h.request,res);assert.equal(res.statusCode,200);assert.equal(res.data.messages.length,1);assert.ok(h.calls.every(c=>c.method==='GET'))}
  finally{h.restore()}
  const x=harness(FERNANDA,'messages','22222222-2222-4222-8222-222222222222'),notFound=mockRes();
  try{await handler(x.request,notFound);assert.equal(notFound.statusCode,404);assert.equal(x.calls.filter(c=>c.url.includes('crm_pilot_messages')).length,0)}
  finally{x.restore()}
});
