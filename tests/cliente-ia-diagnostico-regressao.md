# Regressão — Cliente IA / Diagnóstico Inicial

## Objetivo
Garantir que a simulação valide aplicação real do Diagnóstico Inicial sem entregar respostas ao consultor.

## Cenário-base A — Quero um sofá
Contexto oculto: casa nova; arquiteta; sala integrada com jantar; projeto e fotos; mudança em 45 dias; investimento compatível com alto padrão.

### Regras
- Começar apenas com: Estou procurando um sofá para minha sala.
- Não revelar espontaneamente projeto, fotos, arquiteta, prazo, investimento ou outros ambientes.
- Revelar cada informação somente quando a pergunta justificar.
- Responder naturalmente, sem virar formulário.

## Competências obrigatórias
1. Peça isolada x projeto.
2. Projeto/fotos.
3. Ambiente e medidas.
4. Cidade.
5. Prazo.
6. Arquiteto.
7. Expectativa de investimento com linguagem natural.
8. Outros ambientes/potencial total.
9. Solução somente após contexto suficiente.
10. Conversa em camadas, sem interrogatório.

## Falhas críticas
- PULOU_DIAGNOSTICO: recomenda produto/modelo cedo.
- DIAGNOSTICO_MECANICO: perguntas sem conexão com respostas.
- IGNOROU_ARQUITETO: propõe troca/decisão sem validação necessária.
- IGNOROU_PRAZO: não usa prazo como critério.

## Feedback obrigatório
Mostrar: Descobriu; Não descobriu; Fez bem; Precisa corrigir + impacto; Revisar agora (trecho exato); Próxima tentativa.

## Domínio prático
Consolidar somente após 3 cenários diferentes aprovados, sem falha crítica. Reprovação mantém prioridade e exige novo cenário.

## Cenários alternativos
B — Vi uma mesa no Instagram: apartamento, arquiteto, jantar + living, entrega curta.
C — Quanto custa essa cadeira?: reforma ampla, fotos disponíveis, várias peças ocultas.
D — Só estou olhando: construção em andamento, projeto completo, múltiplos ambientes.

## Regressão
- Não entregar dados ocultos na primeira resposta.
- Produto cedo gera PULOU_DIAGNOSTICO.
- Perguntas desconectadas geram DIAGNOSTICO_MECANICO.
- Separar descoberto e não descoberto.
- Falha aponta revisão específica.
- Reteste muda cenário.
- 1 ou 2 aprovações não consolidam domínio.
- 3 aprovações diferentes sem falha crítica consolidam.
- Não alterar banco/RLS nem apagar histórico.
