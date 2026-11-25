'use strict';

const CRM_CHECKLIST = [
  ['Apresentação do consultor', /\b(?:meu nome e|eu sou|aqui e o|aqui e a)\b/],
  ['Projeto novo ou renovação', /\b(?:projeto novo|novo projeto|reforma|renovacao|renovar)\b/],
  ['Projeto ou foto do espaço', /\b(?:enviar|mandar|compartilhar)\s+(?:(?:uma|a|o|seu)\s+)?(?:foto|projeto|planta)\b/],
  ['Uso do espaço ou da peça', /\b(?:como (?:vai|pretende) usar|uso do espaco|uso no dia a dia|como sera o uso)\b/],
  ['Ambiente', /\b(?:ambiente|sala|quarto|varanda)\b/],
  ['Medidas', /\b(?:medidas?|largura|altura|profundidade|metragem)\b/],
  ['Estilo e acabamento', /\b(?:estilo|tecidos?|acabamentos?|materiais|cor|cores)\b/],
  ['Investimento', /\b(?:investimento|orcamento|faixa de valor)\b/],
  ['Prazo', /\b(?:prazo|data de entrega|quando precisa)\b/],
  ['Próximo passo', /\b(?:proximo passo|posso retornar|vamos agendar|combinamos)\b/],
];

function renderCrmChecklist(container, messages, summary, stage) {
  const outgoing = messages
    .filter(message => message.direction === 'saida' && message.kind === 'text' && typeof message.body === 'string')
    .map(message => ({
      body: message.body.trim(),
      normalized: message.body.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase(),
    }));
  const evidenceByTopic = CRM_CHECKLIST.map(([topic, pattern]) => ({
    topic,
    evidence: outgoing.find(message => pattern.test(message.normalized))?.body,
  }));
  const rows = evidenceByTopic.map(({topic, evidence}) => {
    const item = document.createElement('li');
    const status = document.createElement('strong');
    status.textContent = topic + (evidence ? ' · mencionado' : ' · sem menção no histórico exibido');
    item.append(status);
    if (evidence) {
      const quote = document.createElement('blockquote');
      quote.textContent = evidence.length > 240 ? evidence.slice(0, 240) + '…' : evidence;
      item.append(quote);
    }
    return item;
  });
  container.replaceChildren(...rows);

  if (!summary) return;
  const covered = evidenceByTopic.filter(item => item.evidence).length;
  const next = evidenceByTopic.at(-1);
  const missing = evidenceByTopic.find(item => !item.evidence);
  const closed = stage === 'ganho' || stage === 'perdido';
  const result = {ganho: 'Venda registrada como concluída.', perdido: 'Venda registrada como perdida.'}[stage]
    || 'Atendimento em aberto.';
  const coaching = !outgoing.length
    ? 'Ainda não há mensagens de texto do consultor no histórico exibido.'
    : !closed && !next.evidence
      ? 'Para revisar: confirme se ficou combinado um próximo passo e uma data de retorno.'
      : missing
        ? 'Para revisar: verifique se faz sentido abordar ' + missing.topic.toLocaleLowerCase('pt-BR') + '.'
        : 'Confira nos trechos se as informações registradas ficaram claras para o cliente.';
  summary.textContent = result + ' ' + covered + ' de ' + evidenceByTopic.length + ' temas mencionados. ' + coaching;
}

function renderCrmReturnStatus(target, lead, now = new Date()) {
  const date = lead?.next_contact_on;
  target.hidden = !lead || ['ganho','perdido'].includes(lead.stage);
  let status = '';
  if (!target.hidden) {
    if (date) {
      const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'America/Sao_Paulo'}).format(now);
      const label = date < today ? 'Retorno atrasado' : date === today ? 'Retorno hoje' : 'Retorno agendado';
      status = label + ' · ' + date.split('-').reverse().join('/') + ' · ' + (lead.next_contact_action || '');
    } else {
      status = 'Sem data de retorno combinada.';
    }
  }
  if (target.textContent !== status) target.textContent = status;
}
