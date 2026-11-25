'use strict';

const {verifyMaster}=require('./crm-master.js');

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Vary','Authorization');
  const reply=(status,body)=>res.status(status).json(body);
  if(!['GET','PUT'].includes(req.method)){
    res.setHeader('Allow','GET, PUT');
    return reply(405,{error:'method_not_allowed'});
  }
  const token=/^Bearer (.{10,6000})$/.exec(req.headers.authorization||'')?.[1];
  if(!token)return reply(401,{error:'authentication_required'});
  const env=process.env;
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return reply(503,{error:'service_unavailable'});
  const cfg={url:env.SUPABASE_URL.replace(/\/$/,''),service:env.SUPABASE_SERVICE_ROLE_KEY};
  try{
    if(!await verifyMaster(cfg,token))return reply(403,{error:'forbidden'});
    const headers={apikey:cfg.service,Authorization:'Bearer '+cfg.service};
    const options={headers,signal:AbortSignal.timeout(7000)};
    let path='?id=eq.1&select=dataset_id';
    if(req.method==='PUT'){
      let input;
      try{input=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{}
      const datasetId=input?.dataset_id;
      if(typeof datasetId!=='string'||!/^\d{5,30}$/.test(datasetId))return reply(400,{error:'invalid_dataset_id'});
      path='?on_conflict=id&select=dataset_id';
      options.method='POST';
      headers['Content-Type']='application/json';
      headers.Prefer='resolution=merge-duplicates,return=representation';
      options.body=JSON.stringify({id:1,dataset_id:datasetId});
    }
    const result=await fetch(cfg.url+'/rest/v1/crm_meta_settings'+path,options);
    if(!result.ok)return reply(503,{error:'settings_unavailable'});
    const rows=await result.json();
    return reply(200,{dataset_id:rows[0]?.dataset_id??null});
  }catch{
    return reply(503,{error:'settings_unavailable'});
  }
};
