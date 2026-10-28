# Auditoria de liberacao gradual — treinamento real e biblioteca editorial
Data: 2026-10-28, 16h27 BRT. Escopo: verificacao somente leitura no GitHub, Vercel e Supabase.

## Situacao confirmada
- Supabase `public.lessons`: **66 aulas**; **56 publicadas**, **10 nao publicadas**.
- Supabase `public.lesson_learning_sequence`: **56** registros. O codigo do painel real `index.html` consulta `modules` e `lessons` filtrando `is_published=true`.
- Usuario Thiago (UID confirmado em Authentication): **56 registros de progresso**, todos com `completed_at` preenchido; **zero pendentes**. As 56 conclusoes correspondem a aulas publicadas.
- As 56 aulas publicadas pertencem aos codigos `S1-D1-A01` a `S1-D7-A08` (oito aulas por dia, sete dias). **Nao** equivalem aos dias 1–56 da trilha editorial de 90 dias.
- As **10 aulas nao publicadas**: `F1-D29-A01`, `F1-D30-A01`, `F2-D34-A01` a `F2-D41-A01`. Seus modulos tambem estao nao publicados.
- `F2-D41-A01` tem `content.body` e `content.mission` vazios, apesar de existirem questoes. **Bloqueio pedagogico explicito**; nao liberar.
- Biblioteca `modules/trilha-90-dias.mjs`: dias 1–39 para revisao editorial; dias 40–48 existem em arquivos editoriais separados, mas permanecem planejados no modulo central. Nenhuma dessas aulas esta ligada ao painel autenticado.
- Producao Vercel READY no commit `8bec869db4e8d88a9fa7ae245d3ae92d28369cd5`: alteracoes apenas na biblioteca isolada. Nao houve liberacao de novas aulas reais.

## Riscos e fronteiras
1. **Nao equiparar dia editorial a codigo de aula real.** Exemplo: dia editorial 40 (registro de versoes de propostas) difere de `F2-D40-A01` (condicao excepcional e decisao). Criar vinculo automatico por numero alteraria significado e poderia afetar provas/historico.
2. O painel real registra progresso por `(user_id, lesson_id)`, com UUIDs estaveis; nao renumerar ou sobrescrever aulas ja concluidas, `lesson_progress`, `submissions`, notas ou certificacoes.
3. Nao publicar os 10 registros em lote. Ha conteudo incompleto e modulos ocultos. Verificar separadamente criterios comerciais, autorizacoes e fontes tecnicas Sierra.
4. O teste `tests/trilha-90-dias-gate-painel-real.test.mjs` e um **gate estatico**, nao substitui teste autenticado em navegador, validacao de RLS nem revisao humana.

## Proxima liberacao proposta — SEM EXECUTAR ALTERACAO DE BANCO
1. Revisar **um** candidato por vez, preferencialmente `F2-D34-A01` (comparacao de propostas) ou `F2-D35-A01` (recuperacao consultiva), que apresentam corpo editorial mais completo. Validar aprender/demonstrar/praticar/provar, 10 questoes A e 10 B, resposta correta, reteste, e compatibilidade com o metodo C.A.S.A.
2. Revisar com a gestao as regras comerciais vigentes, privacidade, relacao com arquitetos e eventuais referencias tecnicas Sierra. Qualquer especificacao Sierra sem fonte autorizada permanece bloqueada.
3. Em homologacao autenticada, testar login do Thiago, mobile 320/390px e desktop, modulo, aula, evidencia, prova/reteste, retorno, recarregamento e progresso **sem alterar os dados reais**.
4. Planejar publicacao pontual com UUID existente e aprovacao especifica para alteracao de `is_published` no Supabase, incluindo modulo correspondente. **Esta execucao nao altera banco nem RLS**.
5. Antes/depois: registrar contagem de aulas publicadas, conclusoes do Thiago e integridade das entregas; manter plano de rollback da visibilidade, sem excluir historico. Verificar CI e Vercel READY no mesmo SHA e notificar somente apos comprovacao.

## Outros fluxos
- Cliente IA e CRM continuam isolados deste gate. A preparacao Zappy/WhatsApp do Thiago segue somente em homologacao, sem conexao ou envio.
- PR de seguranca Zappy #38 deve continuar independente da trilha e sujeito a testes proprios.

**Nenhuma alteracao de producao, Supabase, RLS, progresso, nota, certificacao, WhatsApp ou servico pago foi feita por esta auditoria.**
