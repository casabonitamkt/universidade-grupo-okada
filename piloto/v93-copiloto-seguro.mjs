// V93 — motor de regras local para homologação, sem integração a dados reais.
// Não envia mensagens, não altera preços, não distribui leads nem executa ações comerciais.
export const STAGES=['Lead','Diagnóstico/Projeto','Projeto recebido/Orçamento','Proposta','Follow-up','Negociação','Venda','Perda'];
export function canAnalyze(lead,actor){
 return !!lead&&!!actor&&lead.ownerId===actor.id&&lead.consent?.by===actor.id&&lead.consent?.revision===lead.revision;
}
export function authorize(lead,actor){
 if(!lead||!actor||lead.ownerId!==actor.id)throw Error('Somente o responsável pode autorizar análise');
 return {...lead,consent:{by:actor.id,revision:lead.revision,at:new Date().toISOString()}};
}
export function edit(lead,actor,patch){
 if(!lead||!actor||lead.ownerId!==actor.id)throw Error('Somente o responsável pode editar');
 if(!patch||typeof patch!=='object')throw Error('Alterações inválidas');
 if('ownerId' in patch||'consent' in patch||'revision' in patch||'lossValidated' in patch)throw Error('Campo protegido');
 return {...lead,...patch,revision:(lead.revision||0)+1,consent:null,lossValidated:false};
}
export function validateLoss(lead,actor){
 if(!actor||!['manager','admin'].includes(actor.role))throw Error('Validação exclusiva da gestão');
 if(lead.stage!=='Perda'||!String(lead.lossReason||'').trim())throw Error('Perda sem motivo');
 return {...lead,lossValidated:true};
}
export function analyze(lead,actor,now=new Date()){
 if(!canAnalyze(lead,actor))throw Error('Análise requer autorização vigente do responsável');
 const missing=[];
 if(!String(lead.city||'').trim())missing.push('cidade');
 if(!String(lead.briefing||'').trim())missing.push('briefing e necessidades');
 if(lead.kind==='projeto'&&!String(lead.projectReference||'').trim())missing.push('projeto ou imagem com medidas');
 if(!String(lead.architectStatus||'').trim())missing.push('confirmar presença de arquiteto');
 if(!lead.proposedValue)missing.push('valor proposto ou faixa');
 if(!lead.nextContact)missing.push('data do próximo contato');
 const findings=[],studies=[];
 if(['Proposta','Follow-up','Negociação'].includes(lead.stage)){
  if(!lead.nextContact||new Date(lead.nextContact)<now){findings.push('Retorno pendente ou vencido');studies.push(42);}
  if(lead.architectStatus==='sim'&&!lead.architectApproval){findings.push('Confirmar autorização do arquiteto antes de qualquer alteração');studies.push(45);}
  if(lead.projectMismatch||lead.specificationPending){findings.push('Conferir proposta e projeto antes de avançar');studies.push(48);}
 }
 if(lead.requestedExtraTerms&&!lead.managerApproval){findings.push('Condição comercial depende de autorização da direção');studies.push(44);}
 if(Number(lead.proposedValue)>50000&&!lead.presentationMeeting){findings.push('Avaliar apresentação por ligação/vídeo com o cliente');studies.push(46);}
 const next=missing.length?'Completar '+missing.slice(0,2).join(' e '):findings.length?findings[0]:'Confirmar próximo passo com o cliente';
 const reply='Olá! Para avançarmos com precisão, gostaria de confirmar os pontos pendentes do projeto e combinar o próximo passo com você. Qual seria o melhor momento?';
 return {missing,findings,studies:[...new Set(studies)],next,reply,at:now.toISOString(),source:'regras locais; revisão humana obrigatória'};
}
export function theoreticalPass(score,criticalError,practiceDelivered){
 return Number(score)>=8&&!criticalError&&!!practiceDelivered;
}
export function sierraReadiness(milestones,managerApproved,authorizedSierraContent){
 return [30,60,90].every(day=>milestones?.[day]?.theory===true&&milestones?.[day]?.practice===true&&!milestones?.[day]?.criticalError)&&managerApproved===true&&authorizedSierraContent===true;
}
