// Regras puras do CRM: nenhum envio, precificacao ou alteracao de dados aqui.
// Integracao com Supabase e politicas de acesso deve ser testada separadamente.
export const STAGES = Object.freeze(['mapped','contacted','meeting','proposal','future','negotiation','won','lost']);
const finiteMoney = value => {
  const n = Number(String(value ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};
export function buildTransition(lead, stage, options = {}) {
  if (!lead || !STAGES.includes(stage)) throw new Error('Etapa invalida.');
  const meta = { ...(lead.meta || {}) };
  if (stage === 'won') {
    const amount = finiteMoney(options.closedValue);
    if (amount === null) throw new Error('Informe valor fechado maior que zero.');
    meta.closed_value = amount;
  }
  if (stage === 'lost') {
    const reason = String(options.lossReason || '').trim();
    if (!reason) throw new Error('Informe motivo da perda.');
    meta.loss_reason = reason;
    meta.manager_loss_validated = false; // somente gestor confirma depois, no backend autorizado
  }
  meta.last_interaction = options.now || new Date().toISOString();
  return { stage, meta };
}
export function missingBriefing(lead) {
  const meta = lead?.meta || {};
  const checks = [
    ['cidade',meta.city],['projeto ou peca',meta.kind],
    ['arquiteto (confirmar se existe)',meta.architect_confirmed],
    ['projeto, foto ou medidas',meta.project_received_or_not_applicable],
    ['prazo',meta.deadline],['expectativa de investimento',meta.budget_checked],
    ['proximo contato',lead?.next_action_date]
  ];
  return checks.filter(([,v])=>v===undefined || v===null || v==='').map(([label])=>label);
}
export function suggestedFollowUp(lead) {
  const stage = lead?.stage;
  if (stage === 'won') return 'Confirmar entrega e combinar acompanhamento pos-venda.';
  if (stage === 'lost') return 'Aguardar validacao gerencial da perda; nao reativar automaticamente.';
  if (stage === 'proposal' || stage === 'future')
    return 'Retomar a proposta com contexto, perguntar o que falta para decidir e combinar data do retorno.';
  if (stage === 'negotiation')
    return 'Pedir ao cliente a condicao desejada; confirmar se, obtida aprovacao interna, ele fecha hoje. Nao prometer desconto.';
  return 'Confirmar projeto/foto e medidas, cidade, prazo, arquiteto e necessidades antes de recomendar produto.';
}
export function canSendToExternalAI(lead) {
  return lead?.meta?.ai_analysis_consent === true;
}
export function managerLossQueue(leads) {
  return (leads || []).filter(x=>x.stage==='lost' && x.meta?.loss_reason && x.meta.manager_loss_validated !== true);
}
export function indicators(leads) {
  const all=leads||[],won=all.filter(x=>x.stage==='won'),lost=all.filter(x=>x.stage==='lost');
  return {
    total:all.length, won:won.length,lost:lost.length,
    conversionRate:all.length?won.length/all.length:0,
    proposed:all.reduce((s,x)=>s+(finiteMoney(x.estimated_value)||0),0),
    closed:won.reduce((s,x)=>s+(finiteMoney(x.meta?.closed_value)||0),0),
    pendingLosses:managerLossQueue(all).length
  };
}
