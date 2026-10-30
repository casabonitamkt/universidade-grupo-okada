'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const handler=require('../api/crm-media.js');
const owner='ff819b24-a03e-4e24-a37b-8369db465fd9';
const other='8f819b24-a03e-4e24-a37b-8369db465fd9';
const lead='b2a03fa1-aac1-45a1-9d9d-03f096c47efa';
const mid='c2a03fa1-aac1-45a1-9d9d-03f096c47efa';
const inst='7f611f42-990f-4c6c-9493-e182de3c759a';
const json=(status,data)=>({ok:status>=200&&status<300,status,
 headers:{get:k=>k==='content-type'?'application/json':null},
 json:async()=>data});
const res=()=>({code:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;return this},
 status(n){this.code=n;return this},json(v){this.body=v;return this},end(v){this.body=v;return this}});
function setup(options={}){
 const vars={SUPABASE_URL:'https://unit.invalid',SUPABASE_SERVICE_ROLE_KEY:'unit-service',
 ZAPPY_INSTANCE_ID:inst,ZAPPY_API_KEY:'unit-api-key'};
 const previous={};
 for(const [k,v] of Object.entries(vars)){previous[k]=process.env[k];process.env[k]=v}
 const oldFetch=globalThis.fetch;
 let downloads=0;
 globalThis.fetch=async(url,args={})=>{
  const u=String(url);
  if(u.endsWith('/auth/v1/user'))return json(200,{id:options.user||owner});
  if(u.includes('crm_pilot_messages?'))return json(200,[{id:mid,lead_id:lead,kind:'image',instance_id:inst}]);
  if(u.includes('crm_pilot_leads?'))return json(200,[{id:lead,owner_consultant_id:options.leadOwner||owner}]);
  if(u.includes('crm_pilot_media?'))return json(200,[{
   media_type:'image',mime_type:'image/png',file_length:9,
   download_metadata:{direct_path:'/v/abc',media_key:'private-unit-key',file_sha256:'hash',file_enc_sha256:'hash2'}
  }]);
  if(u.includes('/media/download')){
   downloads++;
   assert.equal(args.headers.Authorization,'Bearer unit-api-key');
   const request=JSON.parse(args.body);
   assert.equal(request.media_key,'private-unit-key');
   assert.equal(request.type,'image');
   assert.equal(request.file_length,9);
   assert.equal(request.mime_type,'image/png');
   assert.equal(Object.hasOwn(request,'mimetype'),false);
   assert.equal(request.file_sha256,'hash');
   return json(200,{data:Buffer.from('image-binary').toString('base64')});
  }
  throw Error('unexpected endpoint '+u);
 };
 return {get downloads(){return downloads},restore(){
  globalThis.fetch=oldFetch;for(const [k,v] of Object.entries(previous)){
   if(v===undefined)delete process.env[k];else process.env[k]=v
  }
 }};
}
function req(id=mid){return {method:'GET',query:{message_id:id},headers:{authorization:'Bearer unit-user-token-very-long'}}}
test('exige sessão autenticada para acessar mídia',async()=>{
 const h=setup();try{const x=res();await handler({...req(),headers:{}},x);assert.equal(x.code,401);assert.equal(h.downloads,0)}finally{h.restore()}
});
test('impede mídia de contato de outro consultor',async()=>{
 const h=setup({leadOwner:other});try{const x=res();await handler(req(),x);assert.equal(x.code,404);assert.equal(h.downloads,0)}finally{h.restore()}
});
test('valida identificador e não chama Zappy',async()=>{
 const h=setup();try{const x=res();await handler(req('invalid'),x);assert.equal(x.code,400);assert.equal(h.downloads,0)}finally{h.restore()}
});
test('devolve imagem sem expor chave de mídia ao navegador',async()=>{
 const h=setup();try{const x=res();await handler(req(),x);assert.equal(x.code,200);
 assert.equal(x.headers['Content-Type'],'image/png');assert.equal(x.headers['Cache-Control'],'private, no-store, max-age=0');
 assert.equal(x.body.toString(),'image-binary');assert.equal(h.downloads,1);
 assert.equal(JSON.stringify(x.headers).includes('private-unit-key'),false);
 }finally{h.restore()}
});
test('rejeita mídia maior do que o limite de segurança',()=>{
 assert.equal(handler.decodeMediaAnswer({data:Buffer.alloc(12*1024*1024+1).toString('base64')}),null);
});
test('aceita somente formatos seguros para pré-visualização',()=>{
 assert.equal(handler.safeType('image','image/svg+xml'),null);
 assert.equal(handler.safeType('image','image/jpeg'),'image/jpeg');
 assert.equal(handler.safeType('audio','audio/ogg; codecs=opus'),'audio/ogg');
 assert.equal(handler.safeType('document','text/html'),null);
});
