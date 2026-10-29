# Gate de publicação das aulas com prova — auditoria RLS e plano de homologação
Data: 29/10/2026 (BRT). Escopo: consultas somente leitura em Supabase, revisão do PR #43 e Vercel. **Nenhuma alteração de banco, política, nota ou progresso nesta etapa.**

## Inventário confirmado
- `public.lessons`: 66 registros, **57 publicados** e **9 ocultos**.
- Thiago: **56 aulas concluídas**. `submissions` com `submission_type IN ('lesson_exam_a','lesson_exam_b')`: **zero**.
- Produção Vercel `main` `4fbf238ac154f3a34d1d2744e3856cb272795c70`: READY.
- PR #43: apenas auditoria visual das provas e testes; nenhuma autorização de conclusão/certificação. Não publicar novas aulas só por este PR.

## Bloqueio crítico identificado nas permissões atuais
Consultas de `pg_policies`, `information_schema.role_table_grants` e `information_schema.triggers` confirmaram:
1. `lesson_progress`: políticas `progress_insert` e `progress_update` permitem a `auth.uid()` criar/atualizar a própria linha sem condicionar `status='completed'` à prova, prática ou autorização gerencial. `authenticated` possui privilégios de INSERT/UPDATE. Não há trigger de validação nessas tabelas. **A interface bloqueia conclusão, mas o banco ainda não impõe esse gate para aulas com prova.**
2. `submissions`: `submissions_insert` aceita o próprio `user_id` sem exigir `status='pending'` ou campos de revisão nulos. `submissions_update_own` permite UPDATE da própria submissão sem restringir status, feedback ou reviewer. A política administrativa é permissiva, mas não neutraliza a política do próprio usuário. `authenticated` possui INSERT/UPDATE.
3. Portanto, **não é seguro confiar no status da submissão, na nota preliminar do navegador ou na marcação de conclusão feita pelo cliente**. O PR #43 corrige a exibição de gabaritos, não esse bloqueio de autorização. Esta conclusão decorre da estrutura SQL; falta um teste autenticado de tentativa de bypass com usuário de homologação, sem tocar dados reais.

## Caminho de correção sem interromper o Thiago
1. Preparar em branch separada e validar em ambiente de homologação uma migração **restrita às aulas que exigem prova**. Não revogar indiscriminadamente o fluxo antigo de aulas sem prova: as 56 conclusões históricas devem permanecer intactas.
2. Para provas novas, permitir ao consultor apenas envio inicial pendente com `user_id=auth.uid()`, `reviewer_id/reviewed_at/reviewer_feedback IS NULL`, `submission_type` e `lesson_id` válidos; impedir alteração pelo próprio consultor após envio, mudança de status e falsificação de aprovação. Validar também unicidade lógica das tentativas A/B, inclusive concorrência de requisições.
3. Encaminhar aprovação ao **servidor** (RPC SECURITY DEFINER auditada ou endpoint server-side com autenticação real, autorização administrativa verificada no banco, validação transacional de respostas/gabaritos, critérios de prática e auditoria). Não usar a pontuação calculada pelo navegador como autorização.
4. Proteger `lesson_progress` contra INSERT/UPDATE `completed` pelo consultor nas aulas com prova, inclusive requisições diretas à API; apenas o caminho de aprovação validado deve concluir. Manter o comportamento existente das aulas históricas sem prova, com regressão explícita.
5. Testar em usuário **fictício de homologação**: (a) prova A com 8/10 sem erros críticos; (b) falha por erro crítico; (c) reteste B após reprovação; (d) duplicação e concorrência; (e) tentativa de aprovar própria submissão; (f) tentativa de concluir diretamente; (g) gestor autorizado aprova após prática; (h) usuário não gestor não aprova; (i) rollback sem apagar histórico.
6. Revalidar permissões e conteúdo de `F1-D30-A01` antes do marco 30. Só depois avaliar os dias 34, 35 e 36 e publicar **um pequeno lote de cada vez**, conferindo contagens e progresso antes/depois.

## Revisão de conteúdo ainda pendente
- D34 e D35: bancos A/B 10+10 estruturalmente válidos, com cinco questões críticas em cada prova. **Validação pedagógica do texto completo, regras comerciais e fonte técnica ainda necessária**.
- D35: `retest_rule` estruturada ausente; confirmar regra aplicável no fluxo.
- D40: banco sem questões marcadas críticas; não liberar sem revisão.
- D41: `body` e `mission` vazios e questões incompatíveis com o formato de avaliação; não liberar.

## Critério objetivo para publicação
Publicar somente se houver revisão de conteúdo e gabaritos, aprovação gerencial transacional efetiva, RLS testada contra bypass, CI GitHub concluído com sucesso, navegador desktop/mobile homologado, Vercel READY no SHA exato e plano de reversão. **Preview READY sozinho não demonstra CI nem autorização segura.**

Este documento registra um bloqueio técnico verificável. Não executa migração, altera políticas, credenciais, WhatsApp ou dados de usuários.
