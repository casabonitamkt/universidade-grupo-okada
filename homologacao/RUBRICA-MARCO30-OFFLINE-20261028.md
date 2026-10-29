# Homologacao da rubrica observacional do marco 30 — 28/10/2026

**Escopo estritamente offline, sem efeito no treinamento real.** Modulo: `modules/trilha-marco30-rubrica-offline.mjs`. Testes: `tests/trilha-marco30-rubrica-offline.test.mjs`. Complementa, sem substituir, o prototipo A/B do PR #40.

## Base pedagógica verificada (Supabase, somente leitura)
A aula oculta `F1-D30-A01` descreve **duas simulações separadas** (projeto com arquiteta e peça avulsa), cada uma com dez critérios de 0 a 1 ponto, permitindo **0,5 somente com justificativa**. Exige ao menos duas evidências observáveis por caso, uma ação de melhoria, nota mínima 8/10 em **cada** caso, nenhum erro crítico e aprovação do gestor. O cadastro de 15 minutos ainda requer revisão de duração.

## Controles adicionados
- Dez notas individuais por caso; somente 0, 0,5 ou 1, somando no máximo 10 pontos.
- Justificativa escrita para cada critério pontuado em 0,5.
- Duas evidências observáveis não repetidas e ação de melhoria por simulação.
- Erro crítico explicitamente declarado, que reprova mesmo com nota 10.
- Teoria aprovada e as duas práticas aprovadas para sinalizar apenas **pronto para análise do gestor**.
- Resultados sempre informam `avaliacaoAutenticada=false`, `conclusaoAutomatica=false` e `certificacaoAutomatica=false`.

## Limitações e bloqueios
Este código **não comprova identidade do avaliador**, autoria da evidência, presença do gestor, validade de gabarito ou correção das respostas. Aceita dados de teste em memória, sem persistência ou isolamento por usuário; **não pode ser usado para autorizar conclusão, desbloquear aulas, liberar Sierra ou conceder certificação**. A validação da rubrica não equivale a revisão comercial ou técnica.

Antes da integração autenticada: definir fluxo auditável de tentativas A/B, evidências, revisão escrita, assinaturas e decisão do gestor, com autorização específica para qualquer banco/RLS; revisar gabaritos, alçadas comerciais e fontes Sierra; executar regressão desktop/mobile e CI no SHA final; confirmar Vercel Preview READY e rollback. Manter o PR em homologação e as dez aulas ocultas.
