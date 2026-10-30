'use strict';
// CRM Master: consulta gerencial SOMENTE leitura, para os dois diretores autorizados.
// Não altera RLS, não cria dados e não envia mensagens.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MASTER_IDS=new Set(['4215da90-7c48-4c6b-bd96-af504c9557b5','2846416e-03af-432d-b2d2-26431d5d069f']);
function reply(res,status,payload){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Vary','Authorization');
  return res.status(status).json(payload);
}
async function fetchJson(url,headers){
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw new Error('upstream_'+response.status);
  return response.json();
}
function rest(cfg,table,params){
  return fetchJson(cfg.url+'/rest/v1/'+table+'?'+new URLSearchParams(params),{
    apikey:cfg.service,Authorization:'Bearer '+cfg.service
  });
}
async function verifyMaster(cfg,token){
  const response=await fetch(cfg.url+'/auth/v1/user',{
    headers:{apikey:cfg.service,Authorization:'Bearer '+token},signal:AbortSignal.timeout(7000)
  });
  if(!response.ok)return false;
  const user=await response.json();
  if(!UUID.test(user?.id||'')||!MASTER_IDS.has(user.id))return false;
  const profile=await rest(cfg,'profiles',{select:'id,role',id:'eq.'+user.id,limit:'1'});
  return profile[0]?.id===user.id && profile[0]?.role==='admin';
}
module.exports=async function handler(req,res){
  if(req.method!=='GET')return reply(res,405,{error:'method_not_allowed'});
  const env=process.env;
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)
    return reply(res,503,{error:'service_unavailable'});
  const token=/^Bearer (.{10,6000})$/.exec(req.headers.authorization||'')?.[1];
  if(!token)return reply(res,401,{error:'authentication_required'});
  const cfg={url:env.SUPABASE_URL.replace(/\/$/,''),service:env.SUPABASE_SERVICE_ROLE_KEY};
  let authorized=false;
  try{authorized=await verifyMaster(cfg,token)}catch{return reply(res,503,{error:'authentication_unavailable'})}
  if(!authorized)return reply(res,403,{error:'forbidden'});
  const view=typeof req.query?.view==='string'?req.query.view:'summary';
  if(!['summary','messages'].includes(view))return reply(res,400,{error:'invalid_view'});
  try{
    // Somente os 4 consultores comerciais registrados, nunca usuários administrativos.
    const consultants=(await rest(cfg,'profiles',{
      select:'id,full_name,store,role',role:'eq.consultant',order:'full_name.asc',limit:'4'
    })).filter(x=>UUID.test(x.id)&&x.role==='consultant').slice(0,4);
    const ids=consultants.map(x=>x.id);
    if(view==='messages'){
      const leadId=typeof req.query?.lead_id==='string'?req.query.lead_id:'';
      if(!UUID.test(leadId)||!ids.length)return reply(res,404,{error:'not_found'});
      const found=await rest(cfg,'crm_pilot_leads',{
        select:'id,owner_consultant_id',id:'eq.'+leadId,
        owner_consultant_id:'in.('+ids.join(',')+')',limit:'1'
      });
      if(!found.length)return reply(res,404,{error:'not_found'});
      const messages=await rest(cfg,'crm_pilot_messages',{
        select:'id,lead_id,direction,kind,body,media_name,event_at',
        lead_id:'eq.'+leadId,order:'event_at.desc',limit:'150'
      });
      return reply(res,200,{messages:messages.reverse()});
    }
    if(!ids.length)return reply(res,200,{consultants:[],leads:[],slots:4,partial:false});
    // Máximo de 400 leads na visão; quando atingir o limite, sinalizar relatório parcial.
    const rows=await rest(cfg,'crm_pilot_leads',{
      select:'id,display_name,phone,store,source,owner_consultant_id,stage,last_message_at,last_read_at,created_at',
      owner_consultant_id:'in.('+ids.join(',')+')',order:'last_message_at.desc.nullslast',limit:'401'
    });
    return reply(res,200,{consultants,leads:rows.slice(0,400),slots:4,partial:rows.length>400});
  }catch(error){
    console.error('crm_master_read_failure',String(error.message||'unknown').slice(0,80));
    return reply(res,503,{error:'temporarily_unavailable'});
  }
};
module.exports.MASTER_IDS=MASTER_IDS;
