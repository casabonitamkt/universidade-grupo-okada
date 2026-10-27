/* Aulas 19–21 para revisão editorial em homologação.
 * Sem persistência, mensagens externas, dados pessoais ou certificação.
 * A primeira alternativa de cada questão é a correta; o módulo central reordena.
 */
export const AULAS_19_21 = {
  "19": {
    "objetivo": "Escrever mensagens comerciais objetivas, corretas e personalizadas para clientes de alto padrão, preservando o contexto, a privacidade e a intenção de compra sem parecer robótico.",
    "aprender": [
      "Escrita profissional começa pelo contexto do cliente. Leia a pergunta, confira o histórico e responda primeiro ao que foi solicitado. Depois, se necessário, acrescente uma pergunta que permita avançar. Mensagens genéricas como 'Olá, temos várias opções' ignoram informações importantes e passam a impressão de atendimento automático. Identifique-se quando for o primeiro contato, mas não repita apresentação a cada resposta.",
      "Prefira frases curtas, vocabulário claro e pontuação natural. Uma mensagem pode ter saudação, resposta e próximo passo, mas não precisa reunir todo o briefing em um único bloco. Evite caixa alta, excesso de emojis, abreviações confusas e áudios longos sem permissão. Releia nomes, cidade, medidas e termos técnicos antes de enviar; o erro de um detalhe pode comprometer a confiança no restante da proposta.",
      "Personalizar não significa inventar intimidade. Retome somente fatos fornecidos pelo cliente, como 'Você comentou que a sala recebe visitas aos fins de semana'. Não presuma renda, rotina familiar, profissão ou estilo de vida. Se o cliente preferir comunicação objetiva, respeite. Se houver arquiteto, reconheça a autoria do projeto e não prometa alterações sem validação; preserve também a confidencialidade de fotos, plantas e orçamentos.",
      "Organize pedidos de informação por prioridade. Primeiro identifique se é projeto ou peça, depois verifique medidas, referências e decisões pendentes conforme o caso. Em vez de pedir cidade, planta, prazo, orçamento e telefone de uma vez, faça uma pergunta central e explique por que ela ajuda. Quando um dado já está no histórico, confirme apenas se houver dúvida real ou mudança de versão.",
      "Antes de enviar, faça uma revisão em cinco pontos: respondi à pergunta original, usei fatos confirmados, evitei promessa de preço/prazo/desconto, mantive o texto natural e combinei próximo passo? Sugestões do copiloto são rascunhos para revisão humana; não devem ser enviadas automaticamente. No CRM, registre apenas o necessário para continuidade, sem copiar informações sensíveis sem finalidade."
    ],
    "demonstrar": {
      "certo": "Você comentou que a mesa será usada diariamente e também para receber visitas. Para eu verificar as proporções com segurança, você já tem a medida livre do espaço de jantar?",
      "errado": "OLÁ!!! TEMOS MUITAS MESAS LINDAS!!! ENVIE TUDO AGORA E JÁ GARANTO O MELHOR PREÇO!!!",
      "porQue": "A primeira mensagem recupera o contexto e faz uma pergunta útil; a segunda é genérica, exagerada e promete uma condição que não foi autorizada."
    },
    "praticar": {
      "cenario": "Uma cliente já informou que mora em Dourados, enviou foto do ambiente e procura uma mesa para seis lugares. Ela pergunta se a loja consegue ajudá-la sem precisar viajar agora.",
      "tarefa": "Escreva duas mensagens naturais: responda diretamente à possibilidade de atendimento remoto, confirme o recebimento da foto sem alegar análise concluída, faça uma pergunta prioritária e proponha o próximo passo sem inventar prazo ou preço."
    },
    "provar": {
      "criterios": [
        "Responde ao pedido original",
        "Escrita clara e natural",
        "Contexto confirmado",
        "Uma pergunta prioritária",
        "Sem promessa comercial",
        "Próximo passo objetivo"
      ],
      "perguntas": [
        [
          "Uma boa primeira resposta no WhatsApp deve...",
          "Responder ao pedido e aproveitar o contexto existente",
          "Enviar catálogo completo sem leitura",
          "Repetir toda a saudação anterior",
          "Solicitar pagamento imediatamente"
        ],
        [
          "Qual é a melhor revisão antes do envio?",
          "Conferir nomes, medidas, clareza e promessas",
          "Adicionar emojis em toda frase",
          "Colocar tudo em caixa alta",
          "Eliminar o próximo passo"
        ],
        [
          "Personalizar significa...",
          "Usar fatos confirmados pelo cliente",
          "Supor renda pela cidade",
          "Inventar gostos pessoais",
          "Criar intimidade forçada"
        ],
        [
          "Se o cliente já informou a cidade, deve-se...",
          "Usar a informação e confirmar só se necessário",
          "Perguntar novamente em toda mensagem",
          "Ignorar o histórico",
          "Inventar outro endereço"
        ],
        [
          "Qual mensagem é mais natural?",
          "Posso conferir as medidas e retorno com as opções alinhadas",
          "COMPRE AGORA!!!",
          "Seu projeto está perfeito sem análise",
          "Tenho desconto secreto para você"
        ],
        [
          "O copiloto deve...",
          "Gerar rascunho revisado pela consultora",
          "Enviar automaticamente sem revisão",
          "Prometer estoque sem consulta",
          "Modificar projeto sozinho"
        ],
        [
          "Ao solicitar dados, o melhor é...",
          "Priorizar uma pergunta relevante e explicar o motivo",
          "Pedir tudo de uma vez sem contexto",
          "Solicitar documentos pessoais sem necessidade",
          "Repetir dados já recebidos"
        ],
        [
          "O que registrar após a conversa?",
          "Contexto necessário e próximo passo acordado",
          "Suposições sobre o cliente",
          "Informações sensíveis sem finalidade",
          "Apenas emojis"
        ]
      ]
    }
  },
  "20": {
    "objetivo": "Escolher entre texto, áudio, ligação e vídeo com consentimento e propósito claro, reduzindo atritos e conduzindo projetos complexos sem invadir o tempo do cliente.",
    "aprender": [
      "O canal deve servir ao cliente, não à preferência da consultora. Texto é útil para confirmações, medidas e próximos passos que precisam ficar documentados. Áudio pode ajudar a explicar uma ideia mais pessoal, mas exige respeito ao momento do cliente e deve ser breve. Ligação ou vídeo podem acelerar decisões de projeto, desde que o cliente aceite e saiba o objetivo. Nunca use chamadas inesperadas como pressão comercial.",
      "Antes de mandar áudio, avalie se ele é realmente mais claro que uma mensagem escrita. Peça permissão quando a preferência ainda não estiver definida e ofereça alternativa em texto. Se usar áudio, apresente um assunto por vez e registre depois as decisões relevantes por escrito. Não suponha que o cliente possa ouvir no trabalho, em reunião ou em ambiente compartilhado; informações de orçamento e projeto podem ser confidenciais.",
      "Uma ligação consultiva deve ter pauta simples: validar briefing, apresentar composição, esclarecer dúvidas e combinar próximo passo. Para propostas acima de R$ 50 mil, a conversa por voz ou vídeo pode ser especialmente útil, mas não substitui proposta formal, conferência técnica nem aprovação do gestor quando exigida. Agende horário e duração aproximada, confirme participantes e evite convidar terceiros sem autorização do cliente.",
      "Em apresentação por vídeo, prepare planta, medidas, imagens e versões corretas da proposta antes de iniciar. Mostre por ambientes e diferencie características verificadas de pontos pendentes. Não grave a chamada nem compartilhe a tela de documentos de terceiros sem consentimento. Se a conexão falhar, retome por texto e envie um resumo claro do que foi decidido; o objetivo é dar continuidade sem perda de contexto.",
      "Após qualquer áudio ou chamada, registre no CRM a data, o canal, as decisões confirmadas, dúvidas em aberto, quem ficou responsável e a data de retorno. Diferencie o que o cliente pediu do que a consultora sugeriu. Nunca trate uma conversa como pedido fechado sem confirmação expressa e documentação adequada. O copiloto pode sugerir uma pauta ou resumo, mas a conferência e o envio permanecem humanos."
    ],
    "demonstrar": {
      "certo": "Como são três ambientes e há detalhes de medidas, uma chamada de vídeo de 15 minutos pode facilitar. Você prefere amanhã às 10h ou seguir por mensagens? Posso enviar antes a pauta e a proposta para sua análise.",
      "errado": "Vou ligar agora e colocar sua arquiteta na chamada sem avisar; é mais rápido e já fechamos tudo.",
      "porQue": "A primeira opção respeita escolha, agenda e contexto; a segunda invade o tempo do cliente e envolve terceiros sem consentimento."
    },
    "praticar": {
      "cenario": "Cliente de outra cidade está avaliando um projeto de sala e jantar acima de R$ 50 mil. Ele respondeu que não consegue ouvir áudios durante o expediente e a arquiteta deseja participar da revisão.",
      "tarefa": "Redija convite para vídeo com pauta, duração estimada, opções de horário e alternativa por texto. Inclua como confirmaria a participação da arquiteta e como registraria decisões e pendências após a reunião."
    },
    "provar": {
      "criterios": [
        "Canal escolhido com propósito",
        "Consentimento respeitado",
        "Pauta clara",
        "Participantes autorizados",
        "Resumo escrito",
        "Registro correto no CRM"
      ],
      "perguntas": [
        [
          "Quando o cliente prefere texto, a consultora deve...",
          "Respeitar a preferência e adaptar o atendimento",
          "Enviar áudios longos",
          "Ligar sem aviso",
          "Insistir em vídeo"
        ],
        [
          "Antes de uma chamada comercial, é importante...",
          "Combinar horário, objetivo e participantes",
          "Telefonar sem consentimento",
          "Prometer fechamento",
          "Omitir pauta"
        ],
        [
          "Em projeto de alto valor, vídeo pode...",
          "Facilitar apresentação sem substituir validações",
          "Dispensar orçamento formal",
          "Garantir aprovação técnica",
          "Autorizar descontos automaticamente"
        ],
        [
          "Depois de uma ligação, é adequado...",
          "Registrar decisões e pendências por escrito",
          "Confiar apenas na memória",
          "Marcar venda fechada automaticamente",
          "Apagar histórico"
        ],
        [
          "Uma gravação de reunião exige...",
          "Consentimento e cuidado com privacidade",
          "Iniciativa unilateral",
          "Compartilhamento público",
          "Autorização apenas da consultora"
        ],
        [
          "Ao envolver arquiteta, deve-se...",
          "Confirmar autorização e participantes",
          "Adicionar terceiros sem aviso",
          "Trocar projeto sem validação",
          "Ignorar o memorial"
        ],
        [
          "Se o cliente não puder ouvir áudio, é melhor...",
          "Oferecer resumo objetivo em texto",
          "Enviar mais áudios",
          "Cobrar resposta imediata",
          "Encerrar atendimento"
        ],
        [
          "O copiloto pode ajudar com...",
          "Pauta e resumo para revisão humana",
          "Disparo automático",
          "Preço inventado",
          "Confirmação fictícia de pedido"
        ]
      ]
    }
  },
  "21": {
    "objetivo": "Registrar atendimentos no CRM com dados mínimos, fontes confirmadas, etapas coerentes e continuidade rastreável, distinguindo orçamento enviado, negociação e venda efetivamente fechada.",
    "aprender": [
      "Um CRM útil representa o atendimento real, não uma lista de nomes. Registre a origem do contato, consultora responsável, cidade quando informada, tipo de demanda (projeto ou peça), ambientes e próximo passo. Preserve o texto original do cliente quando houver dúvida importante. Não preencha campos com suposições e não copie dados pessoais desnecessários. O registro deve permitir que outro responsável entenda o contexto sem pedir tudo novamente.",
      "Separe claramente as etapas: novo lead, diagnóstico, aguardando informações, proposta em preparação, proposta enviada, negociação, ganho ou perda validada. Uma proposta enviada não é venda fechada. O valor proposto e o valor efetivamente fechado devem ser distintos e vinculados à versão da proposta. Se o cliente recebeu PDF, confirme a leitura e o valor antes de registrar; um arquivo não analisado não autoriza extração presumida.",
      "Para cada atendimento ativo, defina uma ação concreta, responsável e data combinada. 'Fazer follow-up' é genérico; 'confirmar com cliente as medidas da parede até quinta-feira' permite execução. Registre a permissão para contato, o canal preferido e objeções na linguagem do cliente. Não configure disparos automáticos nem contato externo sem aprovação específica; nesta etapa o CRM é apenas treinamento e simulação.",
      "Quando o cliente muda escopo, peça, ambiente ou prazo, atualize o registro mantendo histórico e versão anterior quando aplicável. Nunca altere projeto especificado pelo arquiteto sem validação. Se a consultora precisar de preço, prazo, estoque ou desconto fora da alçada, encaminhe ao responsável e marque como pendente. Não apresente a pendência como promessa ao cliente.",
      "Indicadores dependem de critérios consistentes: taxa de conversão usa vendas realmente fechadas sobre leads elegíveis no período definido; ticket médio usa valor de vendas fechadas dividido pela quantidade de vendas fechadas. Não misture propostas com pedidos e não conte duplicidades como oportunidades novas. Para perdas, registre motivo confirmado e validação do gerente antes de consolidar. O objetivo é melhorar decisões, não manipular métricas."
    ],
    "demonstrar": {
      "certo": "Lead de projeto: cliente em Maringá, sala e jantar; planta recebida, medidas da parede pendentes; arquiteta participa; proposta ainda em preparação; próxima ação: solicitar medida até quinta, responsável Thiago.",
      "errado": "Venda ganha de R$ 80 mil porque o cliente pediu orçamento; marcar como fechada e enviar follow-up automático.",
      "porQue": "O registro correto separa informação confirmada, pendências e etapa; o incorreto confunde intenção com venda e autoriza ação externa sem aprovação."
    },
    "praticar": {
      "cenario": "Um cliente pediu sofá e mesa, enviou uma planta e recebeu um PDF de orçamento ainda não conferido. Disse que conversará com a arquiteta na próxima semana. Nenhum pedido foi assinado ou confirmado.",
      "tarefa": "Monte um registro de CRM com origem, escopo, etapa, documentos recebidos, valores como pendentes de conferência, participação da arquiteta, responsável e próximo contato consentido. Explique por que não é venda ganha."
    },
    "provar": {
      "criterios": [
        "Etapa comercial coerente",
        "Dados confirmados",
        "Valor proposto versus fechado",
        "Próxima ação com responsável",
        "Projeto e privacidade respeitados",
        "Indicadores sem duplicidade"
      ],
      "perguntas": [
        [
          "Um orçamento enviado deve ser classificado como...",
          "Proposta enviada, não venda fechada",
          "Venda ganha automaticamente",
          "Perda validada",
          "Pedido entregue"
        ],
        [
          "Qual é um bom próximo passo no CRM?",
          "Conferir medidas com cliente na data combinada",
          "Aguardar sem data",
          "Pressionar diariamente",
          "Apagar pendências"
        ],
        [
          "Se um PDF não foi analisado, o valor deve...",
          "Aguardar extração e conferência confiável",
          "Ser inventado",
          "Ser igual ao ticket médio",
          "Ser lançado como venda"
        ],
        [
          "A taxa de conversão deve considerar...",
          "Vendas fechadas e leads elegíveis no mesmo critério",
          "Toda proposta como venda",
          "Contatos duplicados",
          "Somente leads sem resposta"
        ],
        [
          "Ticket médio de vendas usa...",
          "Soma de vendas fechadas dividida por quantidade de vendas",
          "Soma de propostas abertas",
          "Maior orçamento do mês",
          "Total de mensagens"
        ],
        [
          "Se o cliente mudou o escopo, é correto...",
          "Atualizar oportunidade preservando contexto e versões",
          "Criar duplicidade sem necessidade",
          "Apagar histórico",
          "Ignorar o novo pedido"
        ],
        [
          "Uma perda comercial deve...",
          "Ter motivo confirmado e validação do gerente",
          "Ser marcada por silêncio imediato",
          "Ser usada para ajustar métricas",
          "Dispensar registro"
        ],
        [
          "Dados sensíveis no CRM devem...",
          "Ser limitados ao necessário e tratados com cuidado",
          "Ser copiados sem finalidade",
          "Ser publicados em grupos",
          "Ser usados para disparos sem autorização"
        ]
      ]
    }
  }
};
