import {supabaseUrl, publicKey} from './config.js';

const $=id=>document.getElementById(id);
const instruction={
  resposta:'Sugira uma resposta à última mensagem.',
  objecao:'Trabalhe a objeção real sem inventar condições.',
  followup:'Retome a proposta, se registrada, e sugira combinar o próximo passo.',
  retomada:'Retome o interesse registrado sem pressionar o cliente.',
  prospeccao:'Sugira um primeiro contato individual com base nas informações disponíveis.',
  arquiteto:'Pergunte sobre projetos e ofereça apoio na especificação ou proposta.',
};
let session=null, contacts=[], generation=0, generating=false;

async function request(path,{body,accessToken}={}){
  const headers={apikey:publicKey};
  if(accessToken)headers.Authorization='Bearer '+accessToken;
  if(body!==undefined)headers['Content-Type']='application/json';
  const response=await fetch(supabaseUrl+path,{
    method:body===undefined?'GET':'POST',
    headers,
    body:body===undefined?undefined:JSON.stringify(body),
    cache:'no-store',
    signal:AbortSignal.timeout(30000),
  });
  if(!response.ok)throw Object.assign(new Error('Falha ao consultar o CRM.'),{status:response.status});
  return response.json();
}

function clearResult(){
  generation++;
  $('draft').value='';
  $('analysis').textContent='';
  $('result').hidden=true;
  $('generate').disabled=!session||!$('contact').value||generating;
}

function endSession(){
  session=null;contacts=[];
  $('login').hidden=false;
  $('workspace').hidden=true;
  $('contact').replaceChildren(new Option('Selecione um contato',''));
  $('search').value='';$('question').value='';
  clearResult();
}

function filterContacts(){
  const selected=$('contact').value;
  const key=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
  const term=key($('search').value);
  const matches=contacts.filter(contact=>key(contact.display_name||'Cliente').includes(term));
  $('contact').replaceChildren(new Option('Selecione um contato',''),
    ...matches.map(contact=>new Option(contact.display_name||'Cliente',contact.id)));
  $('contact').value=matches.some(contact=>contact.id===selected)?selected:'';
  if($('contact').value!==selected)clearResult();
}

function redact(value){
  return String(value||'')
    .replace(/https?:\/\/\S+|www\.\S+/gi,'[link omitido]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[e-mail omitido]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,'[CPF omitido]')
    .replace(/(?:\+?55[ .-]?)?(?:\(?\d{2}\)?[ .-]?)?9?\d{4}[ .-]?\d{4}\b/g,'[telefone omitido]')
    .replace(/\b\d{13,19}\b/g,'[sequência numérica omitida]');
}

$('theme').addEventListener('click',()=>{
  const dark=document.documentElement.dataset.theme!=='dark';
  document.documentElement.dataset.theme=dark?'dark':'light';
  $('theme').textContent=dark?'Fundo branco':'Fundo preto';
  $('theme').setAttribute('aria-pressed',String(dark));
});
$('login').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=event.submitter;
  button.disabled=true;
  const password=$('password').value;
  $('password').value='';
  $('status').textContent='Conectando ao CRM…';
  try{
    const data=await request('/auth/v1/token?grant_type=password',{body:{email:$('email').value.trim(),password}});
    if(!data.access_token||!data.user?.id)throw Error('Sessão indisponível.');
    const query=new URLSearchParams({
      select:'id,display_name,stage,next_contact_on,next_contact_action',
      owner_consultant_id:'eq.'+data.user.id,order:'last_message_at.desc.nullslast',limit:'100',
    });
    contacts=await request('/rest/v1/crm_pilot_leads?'+query,{accessToken:data.access_token});
    session={accessToken:data.access_token};
    $('login').hidden=true;
    $('workspace').hidden=false;
    filterContacts();
    $('status').textContent=contacts.length?'Selecione o mesmo contato aberto no WhatsApp.':'Sua conta não tem contatos atribuídos no CRM.';
  }catch{
    endSession();
    $('status').textContent='Não foi possível entrar ou consultar sua carteira. Confira sua conta e tente novamente.';
  }finally{
    button.disabled=false;
  }
});
$('sign-out').addEventListener('click',()=>{
  endSession();
  $('status').textContent='Sessão encerrada no painel.';
});
$('search').addEventListener('input',filterContacts);
$('contact').addEventListener('change',()=>{
  $('question').value='';
  clearResult();
});
$('purpose').addEventListener('change',clearResult);
$('question').addEventListener('input',clearResult);

$('generate').addEventListener('click',async()=>{
  const contact=contacts.find(contact=>contact.id===$('contact').value);
  if(!session||!contact||generating)return;
  clearResult();
  const run=generation, accessToken=session.accessToken;
  generating=true;
  $('generate').disabled=true;
  $('status').textContent='Lendo o histórico sincronizado…';
  try{
    const query=new URLSearchParams({
      select:'direction,kind,body',lead_id:'eq.'+contact.id,order:'event_at.desc,id.desc',limit:'10',
    });
    const messages=await request('/rest/v1/crm_pilot_messages?'+query,{accessToken});
    if(run!==generation)return;
    const context=[
      'Atendimento consultivo da Casa Bonita. Entenda projeto ou renovação, uso e preferências antes de recomendar uma peça. Use apenas fatos disponíveis. Não invente preços, prazos ou descontos.',
      'Objetivo: '+instruction[$('purpose').value],
      'Etapa no CRM: '+contact.stage,
      contact.next_contact_on?'Retorno registrado: '+contact.next_contact_on+' · '+redact(contact.next_contact_action).slice(0,300):'Sem data de retorno registrada.',
      'Pergunta do consultor: '+redact($('question').value).slice(0,500),
      'Trechos recentes do histórico sincronizado:',
      ...[...messages].reverse().map(message=>(message.direction==='saida'?'Consultor: ':'Cliente: ')+
        (message.kind==='text'?redact(message.body).slice(0,240):'[Mídia: '+message.kind+']')),
    ].join('\n');
    const result=await request('/functions/v1/crm-copiloto-homologacao',{accessToken,body:{briefing:context}});
    if(run!==generation)return;
    const analysis=typeof result.analysis==='string'?result.analysis.trim():'';
    if(!analysis)throw Error('Sugestão indisponível.');
    const draft=analysis.match(/Mensagem para WhatsApp:\s*([\s\S]*?)(?=\n\s*Cuidado:|$)/i)?.[1]?.trim()||'';
    $('analysis').textContent=analysis;
    $('draft').value=draft;
    $('copy').disabled=!draft;
    $('result').hidden=false;
    $('status').textContent=draft?'Revise a sugestão antes de colar no WhatsApp.':'Confira a orientação em Ver análise.';
  }catch(error){
    if(run!==generation)return;
    if(error.status===401){endSession();$('status').textContent='A sessão expirou. Entre de novo.';}
    else $('status').textContent='Não foi possível gerar a orientação. Tente novamente.';
  }finally{
    generating=false;
    $('generate').disabled=!session||!$('contact').value;
    if(run!==generation&&session&&$('result').hidden)$('status').textContent='Selecione o contato e gere uma nova orientação.';
  }
});
$('draft').addEventListener('input',()=>{$('copy').disabled=!$('draft').value.trim()});
$('copy').addEventListener('click',async()=>{
  const draft=$('draft');
  if(!draft.value.trim())return;
  try{
    await navigator.clipboard.writeText(draft.value);
    $('status').textContent='Copiado. Cole no WhatsApp e confira antes de enviar.';
  }catch{
    draft.focus();draft.select();
    $('status').textContent='Copie o texto selecionado.';
  }
});
