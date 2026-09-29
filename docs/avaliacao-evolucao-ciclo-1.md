# Avaliação de Evolução — Ciclo 1

## Objetivo
Avaliar o consultor exclusivamente sobre conteúdo que ele efetivamente concluiu na Universidade, sem antecipar aulas futuras, e transformar o resultado em nota, competências e ação gerencial.

## Regra de elegibilidade
1. Ler o progresso real do usuário.
2. Considerar elegíveis apenas aulas marcadas como concluídas para o próprio usuário.
3. Montar a prova apenas com questões vinculadas a essas aulas.
4. Se não houver conteúdo concluído suficiente, a prova permanece bloqueada e informa o motivo.
5. Uma nova tentativa não pode apagar tentativa anterior; histórico deve ser preservado.

## Fluxo obrigatório
`aulas concluídas → questões elegíveis → tentativa → respostas → correção → nota → competências → relatório gerencial → próxima ação`

### 1. Entrada
- usuário autenticado;
- identificação inequívoca do consultor;
- snapshot das aulas concluídas no início da tentativa;
- identificação `cycle = 1`.

### 2. Prova
- questões devem registrar a aula de origem;
- a prova não pode mudar durante uma tentativa em andamento;
- respostas devem ser persistidas progressivamente quando possível;
- recarregar a página não deve reiniciar silenciosamente a tentativa.

### 3. Correção
- cada questão possui pontuação objetiva e competência associada;
- nota final normalizada em 0–10;
- registrar data/hora de conclusão;
- preservar respostas e composição da prova para auditoria.

### 4. Trava de aprovação
- nota mínima padrão: 8,0/10;
- abaixo da nota mínima: status `reinforcement`, sem liberar consequência dependente da aprovação;
- aprovado: status `approved`;
- a UI deve explicar claramente o resultado e a próxima ação.

### 5. Competências
A correção deve atualizar somente competências efetivamente medidas pelas questões respondidas. Não criar nota artificial para competência não avaliada.

### 6. Relatório gerencial
O gestor deve receber no acompanhamento individual:
- nota e status do Ciclo 1;
- aulas que compuseram a prova;
- competências avaliadas;
- pontos fortes;
- pontos de reforço;
- tentativa e data;
- recomendação objetiva da próxima ação.

## Persistência — contrato mínimo
A implementação deve reaproveitar estruturas existentes sempre que compatíveis. Antes de criar tabela ou alterar RLS, confirmar se homologação usa banco isolado.

Campos lógicos necessários para uma tentativa:
- `id`
- `user_id`
- `cycle`
- `status`
- `started_at`
- `completed_at`
- `score`
- `passing_score`
- snapshot/IDs de aulas elegíveis
- snapshot/IDs de questões
- respostas
- resultado por competência

## Critérios de aceite E2E
1. Thiago conclui uma aula e ela passa a ser elegível.
2. Aula não concluída não aparece na prova.
3. Início da prova cria/recupera tentativa válida.
4. Resposta é gravada e continua disponível após recarga.
5. Finalização calcula nota corretamente.
6. Nota abaixo de 8 gera reforço e mantém trava.
7. Nota igual/acima de 8 aprova.
8. Competências exibidas refletem somente itens avaliados.
9. Dashboard do gestor exibe o resultado sem atualização manual de banco.
10. Histórico anterior permanece íntegro após nova tentativa.

## Regra de liberação
Só comunicar **PROVA DO THIAGO LIBERADA** depois de validar os 10 critérios acima na homologação. Nenhuma alteração deste fluxo autoriza publicação em `main`.