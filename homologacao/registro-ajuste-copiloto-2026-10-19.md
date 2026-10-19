# Ajuste do copiloto em homologação — 19/10/2026

## Evidência reportada
Após autenticação e briefing fictício "Cliente de Maringá procurando mesa com 8 cadeiras, enviou foto do espaço e modelos de referência", a função respondeu com texto de **sofá** e afirmou falha de atendimento sem histórico suficiente. A chamada autenticada passou a funcionar após ajuste CORS; o problema atual era de qualidade da resposta.

## Mudança efetivamente aplicada
Supabase projeto Universidade Grupo Okada, função **crm-copiloto-homologacao**, versão **4** (anterior 3), status ACTIVE. Mudança **apenas nas instruções do modelo**: fidelidade ao produto e contexto fornecidos, reconhecer fotos e referências já recebidas, não inferir falha sem evidência, resposta consultiva com uma pergunta. Sem alteração de autenticação, CORS, dados, WhatsApp ou produção.

## Teste pendente
Teste E2E autenticado com briefing fictício: mesa com oito cadeiras, foto do ambiente e modelos de referência. Resultado esperado: não citar sofá, não solicitar foto já enviada, não alegar falha de consultora sem histórico; perguntar apenas informação realmente ausente (ex.: medidas). Necessário novo teste real no navegador. Não afirmar E2E concluído.

## Prioridade de produto
Formação prática do Thiago continua prioritária. CRM+IA segue exclusivamente em homologação.
