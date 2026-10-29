# Lote editorial D35–D40 — correções em aulas ocultas (29/10/2026, BRT)

**Escopo:** apenas conteúdo JSONB de aulas ainda não publicadas, com filtros de estado e preservação dos IDs. Nenhuma alteração de schema, RLS, política, credencial, aprovação, certificação ou progresso. **Não é autorização de publicação.**

## Resultado verificado diretamente no Supabase

| Aula | Antes | Depois | Questões A/B | Críticas A/B | Oficial |
|---|---|---|---|---|---|
| F2-D35-A01 | `retest_rule` ausente, `retest_policy` já presente | Regra A→revisão escrita→B + prática/gestor explicitada | 10/10 | 5/5 | Não |
| F2-D37-A01 | `retest_rule` ausente | Regra de reteste e validação gerencial normalizada | 10/10 | 4/5 | Não |
| F2-D38-A01 | `retest_rule` ausente | Regra de reteste e validação gerencial normalizada | 10/10 | 5/5 | Não |
| F2-D39-A01 | `retest_rule` ausente | Regra de reteste e validação gerencial normalizada | 10/10 | 5/5 | Não |
| F2-D40-A01 | `retest_rule` ausente; nenhuma questão marcada crítica | Regra normalizada; 5 questões críticas em cada banco | 10/10 | 5/5 | Não |

No D40, as posições 1, 3, 4, 7 e 9 da prova A e 1, 2, 4, 7 e 8 da prova B foram marcadas críticas por tratarem de promessas fora da alçada, especificações, autorização e informações não verificadas. **A pertinência pedagógica dessas marcações ainda exige revisão do gestor.** Os textos das questões, alternativas, índices de resposta correta, IDs e títulos não foram modificados.

Na verificação posterior: **57 aulas publicadas, 9 ocultas; 56 conclusões do Thiago intactas; zero envios de prova A/B**. As cinco aulas alteradas permanecem ocultas, com `retest_rule` presente e 10+10 questões. As provas de D35 tinham zero gabaritos inválidos e zero perguntas A/B idênticas; D37–D39 tinham dez questões por banco, índices de gabarito numéricos e nenhuma pergunta idêntica entre A/B. A revisão semântica integral das provas ainda é necessária.

## Bloqueio que continua impedindo publicação

As políticas reais `submissions_update_own` e `progress_update` ainda permitem escrita direta pelo próprio consultor em registros que deveriam exigir aprovação do gestor; não existe trigger de validação em `submissions` ou `lesson_progress`. O painel do gestor confere as notas independentemente (PR #43 integrado), **mas não possui fluxo autenticado/transacional que aprove prática e conclua a aula com segurança**. A Vercel produção READY ainda corresponde ao SHA `4fbf238ac154f3a34d1d2744e3856cb272795c70`, anterior ao merge `30f55c46ac8e3c4bc04c6621de0d388bd5db2889`. Não publicar o marco 30 ou as aulas 34–41 sem resolver o gate.

## Próximos passos, em ordem

1. Propor proteção de RLS/trigger e fluxo gerencial no servidor em branch isolada; testar com usuários **fictícios** de homologação e tentativas de bypass. Não aplicar migration diretamente à produção sem aprovação e validação.
2. Validar prática observada, correção A/B, falhas críticas, reteste e histórico com CI, desktop/mobile, persistência e Vercel READY no SHA exato.
3. Revisar D30 antes de D34; verificar D34, D35, D36, D37, D38, D39 e D40 individualmente. D41 ainda possui `body` e `mission` vazios.
4. Publicar apenas lotes pequenos aprovados, comparando UUIDs, contagens e 56+ conclusões antes/depois.

## Verificação reexecutável (somente leitura)

```sql
SELECT code, id, is_published,
       content ? 'retest_rule' AS has_retest_rule,
       jsonb_array_length(content->'questions_a') AS questions_a,
       jsonb_array_length(content->'questions_b') AS questions_b,
       (SELECT count(*) FROM jsonb_array_elements(content->'questions_a') q WHERE q->3='true'::jsonb) AS critical_a,
       (SELECT count(*) FROM jsonb_array_elements(content->'questions_b') q WHERE q->3='true'::jsonb) AS critical_b
FROM public.lessons
WHERE code IN ('F2-D35-A01','F2-D37-A01','F2-D38-A01','F2-D39-A01','F2-D40-A01')
ORDER BY code;
```

## Reversão controlada (não executar automaticamente)

Antes de qualquer reversão, obter backup do JSONB completo de cada aula e comparar com o estado auditado. As mudanças deste lote são apenas a inclusão de `retest_rule` em cinco aulas e a alteração do indicador crítico em dez perguntas de D40. Para reverter, remover **somente** `retest_rule` dos cinco códigos, e em D40 restaurar o índice 3 (base zero) para `false` nas posições A 1/3/4/7/9 e B 1/2/4/7/8. Exigir `is_published=false`, correspondência exata do texto atual da regra, zero mudanças concorrentes e verificação pós-operação. **Nunca restaurar o JSON inteiro a partir de uma versão antiga**, pois isso poderia apagar edições posteriores. Não houve qualquer necessidade de rollback nesta execução.

**Status deste PR:** registro de evidências e revisão editorial; não contém migration, deploy nem comando de publicação.
