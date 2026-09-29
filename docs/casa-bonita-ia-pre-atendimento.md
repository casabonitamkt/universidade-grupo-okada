# Casa Bonita IA — Pré-atendimento (Homologação)

## Objetivo
Unificar Instagram, Facebook e WhatsApp em uma triagem inteligente que organize o contexto antes do atendimento humano, sem substituir a consultora na negociação.

## Escopo conjunto
Processo aplicável à Casa Bonita Móveis e Móveis Modernos quando o fluxo comercial for comum às duas empresas.

## Dados mínimos da triagem
1. Identificar se o cliente procura projeto completo, ambiente(s) ou peça específica.
2. Solicitar projeto quando existir; sem projeto, solicitar fotos e medidas do ambiente.
3. Identificar cidade/região do cliente.
4. Identificar prazo desejado.
5. Entender faixa de investimento/orçamento sem pressionar o cliente.
6. Identificar se há arquiteto responsável e registrar nome/contato quando fornecido.
7. Registrar canal de origem e resumo objetivo do atendimento.

## Regras comerciais obrigatórias
- A IA não negocia preço, desconto, margem, condição excepcional ou substituição de produto.
- A IA não troca peça/produto especificado por arquiteto sem autorização.
- A IA não promete estoque, prazo, preço ou condição sem fonte oficial atualizada.
- Ao detectar intenção real de compra, projeto recebido, pedido de orçamento, comparação de concorrente ou necessidade de negociação, encaminhar para consultora.
- Em comparação com concorrente, primeiro coletar marca, modelo/configuração, medidas, tecido/acabamento e demais especificações para permitir comparação equivalente.
- Casos acima da autonomia da consultora devem escalar para gerente; negociações relevantes podem envolver gerente + consultora com o cliente.

## Saída para a consultora
O handoff deve conter: nome do cliente; canal; loja/contexto; projeto x peça; ambientes; cidade; prazo; faixa de investimento; arquiteto; arquivos recebidos; concorrência citada; resumo da necessidade; pendências; próximo passo recomendado.

## Estados do fluxo
NOVO -> TRIAGEM -> CONTEXTO_MINIMO -> QUALIFICADO -> ENCAMINHADO_CONSULTORA -> HUMANO_ASSUMIU.
Estados de exceção: AGUARDANDO_ARQUIVO, AGUARDANDO_CLIENTE, ESCALAR_GERENTE, FALHA_INTEGRACAO.

## Critérios de homologação
- Entrada: mensagem originada de canal suportado ou cenário simulado.
- Processamento: contexto preservado sem repetir perguntas já respondidas.
- Gravação: sessão, respostas, arquivos/metadados e estado persistidos no Supabase de homologação.
- Tela/CRM: resumo e próximo passo aparecem para a consultora correta.
- Consequência: handoff não perde histórico; IA deixa de negociar após humano assumir.
- Retomada: conversa interrompida continua do último estado persistido.
- Segurança: nenhuma credencial, chave, token ou dado sensível é exposto no frontend/log.

## Cenários mínimos de teste
1. Cliente pede apenas um sofá, sem projeto: coletar foto/medidas, cidade, prazo, investimento e arquiteto.
2. Cliente envia projeto completo com arquiteto: reconhecer projeto, registrar arquiteto e encaminhar contexto completo.
3. Cliente diz que concorrente está mais barato: coletar equivalência antes de qualquer discussão de preço e encaminhar.
4. Cliente pede desconto diretamente: não negociar; qualificar e encaminhar.
5. Cliente abandona e retorna: recuperar estado e não reiniciar triagem.
6. Cliente pede troca de item especificado pelo arquiteto: não substituir; sinalizar necessidade de validação.

## Integração Meta/WhatsApp
A integração oficial deve usar credenciais somente no backend/Edge Function, validar assinatura/webhook, ser idempotente para eventos repetidos e manter identificação de canal/conversa. Nenhuma ativação em produção deve ocorrer sem aprovação explícita do Bruno.

## Próxima implementação segura
Antes de ativar canais reais: definir tabelas/colunas de homologação, função de ingestão, máquina de estados, handoff e testes automatizados/simulados. A integração externa real fica bloqueada até existirem credenciais e permissões oficiais adequadas.