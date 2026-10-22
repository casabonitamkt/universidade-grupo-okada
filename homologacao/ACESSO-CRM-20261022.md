# CRM de homologação

A demonstração visual está em `/homologacao/crm-piloto.html` e usa apenas registros fictícios no navegador.

O painel autenticado experimental está em `/crm.html` e depende da sessão da Universidade e de permissões no Supabase.

Nenhum dos dois comprova integração WhatsApp, Instagram ou Facebook. Não utilizar para clientes reais antes de validação E2E e aprovação.

A homologação não altera a produção e não registra notas oficiais.

## Verificação técnica (22/10/2026)

- Supabase: tabelas `homologacao_trilha_90_progresso` e `business_opportunities` existem com RLS ativado.
- Política de progresso: aluno autenticado só pode inserir/alterar seus próprios registros; leitura do próprio usuário ou administrador.
- Restrições: `dia` de 1 a 90, `tentativa` de 0 a 100, nota provisória de 0 a 10 e etapas permitidas.
- Teste puro do histórico: sintaxe, descarte de histórico inválido, reprovação, reteste, aprovação >= 8 e recarga JSON passaram.
- Limites: sem E2E autenticado nem confirmação de gravação/releitura reais; sem integração de canais; produção preservada.
