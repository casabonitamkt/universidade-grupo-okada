# Critérios de aceite — formação prática do Thiago (homologação)

Data: 2026-10-19. Documento de homologação, sem impacto na produção ou no banco.

## Prioridade
Corrigir a experiência do aluno: APRENDER (conteúdo útil de 10–15 min), DEMONSTRAR, PRATICAR (exercício escrito + simulação de atendimento online), PROVAR (nota mínima 8, feedback, reteste efetivamente diferente), avanço automático ao próximo dia completo.

## Segurança e persistência
- Reutilizar a autenticação existente; nunca solicitar senhas ou tokens no código.
- Persistir progresso do próprio aluno em tabela isolada de homologação com RLS; não modificar lesson_progress, assessments ou certificações oficiais.
- Salvar respostas, tentativa, nota provisória e etapa; recarregar a página e confirmar retomada.
- Confirmar com sessão autenticada de aluno que um usuário não acessa o progresso de outro.
- Gestor autorizado visualiza indicadores sem conceder certificação automaticamente.

## Testes antes da oficial
- Validar com sessão REAL de aluno, em navegador/celular, inclusive reprovação e reteste diferente.
- Validar painel do gestor e permissões de leitura.
- Documentar commit, URL de homologação, deploy READY, testes e bloqueios.
- Não publicar CRM/IA ou alterações de risco na oficial. Não publicar a formação sem E2E autenticado.

## Escopo do Thiago
Vendas online de móveis de alto padrão; atendimento presencial apenas ao cliente que ele já atende online. Priorizar diagnóstico, apresentação de valor, objeções, fechamento remoto e recuperação de leads.
