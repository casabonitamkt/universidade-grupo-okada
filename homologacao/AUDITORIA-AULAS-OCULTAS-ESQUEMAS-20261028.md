# Auditoria somente leitura — 10 aulas ocultas e formatos de avaliação (28/10/2026)

## Escopo e evidência
Consulta de leitura ao Supabase do projeto da Universidade: `public.lessons`, `public.modules` e `public.lesson_progress`. **Nenhum INSERT/UPDATE/DELETE, RLS, variável, publicação, progresso ou nota foi alterado.**

- Thiago (conta de treinamento confirmada): **56 registros de progresso concluídos**. Esse número é de aulas reais, não de dias editoriais.
- Existem **10 aulas com `is_published=false`**, e os respectivos módulos também estão ocultos. Portanto, a biblioteca editorial estática dos dias 1–48 **não equivale** a aulas liberadas.
- A validação atual do protótipo `modules/trilha-90-dias-avaliacao-offline.mjs` aceita apenas questões `[enunciado, alternativas, indice, erroCritico]`, `minimum_score=8` e texto `retest_rule`.
- A consulta encontrou **três convenções de metadados e dois formatos de questões**. Não converter ou publicar automaticamente.

## Matriz de compatibilidade do protótipo (somente esquema, não aprovação pedagógica)

| Aula | Política no JSON | Formato das questões | Situação |
| --- | --- | --- | --- |
| F1-D29-A01 | `minimum_score` + `retest_rule` | Array de 4 elementos | Candidata a revisão manual, NÃO liberada |
| F1-D30-A01 | `minimum_score` + `retest_rule` | Array de 4 elementos | Marco avaliativo; exige gestor, NÃO liberado |
| F2-D34-A01 | `minimum_score` + `retest_rule` | Array de 4 elementos | Candidata a revisão manual, NÃO liberada |
| F2-D35-A01 | `minimum_score` + `retest_policy` | Array de 4 elementos | Regra existe em campo alternativo; protótipo rejeita |
| F2-D36-A01 | `minimum_score` + `retest_rule` | Array de 4 elementos | Candidata a revisão manual, NÃO liberada |
| F2-D37-A01 | `pass_score` + `requires_written_revision_before_retest` | Array de 4 elementos | Convenção alternativa; protótipo rejeita |
| F2-D38-A01 | Idem D37 | Array de 4 elementos | Convenção alternativa; protótipo rejeita |
| F2-D39-A01 | Idem D37 | Array de 4 elementos | Convenção alternativa; protótipo rejeita |
| F2-D40-A01 | Idem D37 | Array de 4 elementos | Convenção alternativa; protótipo rejeita |
| F2-D41-A01 | `minimum_score` + `retest_rule` | **Objetos**, não arrays | Incompatível: 10 objetos A e 10 B; exemplo com 2 alternativas, nenhum `critical` em A; campo `mission` ausente |

**Importante:** D35 e D37–D40 não estão necessariamente sem política de reteste; a política está em **outros campos**. Não concluir que ela falta nem fazer normalização silenciosa. D41 requer revisão editorial de questões e critérios de erro crítico; não inventar gabarito, alternativa ou marcador.

## Bloqueios antes de liberar ao Thiago
1. Revisão de conteúdo, missão e avaliação de cada aula, com rubrica de erros críticos e reteste; o marco D30 exige validação prática do gestor.
2. Conferência documentada de fontes técnicas Sierra e condições comerciais vigentes. **Nenhum dos 10 JSONs apresenta chaves `technical_sources` ou `sources`**; isso não prova que o texto esteja incorreto, mas impede declarar a fonte verificada sem revisão externa.
3. Contrato canônico de dados A/B definido e aprovado para os três esquemas de política; nenhuma conversão automática de formato de questão. Garantir que alternativas e marcadores críticos sejam revisados.
4. Fluxo autenticado de tentativas, revisão escrita, reteste e avaliação do gestor, com persistência e auditoria projetadas **antes** de qualquer alteração de banco/RLS, que exige autorização específica.
5. CI no SHA final, regressão de progresso e notas, testes reais de navegador desktop/mobile, preview Vercel READY, plano de rollback e aprovação de publicação **por aula**, não por lote.

## Próximo passo de menor risco
Revisar primeiro `F1-D29-A01` como unidade isolada e, separadamente, o marco `F1-D30-A01`, sem mudar o Supabase. A presença do esquema esperado é apenas pré-condição técnica; **não é autorização para publicar**.

Os testes `tests/trilha-auditoria-formatos-offline.test.mjs` documentam que o motor atual rejeita formatos alternativos e questões em objeto, em vez de interpretar silenciosamente conteúdos incompatíveis. O protótipo permanece **somente em homologação** no PR #40; nenhuma alteração no painel real, CRM ou WhatsApp.
