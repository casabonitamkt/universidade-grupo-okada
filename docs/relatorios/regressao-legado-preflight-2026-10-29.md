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
