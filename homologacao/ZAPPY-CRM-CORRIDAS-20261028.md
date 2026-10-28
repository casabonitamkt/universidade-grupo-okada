# Revisão de segurança: concorrência Zappy → CRM piloto (28/10/2026)

**Escopo:** apenas código de homologação, sem webhook registrado, sem envio de mensagens e sem alterar produção, banco, RLS, dados ou variáveis de ambiente.

## Evidência observada (consulta SQL somente leitura)
- `crm_pilot_leads`: RLS ligado, índice UNIQUE `(source, phone)`; `owner_consultant_id` não integra a chave única.
- `crm_pilot_messages`: RLS ligado, índice UNIQUE `(source, instance_id, external_message_id)`.
- O código anterior filtrava lead por `owner_consultant_id`, apesar da chave única ser por `(source, phone)`. Em caso de lead de outro consultor, a criação poderia gerar conflito repetido. Também tratava inserção simultânea de mensagem como erro genérico, sem conferir a duplicata.

## Correção proposta
1. Buscar lead pela chave única real `source+phone`; recusar leitura/gravação se não pertencer ao Thiago, sem transferir proprietário.
2. Quando duas requisições criarem o mesmo lead, aceitar `409` apenas depois de reler e confirmar proprietário.
3. Quando duas requisições gravarem a mesma mensagem, aceitar `409` como duplicata apenas depois de reler e confirmar a existência.
4. Testes offline com respostas Supabase simuladas; nenhum número ou credencial real.

## Critérios antes de integrar ao PR de homologação
- Node tests e CI verdes, incluindo regressão existente.
- Validar que nenhum teste usa mensagens reais e que o código não realiza envio WhatsApp.
- Confirmar o payload/assinatura HMAC no painel/documentação da Zappy, sem revelar segredos.
- Revisar acesso de terceiros e proteção SSO do Preview; não desligar autenticação global.
- Avaliar retenção, consentimento e permissões de leitura de CRM.
- Manter `ZAPPY_INBOUND_ENABLED=false` até homologação técnica.
- Não publicar na oficial nem habilitar integração sem nova revisão.

## Observação
Essa correção não prova a integração ponta a ponta. Não altera a estrutura do banco e não libera atendimento automático.
