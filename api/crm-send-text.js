'use strict';
// Saída de texto CRM -> Zappy. Desativada até configurar ZAPPY_API_KEY e ZAPPY_SEND_ENABLED=true.
// Nenhuma credencial da Zappy chega ao navegador. Requisições duplicadas nunca são reenviadas.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORIGIN='https://universidade-grupo-okada.vercel.app';
const MAX_CHARS=4000;

async function storage(url,serviceKey,path,options={}){
  const response=await fetch(url+'/rest/v1/'+path,{
    ...options,
    headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json',...options.headers},
    signal:AbortSignal.timeout(7000)
  });
  if(!response.ok){
    const e=new Error('storage_'+response.status);e.status=response.status;throw e;
  }
  if(response.status===204 || options.headers?.Prefer==='return=minimal')return [];
  return response.json();
}
async function markOutbox(config,id,change){
  return storage(config.db,config.service,'crm_pilot_outbox?id=eq.'+encodeURIComponent(id),{
    method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({...change,updated_at:new Date().toISOString()})
  });
}
async function validateUser(token,config){
  const response=await fetch(config.db+'/auth/v1/user',{
    headers:{apikey:config.service,Authorization:'Bearer '+token},
    signal:AbortSignal.timeout(7000)
  });
  if(!response.ok)return null;
  const user=await response.json();
  return UUID.test(user.id||'')?user.id:null;
}
function enabled(env){
  return env.VERCEL_ENV==='production' && env.ZAPPY_SEND_ENABLED==='true'
    && Boolean(env.ZAPPY_API_KEY && env.ZAPPY_INSTANCE_ID && env.SUPABASE_URL
      && env.SUPABASE_SERVICE_ROLE_KEY && env.CRM_THIAGO_USER_ID);
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET')return res.status(200).json({enabled:enabled(process.env)});
  if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
  const origin=req.headers.origin;
  if(origin&&origin!==ORIGIN)return res.status(403).json({error:'origin_not_allowed'});
  if(!enabled(process.env))return res.status(503).json({error:'sending_disabled'});

  const cfg={
    db:process.env.SUPABASE_URL.replace(/\/$/,''),
    service:process.env.SUPABASE_SERVICE_ROLE_KEY,
    instance:process.env.ZAPPY_INSTANCE_ID,
    zappyKey:process.env.ZAPPY_API_KEY,
    owner:process.env.CRM_THIAGO_USER_ID
  };
  const authorization=req.headers.authorization||'';
  const token=/^Bearer (.+)$/.exec(authorization)?.[1];
  if(!token || token.length>6000)return res.status(401).json({error:'authentication_required'});
  let userId;
  try{userId=await validateUser(token,cfg)}
  catch{return res.status(503).json({error:'authentication_unavailable'})}
  if(!userId || userId!==cfg.owner)return res.status(403).json({error:'forbidden'});

  let input;
  try{
    input=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!input || typeof input!=='object'||Array.isArray(input))throw Error();
  }catch{return res.status(400).json({error:'invalid_json'})}
  const leadId=input.lead_id,requestId=input.request_id;
  const content=typeof input.content==='string'?input.content.trim():'';
  if(!UUID.test(leadId||'')||!UUID.test(requestId||'')||!content
      ||content.length>MAX_CHARS||content.includes('\u0000'))
    return res.status(400).json({error:'invalid_message'});

  let lead;
  try{
    const matches=await storage(cfg.db,cfg.service,'crm_pilot_leads?'+new URLSearchParams({
      select:'id,phone,source,owner_consultant_id',id:'eq.'+leadId,limit:'1'
    }));
    lead=matches[0];
  }catch{return res.status(503).json({error:'lookup_unavailable'})}
  if(!lead||lead.owner_consultant_id!==userId||lead.source!=='zapi'
     ||!/^[0-9]{10,15}$/.test(lead.phone||''))
    return res.status(403).json({error:'contact_not_allowed'});
  // Homologação controlada: durante o primeiro teste apenas o telefone autorizado recebe.
  // A configuração pode ser removida após o teste; não deixar enviar aos demais contatos.
  const allowedTestPhone=process.env.CRM_SEND_TEST_ONLY_PHONE;
  if(allowedTestPhone && lead.phone!==allowedTestPhone)
    return res.status(403).json({error:'test_recipient_only'});

  let outbox;
  try{
    const inserted=await storage(cfg.db,cfg.service,'crm_pilot_outbox',{
      method:'POST',headers:{Prefer:'return=representation'},
      body:JSON.stringify({
        owner_consultant_id:userId,client_request_id:requestId,
        lead_id:lead.id,phone:lead.phone,content,status:'sending'
      })
    });
    outbox=inserted[0];
    if(!outbox?.id)throw Error('empty_outbox');
  }catch(error){
    if(error.status===409){
      try{
        const existing=await storage(cfg.db,cfg.service,'crm_pilot_outbox?'+new URLSearchParams({
          select:'status,lead_id',owner_consultant_id:'eq.'+userId,
          client_request_id:'eq.'+requestId,limit:'1'
        }));
        if(existing[0]&&existing[0].lead_id===leadId)
          return res.status(200).json({status:existing[0].status==='sent'?'already_sent':'already_processing'});
      }catch{}
      return res.status(409).json({error:'request_conflict'});
    }
    return res.status(503).json({error:'outbox_unavailable'});
  }

  let response;
  try{
    response=await fetch('https://zappy.api.br/v1/instances/'+encodeURIComponent(cfg.instance)+'/messages',{
      method:'POST',
      headers:{Authorization:'Bearer '+cfg.zappyKey,'Content-Type':'application/json'},
      body:JSON.stringify({to:lead.phone,type:'text',content}),
      signal:AbortSignal.timeout(10000)
    });
  }catch{
    try{await markOutbox(cfg,outbox.id,{status:'unknown',error_code:'network_uncertain'})}catch{}
    // Nunca reenviar automaticamente uma requisição cujo envio é incerto.
    return res.status(202).json({status:'unknown',message:'Confira no WhatsApp antes de tentar novamente.'});
  }
  if(!response.ok){
    try{await markOutbox(cfg,outbox.id,{status:'failed',error_code:'zappy_'+response.status})}catch{}
    return res.status(response.status===429?429:502).json({
      status:'failed',error:response.status===429?'provider_rate_limited':'provider_rejected'
    });
  }
  let data={};
  try{data=await response.json()}catch{}
  const externalId=typeof data.message_id==='string'&&/^[\w.-]{1,128}$/.test(data.message_id)
    ?data.message_id:null;
  try{
    await markOutbox(cfg,outbox.id,{status:'sent',external_message_id:externalId});
    if(externalId){
      await storage(cfg.db,cfg.service,'crm_pilot_messages',{
        method:'POST',headers:{Prefer:'return=minimal'},
        body:JSON.stringify({
          lead_id:lead.id,source:'zapi',instance_id:cfg.instance,
          external_message_id:externalId,direction:'saida',kind:'text',
          body:content,event_at:new Date().toISOString()
        })
      });
    }
  }catch(error){
    console.error('crm_outbound_postsend_storage_error',error.message);
    // Mensagem pode já ter sido enviada: jamais disparar novamente sem ação explícita.
    return res.status(202).json({status:'sent_unconfirmed_in_crm'});
  }
  return res.status(200).json({status:externalId?'sent':'sent_unconfirmed_in_crm'});
};
module.exports.enabled=enabled;
