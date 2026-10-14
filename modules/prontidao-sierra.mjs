/* Regras puras de certificação — sem leitura/escrita de usuários. */
export const MARCOS=Object.freeze({30:{fase:'Fundamentos',minNota:8},60:{fase:'Projetos e negociação',minNota:8},90:{fase:'Prontidão Sierra',minNota:8}});
const ok=n=>Number.isFinite(Number(n))&&Number(n)>=8&&Number(n)<=10;
export function avaliarMarco(dia,e={}){
 const marco=MARCOS[dia];if(!marco)return {aprovado:false,pendencias:['Marco inexistente']};
 const pendencias=[];
 if(!ok(e.notaProva))pendencias.push('Prova do marco com nota mínima 8,0');
 if(!ok(e.notaPratica))pendencias.push('Demonstração prática com nota mínima 8,0');
 if(e.erroCritico===true)pendencias.push('Falha crítica: revisar e refazer avaliação');
 if(e.evidenciaValidada!==true)pendencias.push('Evidência prática validada pelo gestor');
 if(dia>=60&&e.projetoComArquitetoValidado!==true)pendencias.push('Projeto e relação com arquiteto validados');
 if(dia===90){
  if(e.conteudoSierraAutorizado!==true)pendencias.push('Estudo baseado em materiais Sierra autorizados');
  if(e.competenciasValidadas!==true)pendencias.push('Competências de prontidão validadas');
  if(e.liberacaoGestor!==true)pendencias.push('Liberação explícita do gestor para atendimento Sierra');
 }
 return {marco,fase:marco.fase,aprovado:pendencias.length===0,pendencias,certificacaoAutomatica:false};
}
export function proximoPasso(e={}){
 const m30=avaliarMarco(30,e.m30||{});if(!m30.aprovado)return {dia:30,pendencias:m30.pendencias};
 const m60=avaliarMarco(60,e.m60||{});if(!m60.aprovado)return {dia:60,pendencias:m60.pendencias};
 const m90=avaliarMarco(90,e.m90||{});return {dia:90,pendencias:m90.pendencias,prontoSierra:m90.aprovado};
}