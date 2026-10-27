# Zappy → CRM do Thiago (somente recebimento; homologação)

Estado: **código preparado, NÃO ATIVADO**. Autorização do gestor em 27/10/2026 para receber e registrar mensagens reais **somente em homologação**, sem resposta automática.

## Segurança e limites
- Função isolada `/api/zappy-inbound` na branch de homologação; só aceita POST em `VERCEL_ENV=preview` com `ZAPPY_INBOUND_ENABLED=true`.
- HMAC-SHA256 de **bytes originais** do corpo, header `X-Webhook-Signature: sha256=<hex>` conforme documentação do provedor: https://zappy.api.br/docs/webhooks.
- Rejeita assinatura inválida, outra instância, grupos e mensagens enviadas pelo próprio número.
- Registra apenas mensagens recebidas de contatos individuais, texto limitado a 10 mil caracteres; mídia somente tipo, **sem baixar arquivos**.
- Usa somente `crm_pilot_leads` e `crm_pilot_messages`, já existentes, RLS preservado. Não escreve em aulas, notas, certificações ou progresso do Thiago.
- Nenhuma rota de envio WhatsApp, digitação, IA de pré-atendimento ou resposta automática.
- Checagem de duplicidade por `instance_id + external_message_id` antes de inserir, mas **não há garantia de idempotência em corridas simultâneas** sem restrição única no banco; não alterar esquema sem aprovação.
- A função falha fechada (503) sem configuração; a Zappy pode repetir eventos, conforme documentação.

## Pré-requisitos antes de criar webhook no painel Zappy
1. Conferir deploy de **preview READY** da branch e testar endpoint com assinatura inválida (401) e evento simulado assinado (200), sem usar dados reais nesse teste.
2. Configurar **apenas no Preview Vercel** estas variáveis de ambiente (valores reais, nunca commitados):
   - `ZAPPY_INBOUND_ENABLED=true`
   - `ZAPPY_WEBHOOK_SECRET` — segredo aleatório forte, igual ao campo Segredo da Zappy; **não compartilhar no chat**.
   - `ZAPPY_INSTANCE_ID` — UUID da instância do Thiago, conferido no painel.
   - `CRM_THIAGO_USER_ID` — UUID do perfil real do Thiago no Supabase, conferido pelo administrador; não inventar.
   - `SUPABASE_URL` — URL do projeto Supabase existente.
   - `SUPABASE_SERVICE_ROLE_KEY` — chave secreta **somente no servidor/Preview**; nunca colocar no navegador, chat ou repositório.
3. Confirmar que o deploy Preview é alcançável pela Zappy (a proteção SSO do Vercel pode bloquear webhooks externos); **não desabilitar proteção global** sem avaliar risco. Se não houver URL pública segura, manter desativado.
4. Criar webhook **somente após o teste seguro**, com URL exata do deploy de homologação `https://<preview>/api/zappy-inbound`, eventos inicialmente **apenas** `message.received` e segredo HMAC preenchido. Não usar URL da produção.
5. Enviar uma mensagem de teste **a partir de um contato autorizado**, verificar recebimento e registro apenas no CRM piloto do Thiago; conferir que o WhatsApp não respondeu sozinho. Desligar flag se qualquer anomalia.
6. Testar retry, duplicidade, escopo por consultor, retenção/privacidade e volume antes de considerar expansão.

## Pendências / critérios de aceite
- CI Node e smoke HTTP de preview; deploy READY ainda a confirmar.
- Segredos reais ausentes no ambiente Preview (não foram criados nesta execução).
- Acesso público seguro ao webhook (SSO) ainda não validado.
- Verificação de gravação ponta a ponta e idempotência sob concorrência.
- Validação de acesso às mensagens somente pelo Thiago e gestores autorizados no CRM.
- Nenhuma ativação real feita por esta mudança; **não publicar na oficial**.

## Verificação operacional após autorização (27/10/2026)
- Gestor confirmou contratação da Zappy e autorizou **teste real de entrada**, somente para o número comercial do Thiago, em homologação e sem respostas automáticas.
- Vercel: preview do commit `03b28d85` confirmado READY; variáveis necessárias ao webhook **não existem** no projeto (somente `BRUNO_OPENING_URL` em produção).
- Proteção de deployment Vercel: `ssoProtection.enabled=true` com `deploymentType=all_except_custom_domains`. A URL `*.vercel.app` do preview pode exigir login e **não deve ser cadastrada como webhook externo antes de teste HTTP de acessibilidade**. Não desligar SSO global; avaliar acesso pontual e seguro ou domínio customizado exclusivo de homologação após aprovação.
- Não há teste HTTP externo concluído, nem webhook real criado, nem mensagem real registrada. A autorização para testar não equivale a sucesso de conexão.
- Não registrar ou solicitar segredos pelo chat. Administrador deve configurar chaves no painel seguro da Vercel, **somente Preview e restritas à branch**, e segredo HMAC no painel Zappy. Sem esses valores, manter `ZAPPY_INBOUND_ENABLED` ausente ou `false`.
- Antes da ativação, conferir **na documentação/painel da Zappy** o formato real do cabeçalho de assinatura, instância e corpo; não assumir que a integração Z-API usa o mesmo payload. Testar primeiro requisições simuladas sem dados pessoais.
- Requer validação de acesso ao CRM piloto e da política de retenção antes de gravar dados reais. Sem alterar esquema/RLS.
