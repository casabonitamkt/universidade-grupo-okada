/* Homologação: rascunhos locais, sem nota ou certificação oficial. */
export const STORAGE_KEY="cb_trilha90_homologacao_v2";
export const MIN_CHARS=60;
export function novo(dia){
 if(!Number.isInteger(dia)||dia<1||dia>90)throw Error("Dia inválido");
 return {dia,etapa:"aprender",aprendizado:"",demonstracao:"",pratica:"",simulacao:"",tentativa:0,versao:0,nota:null,aprovado:false,historico:[]};
}
export function normalizar(raw,dia){
 const s=novo(dia);if(!raw||raw.dia!==dia)return s;
 for(const k of ["aprendizado","demonstracao","pratica","simulacao"])s[k]=String(raw[k]||"").slice(0,6000);
 s.tentativa=Number.isInteger(raw.tentativa)&&raw.tentativa>=0?Math.min(raw.tentativa,1000):0;
 s.versao=Number.isInteger(raw.versao)&&raw.versao>=0?Math.min(raw.versao,1000):0;
 s.nota=typeof raw.nota==="number"&&raw.nota>=0&&raw.nota<=10?raw.nota:null;
 // Dados do navegador são rascunhos: não liberar etapas ou aprovação sem evidências locais.
 const aprendeu=s.aprendizado.trim().length>=MIN_CHARS;
 const demonstrou=s.demonstracao.trim().length>=MIN_CHARS;
 const praticou=s.pratica.trim().length>=MIN_CHARS&&s.simulacao.trim().length>=MIN_CHARS;
 const evidencias=aprendeu&&demonstrou&&praticou;
 s.aprovado=raw.aprovado===true&&s.nota>=8&&s.tentativa>0&&evidencias;
 s.historico=Array.isArray(raw.historico)?raw.historico.slice(-12):[];
 let etapa=["aprender","demonstrar","praticar","provar"].includes(raw.etapa)?raw.etapa:"aprender";
 if(!aprendeu)etapa="aprender";
 else if((etapa==="praticar"||etapa==="provar")&&!demonstrou)etapa="demonstrar";
 else if(etapa==="provar"&&!praticou)etapa="praticar";
 s.etapa=s.aprovado?"concluido":etapa;
 return s;
}
export function avancar(s,destino){
 s=normalizar(s,s.dia);
 if(s.aprovado)throw Error("Dia já aprovado.");
 const gates={demonstrar:s.aprendizado.trim().length>=MIN_CHARS,
 praticar:s.aprendizado.trim().length>=MIN_CHARS&&s.demonstracao.trim().length>=MIN_CHARS,
 provar:s.aprendizado.trim().length>=MIN_CHARS&&s.demonstracao.trim().length>=MIN_CHARS&&s.pratica.trim().length>=MIN_CHARS&&s.simulacao.trim().length>=MIN_CHARS};
 const etapas=["aprender","demonstrar","praticar","provar"];
 if(!gates[destino]||etapas.indexOf(destino)!==etapas.indexOf(s.etapa)+1)throw Error("Conclua a etapa anterior (mínimo 60 caracteres por resposta).");
 return {...s,etapa:destino};
}
export function corrigido(s,resultado){
 s=normalizar(s,s.dia);
 if(s.etapa!=="provar"||s.aprovado)throw Error("Prova bloqueada.");
 if(s.pratica.trim().length<MIN_CHARS||s.simulacao.trim().length<MIN_CHARS)throw Error("Prática e simulação obrigatórias antes da prova.");
 if(s.tentativa!==s.versao)throw Error("Reteste obrigatório antes de nova tentativa.");
 if(!resultado||resultado.dia!==s.dia||!Number.isFinite(resultado.nota)||resultado.nota<0||resultado.nota>10)throw Error("Nota inválida.");
 const aprovado=resultado.nota>=8,tentativa=s.tentativa+1;
 return {...s,nota:resultado.nota,aprovado,tentativa,etapa:aprovado?"concluido":"provar",historico:[...s.historico,{tentativa,nota:resultado.nota,aprovado}].slice(-12)};
}
export function reteste(s){
 s=normalizar(s,s.dia);
 if(s.aprovado||s.etapa!=="provar"||s.tentativa<1||s.tentativa!==s.versao+1)throw Error("Reteste indisponível.");
 return {...s,versao:s.versao+1};
}
export function liberado(dia,estados,disponivel){
 if(!Number.isInteger(dia)||dia<1||dia>90||!disponivel)return false;
 return dia===1||normalizar(estados?.[dia-1],dia-1).aprovado;
}
