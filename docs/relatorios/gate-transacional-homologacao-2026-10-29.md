# Gate transacional das provas — PR de homologacao (29/10/2026)

## Estado consultado antes do trabalho
- GitHub main: `30f55c46ac8e3c4bc04c6621de0d388bd5db2889` (PR #43 integrado).
- Vercel producao: READY no commit anterior `4fbf238ac154f3a34d1d2744e3856cb272795c70`; nao afirmar que o PR #43 ja esta oficial.
- Supabase: 57 aulas publicadas, 9 ocultas; F1-D30 e F2-D34..41 ocultas. Nao foi feita nenhuma escrita de producao nesta branch.
- `list_branches` do Supabase retornou `[]`: nao existe ambiente de homologacao de banco ja provisionado. Criar branch pode gerar custo; **nao criar sem confirmacao de custo**, nem aplicar migracao em producao antes de homologacao.
- Politicas reais verificadas: `submissions_update_own` permite update do proprio exame, `progress_insert/update` permitem `completed` sem prova; nao havia triggers.
- Banco real tinha 42 missoes pendentes e nenhuma submissao A/B; 68 linhas `lesson_progress` com status `completed` no total (o recorte de Thiago anteriormente confirmado era 56; nao confundir totais).

## O que este PR prepara (NAO EXECUTA EM PRODUCAO)
1. Migracao `migrations/2026-10-29-manager-exam-gate-HOMOLOGACAO.sql`: indice unico A/B; trigger imutavel de provas; politica RLS propria restringida a missoes historicas; trigger de conclusao somente com decisao aprovada; tabela privada de auditoria; RPC `training_review_exam` SECURITY DEFINER com autorizacao via `auth.uid()` e `public.is_admin()`.
2. A RPC recalcula dez respostas no banco, aplica nota minima 8 e erro critico eliminatorio, exige evidencia/revisao escrita e nota pratica de 0 a 10, confirmacao da pratica pelo gestor e justificativa. Grava submissao e progresso na mesma transacao; se qualquer passo falhar, nada e concluido.
3. Interface gerencial chama somente a RPC, sem `UPDATE` direto de provas/progresso, e exige nota pratica, confirmacao e justificativa.
4. CI PostgreSQL 16 descartavel com papéis ficticios consultant/admin: envio valido, tentativa de falsificar aprovacao, duplicidade, reteste B, erro critico, aprovacao transacional, bloqueio de conclusao direta, imutabilidade e regressao historica.
5. Teste Node de UI valida que consultor nao chama RPC e gestor nao escreve diretamente no progresso.

## Limites importantes para liberar aulas
- O CI PostgreSQL isolado testa SQL/RLS com `auth.uid()` simulado. **Nao substitui teste Supabase real com tokens de usuarios ficticios e PostgREST**, desktop/mobile e Vercel READY no SHA correto.
- **As respostas corretas ainda estao em `lessons.content.questions_a/questions_b`**, que o consultor pode ler em aulas publicadas. Isso permite consultar o gabarito pelo navegador, mesmo com correcao server-side. Antes de certificar/liberar aulas com prova, mover chaves para armazenamento privado e servir perguntas sem gabarito, com testes de que consultant nao consegue ler respostas.
- Nao publicar F1-D30, F2-D34..40 enquanto o banco nao estiver homologado com credenciais ficticias e o gabarito protegido. F2-D41 permanece incompleta.
- PR #44 e independente e documental; nao equivale a aprovacao pedagogica das aulas.

## Ordem de homologacao e publicacao
1. Revisar o SQL e executar CI PostgreSQL. Corrigir falhas; inspecionar politica e privilegiados no projeto.
2. Provisionar ambiente Supabase de teste **somente se ja incluido sem custo adicional**; nao habilitar branch paga automaticamente. Aplicar migracao apenas no banco isolado.
3. Testar PostgREST autenticado com contas ficticias admin e consultant, concorrencia A/B, negacao de INSERT/UPDATE direto, fluxo historico e rollback. Testar isolamento de gabaritos.
4. Validar desktop/mobile no Vercel Preview do SHA exato; conferir todos os CI, depois deploy de producao quando o limite gratuito permitir.
5. Snapshot de contagens e IDs de progresso/submissions/certificacoes antes de qualquer migracao produtiva. Aplicar somente com rollback testado; conferir contagens apos cada passo.
6. Revisar F1-D30 editorialmente e publicar **uma aula por vez** com seu modulo (UUIDs preservados). Depois D34..40 em lotes pequenos; D41 so apos reescrita e testes.

## Rollback
- **Antes de qualquer prova nova enviada/aprovada:** com transacao e contagens verificadas, reverter somente objetos novos: trigger `training_exam_submission_guard`, trigger `training_exam_progress_guard`, RPC, politica `submissions_update_own` (restaurar expressao original), indice `submissions_exam_unique_attempt` e objetos privados. Validar `count(*)=0` em `training_private.exam_decisions` e em `submissions` para A/B antes de remover.
- **Se houver prova ou decisao real:** nao remover tabela privada, triggers nem indice (perderia evidencias e autorizacoes). Despublicar apenas aulas novas afetadas e corrigir por migracao aditiva; manter historico e audit trail.
- Reverter frontend via commit GitHub/Vercel anterior sem apagar dados. Confirmar que progresso historico e certificacoes nao mudaram.

**Status:** PR de homologacao, sem aplicacao em Supabase real, sem publicacao de aulas e sem custo adicional.


## Auditoria adicional de segurança — 29/10/2026 (continuação)
- **Falha crítica real identificada:** a política `profiles_self_update` permitia que o próprio usuário atualizasse `profiles.role`. Sem proteção, um consultor poderia virar `admin` e acessar a RPC de aprovação. A proposta agora adiciona o trigger `training_profile_role_guard`, que impede a alteração de papel por não administradores. Incluído teste de escalada de privilégios no PostgreSQL isolado. **Ainda não aplicado na produção.**
- **Gabaritos privados:** a migração proposta cria `training_private.exam_banks`, copia atomicamente as questões A/B e respectivas chaves de `lessons.content` e remove os bancos completos da coluna pública. A coluna passa a conter apenas `exam_required=true`. As perguntas sem respostas são servidas por `training_exam_questions`; o gestor consulta a nota pelo RPC autenticado `training_exam_audit`; a RPC `training_review_exam` corrige a partir do banco privado. O consultor não recebe `correct_index` nem `critical`.
- O frontend de homologação foi adaptado: não calcula nem mostra nota preliminar; solicita questões ao servidor, envia respostas como pendentes e exige a revisão gerencial antes do reteste B. **Não usar frontend novo com banco antigo ou banco novo com frontend antigo.**
- Reteste B exige prova A com reprovação teórica e decisão gerencial `needs_revision`; o servidor recusa tentativas prematuras. A aula histórica sem prova permanece no fluxo anterior.
- A publicação deve seguir **ordem coordenada**: teste isolado completo, auditoria de acesso ao perfil, testes PostgREST com tokens fictícios, snapshot de `lessons.content`/bancos/progresso, migração transacional, deploy do frontend correspondente no SHA exato, teste funcional autenticado e só então publicar D30. Se a Vercel não puder implantar o SHA, não migrar produção porque a interface antiga não é compatível.
- **Rollback atualizado:** não apagar `training_private.exam_banks` após remover gabaritos públicos; isso destruiria as respostas oficiais. Antes de qualquer rollback, preservar backup cifrado e conferir integridade de cada banco. Se não houver provas novas, é possível reverter frontend e restaurar `lessons.content` a partir do backup sob controle administrativo, mas isso volta a expor gabaritos; preferir roll-forward. Se houver provas ou decisões reais, manter bancos privados e auditoria, corrigindo por migração aditiva. Não remover proteção de `profiles.role` em rollback.
- A existência de uma única aula publicada com banco A/B exposto (F1-D29-A01) foi confirmada em leitura. Nenhuma questão, chave, status de publicação, conclusão, perfil ou certificação foi alterada na produção por esta revisão.

- **Quarentena dos gabaritos já expostos:** a migração registra `keys_previously_public=true` para qualquer aula que já estivesse publicada antes da transferência para o banco privado. O servidor impede abrir, enviar ou aprovar essas provas até que o gestor aprove um banco de questões substituto e uma migração auditada libere a nova versão. Isso afeta especialmente a prova do dia 29, cujas respostas já estiveram acessíveis. A aula pode permanecer publicada como conteúdo, mas **não pode gerar conclusão por essa prova antiga**. O teste isolado inclui uma aula fictícia anteriormente exposta e confirma o bloqueio.

## Revisão adicional de RPCs — 29/10/2026
- Corrigido caso de `p_stage=NULL` em `training_exam_questions`: antes, o teste `p_stage NOT IN ('a','b')` retornava NULL, e o `CASE ... ELSE questions_b` poderia expor as perguntas B antes do reteste autorizado. Agora rejeita explicitamente stage nulo. Incluídos testes de stage nulo e B prematuro.
- Corrigido `p_decision=NULL` em `training_review_exam`: antes, `NOT IN` com NULL não falhava e o `CASE` poderia registrar `needs_revision` involuntariamente. Agora rejeita decisão nula. Incluído teste de regressão em papel admin.
- Testes e Vercel devem ser revalidados no **SHA novo**; resultados verdes do SHA anterior não equivalem a homologação do novo commit.
- A proteção permanece apenas em PR draft; sem escrita no Supabase real e sem publicação de aulas.
