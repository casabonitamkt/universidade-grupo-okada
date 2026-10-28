# Homologacao isolada — motor de prova A/B e reteste (28/10/2026)

## Objetivo e fronteiras
Preparar, sem integracao ao painel real, a correcao das provas de aulas ainda ocultas. O motor puro em `modules/trilha-90-dias-avaliacao-offline.mjs` nao importa Supabase, nao grava dados e sempre retorna `conclusaoAutomatica=false` e `certificacaoAutomatica=false`. **Nao usar como controle de acesso nem como autorizacao para publicar aulas.**

## Evidencia de banco — consulta somente leitura
- `F2-D34-A01`: nao publicado; corpo de 3668 caracteres, missao de 203; 10 questoes A, 10 B; nota minima 8; regra escrita de reteste presente.
- `F2-D35-A01`: nao publicado; corpo de 3452 caracteres, missao de 153; 10 questoes A, 10 B; nota minima 8; **campo retest_rule ausente**. Permanece bloqueado ate revisao especifica.
- Modulos `F2-D34` e `F2-D35` tambem nao publicados.
- Usuario Thiago: 56 conclusoes de aulas ja publicadas, sem novas aulas disponiveis. O numero 56 refere-se a aulas reais, nao a dias editoriais.

## Regras implementadas apenas no prototipo
1. Validar dez questoes distintas por versao, alternativas, gabarito e marcacao de erro critico.
2. Prova A: nota minima 8/10 **e** nenhum erro critico.
3. Reteste B: somente apos reprovacao A e revisao escrita fornecida; enunciados A/B distintos.
4. Prova pratica: nota minima 8/10 e nenhum erro critico; apenas sinaliza elegibilidade para **analise do gestor**.
5. Nenhum resultado libera aula real, conclui progresso, altera nota ou certifica.

## Pendencias antes de qualquer uso autenticado
- Revisar o conteudo `F2-D34-A01` com gestor e responsavel tecnico, inclusive regras comerciais vigentes, fontes Sierra e rubrica pratica.
- Revisar `F2-D35-A01` e registrar regra de reteste por processo autorizado; **nao modificar banco nesta branch**.
- Projetar armazenamento autenticado de tentativas A/B, revisao e avaliacao do gestor com controle de concorrencia, RLS e historico imutavel; requer aprovacao especifica.
- Validar interface desktop e mobile 320/390px, acessibilidade, fluxo de retorno e recarregamento, sem escrever no progresso do Thiago.
- Conferir CI, preview Vercel READY no SHA final e rollback; nao integrar ao `index.html` nem alterar `is_published` por inferencia.

## Escopo negativo
Nenhum numero WhatsApp real, webhook, Zappy, CRM, Cliente IA, credencial, banco, RLS, nota, progresso ou certificacao e alterado. Este prototipo fica **somente em homologacao**, em PR draft.
