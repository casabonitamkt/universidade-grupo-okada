# Teste de regressão — evolução individual

Validações obrigatórias antes de promover a Central de Evolução:

- [ ] Abrir um consultor sem ações e confirmar estado vazio sem erro.
- [ ] Abrir um consultor com ação de gestão e confirmar vínculo exclusivo ao user_id/consultant_id.
- [ ] Abrir um consultor com alerta e confirmar título, mensagem, severidade e ação recomendada.
- [ ] Confirmar que alertas de outro consultor não aparecem no perfil aberto.
- [ ] Confirmar que a tela continua exibindo índice, aulas, Cliente IA, XP, competências, Marco Zero, plano 90 dias, missões, encontro semanal e certificações.
- [ ] Repetir em viewport desktop e mobile.
- [ ] Confirmar ausência de escrita em banco durante a simples abertura do perfil.

Critério de aprovação: todos os itens acima passam na homologação sem regressão e sem alteração de banco/RLS.
