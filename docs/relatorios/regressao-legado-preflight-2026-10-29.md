# Regressao critica do legado e preflight de publicacao — 29/10/2026

## Evidencia obtida no Supabase oficial (somente leitura)

- 66 aulas: 57 publicadas, 9 ocultas.
- **56 aulas historicas publicadas** possuem `content.minimum_score` e `content.retest_rule` mas **nao** possuem `questions_a`, `questions_b` ou `exam_required`.
- 10 aulas contem bancos A/B, das quais somente 1 estava publicada (F1-D29-A01, gabarito previamente exposto).
- 68 registros de `lesson_progress` concluidos no total; zero envios A/B.
- Schema `training_private` ausente. Vercel producao continua no commit `4fbf238ac154f3a34d1d2744e3856cb272795c70`.
- Nenhuma escrita foi feita no Supabase oficial durante esta auditoria.

## Defeito encontrado antes da publicacao

A versao anterior do PR #46 interpretava a mera existencia de `minimum_score` ou `retest_rule` como exigencia de prova A/B, tanto em `requiresLessonAssessment()` no frontend quanto em `training_private.exam_progress_guard()` no SQL. Isso mudaria indevidamente o comportamento das **56 aulas legadas**, podendo bloquear atualizacoes de progresso ja concluido e exibir provas inexistentes.

## Correcao isolada no PR #46

1. Frontend: `requiresLessonAssessment()` so ativa prova nova quando `exam_required===true` ou ha banco A/B em `content` antes da migracao.
2. SQL: `exam_progress_guard()` so protege aulas explicitamente marcadas como exame ou com banco A/B em `training_private.exam_banks`. Os metadados de avaliacao do legado nao sao provas transacionais.
3. Fixture SQL: aula historica ficticia agora inclui `minimum_score` e `retest_rule` reais, sem A/B.
4. Testes: regressao SQL de UPDATE de progresso concluido; regressao HTTP JWT/PostgREST de PATCH e leitura de progresso; regressao Node do detector do frontend.

Todos os testes devem passar no **SHA final**, incluindo PostgreSQL, PostgREST, Supabase CLI local, editorial/browser e Vercel Preview READY. Nao considerar aprovacoes de SHAs anteriores.

## Gates restantes antes de producao

- Confirmar por leitura o contrato de tabelas, tipos, triggers e politicas RLS reais; nao assumir equivalencia apenas por fixture.
- Backup confiavel, criptografado e restauravel de `lessons.content`, `submissions`, `lesson_progress`, `profiles`, certificacoes e tabelas correlatas. **Contagens nao sao backup.** Nao colocar dados reais em GitHub.
- Ensaiar restauracao/rollback em ambiente isolado. Se provas novas ja tiverem sido enviadas, preferir migracao aditiva, preservando bancos privados e trilha de auditoria.
- Confirmar Vercel Preview no mesmo SHA da migracao e um caminho de publicacao oficial coordenada, sem janela em que frontend e banco sejam incompatíveis.
- Testar login real de gestor/consultor, leitura de questoes sem gabarito, envio A, revisao, pratica e conclusao em ambiente de homologacao equivalente. Nao criar usuarios nem usar WhatsApp real sem autorizacao.
- Revisao editorial de F1-D30 (duas simulacoes) e depois D34-D39; D40 e D41 continuam bloqueadas por qualidade do conteudo.
- Snapshot e pos-checagem de UUIDs, quantidades, evidencias e conclusoes antes/depois de cada aula publicada.

**Regra de parada:** se backup, teste autenticado equivalente, deploy coordenado ou qualquer regressao falhar, manter PR #46 DRAFT e producao inalterada. Nao criar branch Supabase paga sem autorizacao.

## Revisao 30/10/2026 — identidade da aprovacao do Marco 30

- **Novo risco identificado na proposta:** as tres portas da Fase 2 (consulta das questoes, envio da prova e revisao gerencial) aceitavam somente `lesson_progress.status='completed'` no Marco 30. Um registro de progresso criado antes da migracao, sem prova A/B nem decisao do gestor, poderia liberar a Fase 2 mesmo sem avaliacao legitima.
- **Correcao proposta:** `training_private.has_approved_milestone30(user_id)` exige conjuntamente progresso `completed`, submissao A/B `approved`, decisao privada do gestor `approved` para o mesmo usuario/aula e timestamp de conclusao correspondente a `reviewed_at`. As tres portas F2 consultam a mesma funcao. O marco aprovado via RPC continua liberando a fase normalmente.
- **Regressoes:** fixture com terceiro consultor ficticio contendo progresso do Marco 30 pre-migracao, sem decisao; testes negativos SQL e JWT/PostgREST verificam que F2 continua bloqueada. O teste positivo original confirma F2 apos aprovacao real do Marco 30.
- **Leitura de producao:** 66 aulas, 57 publicadas/9 ocultas, 68 conclusoes totais, 56 de Thiago, 42 submissions, 8 certificacoes, zero provas A/B; **nenhum progresso no Marco 30**, `training_private` ausente. Nada foi escrito no Supabase real.
- **Estado de deploy:** a producao passou a `2e8b6721728eaee5fb4f29dc0591988e92ab39e6` (alteracao independente do CRM), mas ainda nao contem o gate do PR #46. O Preview do gate e separado da producao. Revalidar CI e Preview no SHA final antes de qualquer decisao.
- **Pendente:** backup criptografado com ensaio de restauracao, homologacao de permissoes no esquema real sem custo adicional e rollout frontend + migracao coordenado. **Sem migracao ou publicacao de novas aulas** ate esses gates serem atendidos.
