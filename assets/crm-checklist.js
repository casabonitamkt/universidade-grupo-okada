'use strict';

const CRM_CHECKLIST = [
  ['Ambiente', /\b(?:ambiente|sala|quarto|varanda)\b/],
  ['Medidas', /\b(?:medidas?|largura|altura|profundidade|metragem)\b/],
  ['Estilo e acabamento', /\b(?:estilo|tecidos?|acabamentos?|materiais|cor|cores)\b/],
  ['Investimento', /\b(?:investimento|orcamento|faixa de valor)\b/],
  ['Prazo', /\b(?:prazo|data de entrega|quando precisa)\b/],
  ['Próximo passo', /\b(?:proximo passo|posso retornar|vamos agendar|combinamos)\b/],
];

function renderCrmChecklist(container, messages) {
  const outgoing = messages.filter(message => message.direction === 'saida' && message.kind === 'text' && message.body);
  const rows = CRM_CHECKLIST.map(([topic, pattern]) => {
    const match = outgoing.find(message => pattern.test(message.body.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()));
    const item = document.createElement('li');
    const status = document.createElement('strong');
    status.textContent = topic + (match ? ' · mencionado' : ' · sem menção no histórico exibido');
    item.append(status);
    if (match) {
      const evidence = document.createElement('blockquote');
      const body = match.body.trim();
      evidence.textContent = body.length > 240 ? body.slice(0, 240) + '…' : body;
      item.append(evidence);
    }
    return item;
  });
  container.replaceChildren(...rows);
}
