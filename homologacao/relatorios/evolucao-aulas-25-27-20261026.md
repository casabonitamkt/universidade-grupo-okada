# Evolução segura — aulas 25 a 27 (26/10/2026)

## Escopo
- Conteúdo editorial para homologação dos dias 25, 26 e 27: propostas por ambientes, respeito ao projeto e aprovação de alterações.
- 3 aulas, cada uma com objetivo, 5 explicações, exemplo correto/incorreto, prática e 8 questões.
- Integração com `modules/trilha-90-dias.mjs` e atualização do texto da tela `homologacao/trilha-90-dias.html`.
- Nenhuma mudança de banco, RLS, dados, progresso, certificação, WhatsApp, mensagens ou serviços pagos.

## Git
- Branch: `feature-aulas-25-27-20261026`
- Commits: `409e8466` (conteúdo), `907664ae` (integração), `8e49a911` (tela), `1cd8ad7e` (testes).

## Verificações
- 27 verificações estruturais na leitura dos quatro arquivos do GitHub: aprovadas.
- Conferidos 24 enunciados, 5 parágrafos por aula e integração do conteúdo à trilha.
- Teste Node preparado em `tests/trilha-aulas-25-27.test.mjs`, mas NÃO executado neste ambiente: acesso de rede a github.com indisponível para clone local.
- Navegação real no browser, revisão visual mobile e aprovação editorial: pendentes.

## Deploy
- Vercel: deploy `dpl_9wRwKFovtei2gUrr1ViiTLrsN3mU` no commit `1cd8ad7e` confirmado `READY`, target preview (sem produção).
- URL de revisão: https://universidade-grupo-okada-lchxt43qv-grupo-okada.vercel.app/homologacao/trilha-90-dias.html

## Estado e restrições
- Supabase `Universidade Grupo Okada`: `ACTIVE_HEALTHY` na consulta; nenhuma escrita executada.
- Oficial não alterada; integração Z-API e pré-atendimento externo não habilitados.
- Não promover para oficial sem regressão Node, inspeção visual e aprovação conforme risco.
- Próxima tarefa: validar testes Node e mobile; depois aulas 28–30 e marco de fundamentos.
