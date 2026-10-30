'use strict';
// Proxy de mídias do CRM piloto. Chaves da Zappy e de descriptografia nunca são entregues ao navegador.
// Acesso permitido apenas ao dono da conversa, validado com sessão do Supabase no servidor.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BYTES=12*1024*1024;
function response(res,status,data){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(data);
}
async function db(cfg,path){
  const r=await fetch(cfg.url+'/rest/v1/'+path,{
    headers:{apikey:cfg.service,Authorization:'Bearer '+cfg.service},
    signal:AbortSignal.timeout(7000)
  });
  if(!r.ok)throw Error('db_'+r.status);
  return r.json();
}
async function authorizedUser(cfg,token){
  const r=await fetch(cfg.url+'/auth/v1/user',{
    headers:{apikey:cfg.service,Authorization:'Bearer '+token},
    signal:AbortSignal.timeout(7000)
  });
  if(!r.ok)return null;
  const user=await r.json();
  return UUID.test(user?.id||'')?user.id:null;
}
function decodeMediaAnswer(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return null;
  const candidate=[payload.data,payload.base64,payload.media?.data,payload.media?.base64,payload.file?.data]
    .find(v=>typeof v==='string'&&v.length>0);
  if(!candidate)return null;
  const raw=candidate.replace(/^data:[^,]*;base64,/i,'');
  if(raw.length>Math.ceil(MAX_BYTES*4/3)+16||raw.length%4===1
      ||!/^[A-Za-z0-9+/]*={0,2}$/.test(raw))return null;
  const buf=Buffer.from(raw,'base64');
  if(buf.length===0||buf.length>MAX_BYTES)return null;
  return buf;
}
const MIME={
  image:['image/jpeg','image/png','image/gif','image/webp'],
  audio:['audio/ogg','audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/aac'],
  video:['video/mp4','video/webm','video/quicktime'],
  document:['application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  sticker:['image/webp','image/png']
};
function safeType(kind,provided){
  const mime=typeof provided==='string'?provided.split(';',1)[0].trim().toLowerCase():'';
  return MIME[kind]?.includes(mime)?mime:null;
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return response(res,405,{error:'method_not_allowed'});
  const id=typeof req.query?.message_id==='string'?req.query.message_id:'';
  if(!UUID.test(id))return response(res,400,{error:'invalid_message_id'});
  const env=process.env;
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.ZAPPY_API_KEY||!env.ZAPPY_INSTANCE_ID)
    return response(res,503,{error:'media_not_configured'});
  const auth=typeof req.headers.authorization==='string'?req.headers.authorization:'';
  const token=/^Bearer (.{10,6000})$/.exec(auth)?.[1];
  if(!token)return response(res,401,{error:'authentication_required'});
  const cfg={url:env.SUPABASE_URL.replace(/\/$/,''),service:env.SUPABASE_SERVICE_ROLE_KEY,
    instance:env.ZAPPY_INSTANCE_ID,zappyKey:env.ZAPPY_API_KEY};
  let owner;
  try{owner=await authorizedUser(cfg,token)}catch{return response(res,503,{error:'authentication_unavailable'})}
  if(!owner)return response(res,401,{error:'authentication_required'});
  try{
    // Verifica propriedade ANTES de consultar metadados privados ou chamar o provedor.
    const messages=await db(cfg,'crm_pilot_messages?'+new URLSearchParams({
      select:'id,lead_id,kind,instance_id',id:'eq.'+id,limit:'1'
    }));
    const msg=messages[0];
    if(!msg||!MIME[msg.kind]||msg.instance_id!==cfg.instance)return response(res,404,{error:'media_not_found'});
    const leads=await db(cfg,'crm_pilot_leads?'+new URLSearchParams({
      select:'id,owner_consultant_id',id:'eq.'+msg.lead_id,limit:'1'
    }));
    if(!leads[0]||leads[0].owner_consultant_id!==owner)return response(res,404,{error:'media_not_found'});
    const mediaRows=await db(cfg,'crm_pilot_media?'+new URLSearchParams({
      select:'media_type,mime_type,file_length,download_metadata',message_id:'eq.'+id,limit:'1'
    }));
    const media=mediaRows[0],meta=media?.download_metadata;
    if(!meta||media.media_type!==msg.kind||typeof meta.direct_path!=='string'
      ||typeof meta.media_key!=='string'||!meta.direct_path.startsWith('/'))
      return response(res,404,{error:'media_not_available'});
    if(media.file_length>MAX_BYTES)return response(res,413,{error:'media_too_large'});
    const mime=safeType(media.media_type,media.mime_type);
    if(!mime)return response(res,415,{error:'media_format_not_supported'});
    // Campos recebidos no webhook original, preservando os nomes documentados.
    // Não incluir propriedades opcionais nulas na requisição para evitar rejeição de validação.
    const reqBody={
      direct_path:meta.direct_path,
      media_key:meta.media_key,
      mimetype:media.mime_type,
      type:msg.kind,
      ...(Number.isSafeInteger(media.file_length)&&media.file_length>=0?{file_length:media.file_length}:{}),
      ...(typeof meta.file_sha256==='string'&&meta.file_sha256?{file_sha256:meta.file_sha256}:{}),
      ...(typeof meta.file_enc_sha256==='string'&&meta.file_enc_sha256?{file_enc_sha256:meta.file_enc_sha256}:{}),
      ...(typeof meta.url==='string'&&meta.url.startsWith('https://')?{url:meta.url}:{})
    };
    const z=await fetch('https://zappy.api.br/v1/instances/'+encodeURIComponent(cfg.instance)+'/media/download',{
      method:'POST',headers:{Authorization:'Bearer '+cfg.zappyKey,'Content-Type':'application/json'},
      body:JSON.stringify(reqBody),signal:AbortSignal.timeout(14000)
    });
    if(!z.ok){
      // Classificar somente o nome de campos de validação conhecidos; jamais registrar
      // o corpo bruto do provedor, que poderia refletir segredos da mensagem.
      let validationField='unknown';
      if(z.status===400){
        const body=(await z.text()).slice(0,1024);
        for(const field of ['file_length','mimetype','mime_type','type','url','direct_path','media_key','file_sha256','file_enc_sha256']){
          if(new RegExp('\\b'+field+'\\b','i').test(body)){validationField=field;break}
        }
      }
      console.error('crm_media_provider_failure',{status:z.status,kind:msg.kind,validationField});
      return response(res,502,{error:'provider_download_unavailable',provider_status:z.status,validation_field:validationField});
    }
    const len=Number(z.headers.get('content-length')||'0');
    if(len>Math.ceil(MAX_BYTES*4/3)+2048)return response(res,413,{error:'media_too_large'});
    let content;
    if(z.headers.get('content-type')?.toLowerCase().startsWith('application/json')){
      const result=await z.json();
      content=decodeMediaAnswer(result);
    }else{
      const arr=await z.arrayBuffer();
      if(arr.byteLength>MAX_BYTES)return response(res,413,{error:'media_too_large'});
      content=Buffer.from(arr);
    }
    if(!content){
      console.error('crm_media_response_unrecognized',{kind:msg.kind,contentType:z.headers.get('content-type')?.split(';',1)[0]||'unknown'});
      return response(res,502,{error:'provider_response_unrecognized'});
    }
    res.setHeader('Content-Type',mime);
    res.setHeader('Content-Disposition','inline');
    res.setHeader('Content-Length',String(content.length));
    return res.status(200).end(content);
  }catch(error){
    console.error('crm_media_proxy_failure',error.message);
    return response(res,503,{error:'media_temporarily_unavailable'});
  }
};
module.exports.decodeMediaAnswer=decodeMediaAnswer;
module.exports.safeType=safeType;
