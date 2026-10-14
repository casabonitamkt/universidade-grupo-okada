/* Universidade Grupo Okada — regras comerciais puras, sem escrita em banco.
 * Integração à interface exige validação de permissões e homologação.
 */
export const ETAPAS = Object.freeze([
  "Lead","Diagnóstico/Projeto","Projeto recebido/Orçamento",
  "Proposta","Follow-up","Negociação","Venda","Perda"
]);
const txt = value => String(value ?? "").trim();
const money = value => Number(value);
export function validarOportunidade(o) {
  const erros=[];
  if(!o || typeof o!=="object") return ["Oportunidade inválida"];
  if(!txt(o.responsavel)) erros.push("Informe o responsável");
  if(!txt(o.loja)) erros.push("Informe a loja");
  if(!ETAPAS.includes(o.etapa)) erros.push("Etapa inválida");
  if(o.tipo && !["projeto","peça"].includes(o.tipo)) erros.push("Tipo deve ser projeto ou peça");
  if(o.valorProposto!==undefined && (!Number.isFinite(money(o.valorProposto)) || money(o.valorProposto)<0)) erros.push("Valor proposto inválido");
  if(o.etapa==="Venda" && (!Number.isFinite(money(o.valorFechado)) || money(o.valorFechado)<=0)) erros.push("Venda exige valor fechado positivo");
  if(o.etapa==="Perda" && !txt(o.motivoPerda)) erros.push("Perda exige motivo");
  return erros;
}
export function podeConcluirPerda(o, gestorAprovou) {
  return o?.etapa==="Perda" && Boolean(txt(o.motivoPerda)) && gestorAprovou===true;
}
export function diagnosticarBriefing(o={}) {
  const campos=[["cidade","cidade"],["tipo","projeto ou peça"],["origem","origem do contato"],["briefing","necessidade do cliente"],["proximoContato","próximo contato"]];
  return campos.filter(([chave])=>!txt(o[chave])).map(([,rotulo])=>rotulo);
}
export function sugestaoCopiloto(o={}) {
  const faltantes=diagnosticarBriefing(o);
  const primeira=faltantes[0];
  return {
    faltantes,
    acao: primeira ? "Completar briefing antes de avançar" : "Revisar próxima interação com o cliente",
    respostaSugerida: primeira==="projeto ou peça"
      ? "Para te atender melhor, você está buscando uma peça específica ou mobiliário para um projeto completo?"
      : primeira==="cidade"
      ? "Em qual cidade será o ambiente? Assim consigo orientar o atendimento corretamente."
      : "Posso confirmar os detalhes do seu projeto e combinar o melhor momento para retomarmos?",
    exigeRevisaoHumana:true,
    envioAutomatico:false,
    definePrecoOuDesconto:false
  };
}
export function indicadores(oportunidades=[]) {
  const total=oportunidades.length;
  const vendas=oportunidades.filter(o=>o.etapa==="Venda");
  const perdas=oportunidades.filter(o=>o.etapa==="Perda");
  return {total,vendas:vendas.length,perdas:perdas.length,
    taxaConversao:total?Number((100*vendas.length/total).toFixed(1)):0,
    valorFechado:vendas.reduce((s,o)=>s+(Number(o.valorFechado)||0),0)};
}
