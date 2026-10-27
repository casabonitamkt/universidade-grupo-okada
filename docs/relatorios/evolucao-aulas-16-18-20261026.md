# Evolução segura — 26/10/2026 — aulas 16 a 18

**Projeto:** Universidade Casa Bonita + Móveis Modernos  
**Repositório:** casabonitamkt/universidade-grupo-okada  
**Branch:** feature-aulas-16-18-20261026 (base: feature-aulas-13-15-20261026)  
**Escopo:** homologação editorial, sem alteração da plataforma oficial.

## Entregas
- Dia 16: explicar valor com briefing, evidências verificáveis e sem promessas comerciais.
- Dia 17: conduzir objeções com escuta, diagnóstico, resposta e retorno combinado.
- Dia 18: atendimento humano por WhatsApp, com contexto, transparência sobre arquivos e revisão humana das sugestões de IA.
- Cada aula: objetivo, cinco textos aprofundados, exemplo correto/incorreto, exercício prático, seis critérios e oito perguntas com quatro alternativas.
- Inclusão no módulo central, atualização da página editorial para 18 aulas e ampliação dos testes de regressão.
- Dias 19–90 continuam **planejados**, não disponíveis como aulas completas.

## Verificação
- GitHub: repositório e branch acessíveis; alterações versionadas.
- Supabase: projeto `mjtphztvjnfjlhtxtwjz` com status **ACTIVE_HEALTHY** (consulta somente leitura).
- Regressão isolada em JavaScript: **599 verificações aprovadas**. Inclui 90 dias, três fases de 30, aulas 1–18, quatro variantes das provas, acerto/reprovação, integridade editorial e proibição de certificação automática.
- Testes Node (`tests/trilha-90-dias-16-18.test.mjs`) versionados, **não executados em Node nesta execução**; execução futura no CI/ambiente local pendente.
- Vercel: deploy de preview do commit `37227bfe3fbdea3c4347d06a3f1ce2a6b6d806d8` confirmado **READY**, URL: https://universidade-grupo-okada-j51rrabiz-grupo-okada.vercel.app/homologacao/trilha-90-dias.html
- A validação manual no navegador por consultor/gestor permanece pendente.

## Proteções
Nenhuma alteração em Supabase SQL, banco, RLS, contas, notas, progresso do Thiago, dados de produção, chaves, WhatsApp, Z-API, pré-atendimento externo ou serviço pago. A página editorial não grava notas nem certificações.

## Pendências
1. Executar testes Node em ambiente de CI/local e revisão editorial/visual no navegador.
2. Aprovação do gestor antes de integrar qualquer conteúdo à formação oficial.
3. Preparar aulas 19–21 com a mesma separação e critérios.
4. Conexão real com WhatsApp do Thiago somente em homologação e após autorização específica.
