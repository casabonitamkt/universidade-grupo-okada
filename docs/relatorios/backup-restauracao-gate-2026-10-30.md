# Pré-publicação do gate gerencial — backup e ensaio de restauração (30/10/2026)

> **Documento operacional. Não é um backup executado.** Não aplicar a migração `2026-10-29-manager-exam-gate-HOMOLOGACAO.sql` nem publicar D30/D34–D39 antes de registrar um backup real **e um ensaio de restauração concluído**. Nenhum segredo, dump ou dado pessoal deve entrar no GitHub, Vercel, logs de CI ou conversa.

## Evidência read-only do ambiente oficial — 30/10/2026

- Supabase `mjtphztvjnfjlhtxtwjz`: **66 aulas**, **57 publicadas**, **9 ocultas**; **68** conclusões de aulas totais, **42** submissões, **0** provas A/B, **8** certificações no catálogo. `training_private` ainda não existe.
- `F1-D30-A01` está oculto, com módulo oculto e zero linhas de progresso. D34–D41 também ocultos; D41 ainda sem `body` e `mission`.
- RLS ativa em `profiles`, `lessons`, `modules`, `submissions`, `lesson_progress` e `certifications`. O trigger **já existente** `trg_protect_profile_privileged_fields` protege alterações de `role` e `graduation`; o guard adicional do PR46 é defesa em profundidade, **não** uma correção de uma escalada de papel ainda presente na produção.
- Vercel produção **READY** no SHA `b099c31bcc6c35bd0c7c1c215ed0513951939c0c`, sem o gate do PR46; Preview PR46 `f5a070e6755d553943f5f2db246b9c053a734b63` READY, com CI aprovado no mesmo SHA.
- Nenhuma migração nem publicação de aula foi feita nesta auditoria.

## Procedimento de backup sem contratação de plano

Responsável: operador autorizado da loja, **na máquina de confiança**, com acesso ao banco existente. O ChatGPT não possui a senha de conexão e **não deve solicitá-la**.

1. Instalar Supabase CLI e Docker; confirmar espaço livre, versão da CLI e o projeto de origem no painel. No painel Supabase, em **Connect**, obter a conexão direta ou o **Session pooler**. Não usar Transaction pooler.
2. Criar pasta local protegida, com permissão exclusiva. Definir `DB_URL` localmente sem registrar a senha em Git, prints ou histórico de terminal. **Não compartilhar a URL.**
3. Fazer os três dumps recomendados pela documentação oficial (a partir da pasta protegida):

```bash
umask 077
supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$DB_URL" -f schema.sql
supabase db dump --db-url "$DB_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
test -s roles.sql && test -s schema.sql && test -s data.sql
```

4. Verificar ausência de erros, datas, tamanhos e hash dos três arquivos. **Não** considerar um arquivo vazio, erro de permissão ou dump parcial como backup. Guardar cópia criptografada em local seguro, fora da máquina original, com chave sob controle do proprietário; excluir cópias temporárias em texto claro **somente depois** da verificação da restauração e da cópia criptografada.
5. **Ensaio de restauração obrigatório:** usar instância Supabase **local descartável**, nunca o projeto oficial nem outro ambiente com dados reais. Restaurar `roles.sql`, `schema.sql` e `data.sql` na ordem da documentação, observando incompatibilidades de extensões/roles e RLS. Validar contagens, UUIDs, 42 submissões, 68 conclusões e acesso às evidências. Documentar versão Postgres, início/fim, checksums, erros e resultado. Se não for possível restaurar integralmente em ambiente isolado, o gate permanece bloqueado.
6. Fazer também backup de **objetos de Storage** e configurações externas que forem relevantes: dump SQL contém metadados, mas **não** os arquivos de Storage. Conferir anexos de evidências e documentos.
7. Registrar um atestado sem dados pessoais: data/hora, nome do responsável, SHA-256 do arquivo **criptografado**, localização segura sob responsabilidade da loja (sem URL pública), resultado de restauração, contagens, versões e aprovação de rollback.

## Pré-checagem read-only (não gera backup)

Executar no SQL Editor apenas para comparar números **antes** e **depois**; nunca exportar conteúdo de `profiles`, `submissions` ou `lesson_progress` para repositórios.

```sql
select
 (select count(*) from public.lessons) lessons_total,
 (select count(*) from public.lessons where is_published) lessons_published,
 (select count(*) from public.lessons where not is_published) lessons_hidden,
 (select count(*) from public.lesson_progress where status='completed') completed_total,
 (select count(*) from public.submissions) submissions_total,
 (select count(*) from public.submissions where submission_type in ('lesson_exam_a','lesson_exam_b')) exam_ab,
 (select count(*) from public.certifications) certifications_catalog,
 (select count(*) from information_schema.schemata where schema_name='training_private') private_schema;
```

## Rollout e rollback

- Primeiro homologar a **restauração** e o fluxo autenticado consultor/admin em Supabase local com estrutura compatível; executar regressões do legado e testes RLS. Não usar branch Supabase paga.
- Confirmar CI e Preview Vercel **READY no SHA final**. Só então preparar janela coordenada para banco + frontend. **Nunca** publicar frontend que exija RPCs ainda inexistentes.
- Executar migração transacional apenas após autorização operacional, backup e gates; revalidar UUIDs, contagens, RLS, trigger de perfil, prova A/B sem gabarito, prática e aprovação gerencial. Publicar **D30 primeiro**; depois D34–D39 em lotes pequenos. D40/D41 permanecem bloqueadas editorialmente.
- Se falhar antes do `COMMIT`, abortar transação. Se falhar depois, **não** aplicar rollback destrutivo improvisado; preservar provas e decisões já geradas, pausar novas publicações e restaurar somente a partir do procedimento testado, com janela e responsável definidos.

Fontes oficiais: [Supabase — Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups), [Supabase — CLI Reference](https://supabase.com/docs/reference/cli/global-flags).

**Regra de parada:** sem dump criptografado + restauração testada + homologação autenticada equivalente + deploy coordenado READY, não há publicação segura de novas aulas.
