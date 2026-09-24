# Contrato E2E Supabase — Homologação dos 3 essenciais

Data de validação do schema: 23/09/2026.

## Objetivo

Fechar a integração dos três itens prioritários sem criar estrutura paralela desnecessária: novo layout, Avaliação de Evolução — Ciclo 1 e Cliente IA V2.

## Estruturas já existentes e reutilizáveis

### Progresso de aulas

- `lesson_progress`
  - `user_id`
  - `lesson_id`
  - `status` (`not_started`, `in_progress`, `completed`)
  - `completed_at`
- `lessons`
  - `id`, `code`, `module_id`, `title`, `content`, `is_published`
- `lesson_learning_sequence` (view)
  - permite resolver código, título, módulo e ordem global.

**Regra Ciclo 1:** uma questão só pode entrar na prova quando o `lesson_code` associado estiver entre as aulas do usuário com `lesson_progress.status = 'completed'`.

### Avaliação

- `assessment_templates`
  - `assessment_type`, `version`, `active`, `questions`
- `assessments`
  - `user_id`, `assessment_type`, `answers`, `total_score`, timestamps

Usar `assessment_type = 'evolution_cycle_1'` para separar a nova prova do `marco_zero` existente.

O JSON de cada questão do template deve carregar, no mínimo:

```json
{
  "id": "c1_q01",
  "lesson_code": "...",
  "competency_code": "...",
  "question": "...",
  "options": ["..."],
  "correct": 0,
  "explanation": "..."
}
```

### Competências

- `competencies` / `competency_catalog`: catálogo.
- `competency_scores`: histórico de notas por competência.
  - `user_id`, `competency`, `score`, `notes`, `assessed_at`, `assessed_by`.
- `consultant_evolution_dashboard` e `command_center_dashboard`: leitura consolidada para atualização de tela.

Ao finalizar a prova, agrupar as questões por `competency_code`, calcular a média por competência e registrar evidência em `competency_scores`. O campo `notes` deve identificar `Avaliação de Evolução — Ciclo 1` e o ID da tentativa.

### Relatório gerencial

Não é necessário criar tabela nova para o primeiro release. O relatório pode ser composto de:

1. tentativa em `assessments`;
2. notas geradas em `competency_scores`;
3. leitura consolidada de `consultant_evolution_dashboard` / `command_center_dashboard`;
4. `manager_notifications` para sinalizar conclusão da avaliação ao gestor.

### Cliente IA V2

- `ai_simulations` já suporta o fluxo necessário:
  - `user_id`
  - `scenario`, `scenario_version`, `service_channel`
  - `transcript`
  - `score`
  - `diagnosis_score`, `project_score`, `margin_score`, `experience_score`, `closing_score`
  - `strengths`, `improvement_points`, `feedback`, `next_training`

A V2 deve persistir `scenario_version = 2` e nunca considerar a simulação concluída antes da gravação retornar sucesso.

## Sequência obrigatória — Ciclo 1

1. autenticar usuário;
2. carregar `lesson_progress` concluído;
3. resolver `lesson_code` das aulas concluídas;
4. carregar template ativo `evolution_cycle_1`;
5. filtrar questões estritamente pelos códigos concluídos;
6. impedir envio com questão sem resposta;
7. calcular nota geral e notas por competência;
8. gravar `assessments`;
9. somente após sucesso, gravar `competency_scores`;
10. criar `manager_notifications` de conclusão;
11. reler dashboard/competências do Supabase;
12. atualizar a tela com os dados relidos, e não apenas com estado local;
13. nota mínima para aprovação do ciclo: **8,0**.

Se qualquer gravação falhar, a interface deve manter as respostas e mostrar erro recuperável; não limpar/reiniciar a prova.

## Sequência obrigatória — Cliente IA V2

1. iniciar cenário e registrar transcript em memória;
2. conduzir conversa sem revelar desconto/margem e sem substituir item especificado sem autorização;
3. gerar avaliação por dimensões;
4. inserir `ai_simulations` com `scenario_version = 2`;
5. reler a tentativa gravada;
6. atualizar feedback/histórico/dashboard somente após confirmação da persistência.

## Gate de homologação

A homologação só recebe status de liberada quando os testes abaixo passarem com usuário autenticado de teste:

- aula não concluída não gera questão;
- aula concluída gera apenas questões correspondentes;
- refresh durante a prova não causa perda silenciosa após estratégia de recuperação implementada;
- tentativa incompleta não finaliza;
- nota geral correta;
- nota por competência correta;
- tentativa aparece em `assessments` após gravação;
- competências aparecem após releitura do banco;
- relatório gerencial reflete a mesma tentativa;
- notificação do gestor é criada uma única vez;
- Cliente IA V2 grava transcript + scores + feedback;
- histórico do Cliente IA mostra a tentativa relida do banco;
- login, aulas e dashboard existentes não sofrem regressão.

## Segurança de release

Nenhuma alteração deste fluxo deve ser publicada na branch de produção sem aprovação explícita do Bruno. Até lá, todo código e validação permanecem em `homologacao-chatgpt`.