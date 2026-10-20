/* Regras puras do fluxo visual de homologação: não substituem políticas RLS nem correção server-side. */
export const ETAPAS_TRILHA=["aprender","demonstrar","praticar","provar","concluido"];
export function etapaAtual(registro){
 if(registro?.aprovado_provisorio===true)return "concluido";
 return ETAPAS_TRILHA.includes(registro?.etapa)?registro.etapa:"aprender";
}
export function podeAcessarEtapa(registro,indice){
 if(!Number.isInteger(indice)||indice<0||indice>3)return false;
 return indice<=ETAPAS_TRILHA.indexOf(etapaAtual(registro));
}
export function proximaEtapa(etapa){
 if(etapa==="aprender")return "demonstrar";
 if(etapa==="demonstrar")return "praticar";
 return null;
}
export function podeSalvarPratica(registro){
 return !registro?.aprovado_provisorio && ["praticar","provar"].includes(etapaAtual(registro));
}
export function podeCorrigirProva(registro){
 return !registro?.aprovado_provisorio && etapaAtual(registro)==="provar"
  && String(registro?.pratica_texto||"").trim().length>=60
  && String(registro?.simulacao_texto||"").trim().length>=60;
}
export function versaoReteste(registro){
 const n=Number(registro?.tentativa);
 return Number.isSafeInteger(n)&&n>=0?n:0;
}
