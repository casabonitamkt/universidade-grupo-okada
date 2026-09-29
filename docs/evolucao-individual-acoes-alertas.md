# Contrato de UI — Central de Evolução individual

Status: implementável sem alteração de banco/RLS.

## Blocos obrigatórios

Ao abrir um consultor em **Equipe e evolução**, a Central de Evolução deve exibir, além dos indicadores atuais:

### Ação da liderança
- Filtrar `manager_action_queue` pelo usuário aberto (`user_id` ou `consultant_id`).
- Exibir quantidade de ações.
- Para cada ação, mostrar `next_manager_action`, `management_priority` e `channel_priority`.
- Estados CRÍTICA e ALTA devem manter o destaque visual já usado na Central de Comando.
- Sem ações: “Nenhuma ação específica da liderança neste momento.”

### Alertas inteligentes
- Filtrar `intelligent_alerts` pelo usuário aberto (`user_id` ou `consultant_id`).
- Exibir quantidade de alertas abertos.
- Mostrar título, severidade, mensagem e `recommended_action`.
- Reutilizar os destaques `alertCritical` e `alertPositive`.
- Sem alertas: “Nenhum alerta aberto para este consultor.”

## Regressão obrigatória
1. Abrir consultor A nunca mostra ação/alerta do consultor B.
2. Abrir perfil é somente leitura e não grava banco.
3. Indicadores existentes (índice, aulas, Cliente IA, XP, competências, plano, missões, semanal e certificações) permanecem visíveis.
4. Os dois novos blocos devem empilhar corretamente no mobile.
5. Dados ausentes devem produzir estado vazio, sem erro JavaScript.

## Próxima integração
Após a UI, sinais críticos devem alimentar a priorização do Meu Dia sem duplicar tarefas já presentes na fila do gestor.
