/* Homologação editorial: validações locais, sem banco ou certificação. */
export const MINIMO_EVIDENCIA=60;
export const MINIMO_REVISAO=80;
export function validarEtapas(campos={}){
 const etapas=[["Aprender",campos.aprendizado],["Demonstrar",campos.demonstracao],["Praticar",campos.pratica],["Simular",campos.simulacao]];
 const pendencias=etapas.filter(([,texto])=>String(texto??"").trim().length<MINIMO_EVIDENCIA).map(([nome])=>nome);
 return {apto:pendencias.length===0,pendencias};
}
export function validarRevisao(texto,resultado){
 if(!resultado||resultado.aprovado!==false||!Array.isArray(resultado.revisar)||resultado.revisar.length===0)
  return {apto:false,motivo:"Reteste disponível somente após reprovação com temas identificados."};
 if(String(texto??"").trim().length<MINIMO_REVISAO)
  return {apto:false,motivo:"Explique, em pelo menos 80 caracteres, o que aprendeu ao revisar os temas em que errou."};
 return {apto:true,motivo:"Revisão registrada somente nesta página de homologação."};
}
