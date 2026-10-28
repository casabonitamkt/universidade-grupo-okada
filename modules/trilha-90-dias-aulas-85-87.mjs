/* Especialização Sierra 85–87: material editorial isolado para revisão, sem persistência nem integração. */
export const AULAS_85_87 = {
  "85": {
    "titulo": "Validação de pedido e especificações",
    "objetivo": "Conferir cada item Sierra contra proposta vigente, projeto e fontes técnicas aprovadas antes de liberar o pedido, separando conferência comercial, técnica e documental.",
    "aprender": [
      "Antes de solicitar a emissão de um pedido Sierra, reúna a versão final do orçamento, memorial descritivo, planta aprovada, fichas técnicas vigentes e histórico das autorizações. Confira quem aprovou cada documento e a data da revisão. Um aceite comercial não substitui a conferência de dimensões, materiais ou configuração; uma divergência pequena pode gerar retrabalho grande depois da fabricação.",
      "Faça a conferência item por item, usando uma matriz simples: ambiente, produto e referência autorizada, medidas, configuração, acabamento, tecido ou couro, quantidade, acessórios, observações de montagem e preço conforme a proposta aprovada. Não complete códigos ou características de memória. Quando um campo não estiver claro, marque como pendente e consulte catálogo e responsáveis antes de prosseguir.",
      "Compare a especificação com a planta e com o uso do ambiente: circulação, abertura de portas, acessos, elevador, escadas e eventuais restrições de instalação. A medida informada pelo cliente não deve ser confundida com medida validada em obra. Caso a arquiteta tenha aprovado uma alternativa, registre a versão correspondente e não misture peças de orçamentos anteriores com a seleção final.",
      "Separe três validações: técnica, pelo responsável pela especificação e projeto; comercial, por quem possui alçada para condições, valores e forma de pagamento; e operacional, pela equipe que confirma viabilidade de entrega e montagem. A consultora organiza a evidência, mas não se atribui aprovação de terceiros. Se houver mudança depois do aceite, reabra a etapa afetada e solicite nova confirmação formal.",
      "Antes da passagem do pedido, leia ao cliente um resumo claro da composição, do que está confirmado e do que continua condicionado à verificação. Registre responsáveis, datas, documentos e pendências em checklist rastreável, sem inserir dados reais na simulação. Esta aula não emite pedidos nem consulta fornecedores; seu objetivo é impedir que uma venda aprovada vire uma entrega incorreta."
    ],
    "demonstrar": {
      "certo": "Vou comparar a versão final com o projeto e as fichas vigentes, registrar as pendências e pedir a validação técnica e comercial antes de liberar o pedido.",
      "errado": "O cliente aprovou o valor, então posso usar qualquer código parecido e trocar o tecido sem avisar para agilizar o pedido.",
      "porQue": "A primeira abordagem separa aprovações e mantém rastreabilidade; a segunda confunde aceite financeiro com autorização técnica e cria risco de erro."
    },
    "praticar": {
      "cenario": "Uma proposta Sierra reúne sofá, mesa e duas poltronas. O cliente aprovou o valor, mas o tecido do sofá difere do memorial e a medida de acesso do elevador ainda não foi conferida.",
      "tarefa": "Monte um checklist de conferência por item, identifique duas pendências impeditivas, indique responsáveis por cada validação e redija uma resposta ao cliente sem prometer emissão imediata."
    },
    "provar": {
      "criterios": [
        "Confere versão vigente",
        "Valida cada item",
        "Respeita projeto",
        "Separa aprovações",
        "Registra pendências",
        "Comunica com clareza"
      ],
      "perguntas": [
        [
          "O que consultar antes de emitir um pedido Sierra?",
          "Proposta final, memorial, projeto e fontes vigentes",
          "Apenas o valor total",
          "Somente a foto do produto",
          "Um pedido antigo de outro cliente"
        ],
        [
          "Aceite de preço equivale à aprovação de tecido?",
          "Não; aprovação comercial e técnica são distintas",
          "Sim, em qualquer situação",
          "Somente quando houver pressa",
          "Dispensa o memorial"
        ],
        [
          "Como tratar código de produto ilegível?",
          "Marcar pendência e consultar fonte autorizada",
          "Escolher o mais parecido",
          "Ignorar o campo",
          "Inventar uma referência"
        ],
        [
          "Qual informação ajuda a prevenir erro de entrega?",
          "Medidas de acesso e restrições de instalação",
          "Somente cor da parede",
          "Quantidade de seguidores",
          "Preferência do motorista"
        ],
        [
          "O que fazer quando a planta diverge da proposta?",
          "Suspender a liberação do item e solicitar revisão",
          "Escolher a menor medida",
          "Apagar a planta anterior",
          "Liberar e corrigir depois"
        ],
        [
          "Uma troca após o aceite exige qual cuidado?",
          "Nova validação da etapa afetada e registro de versão",
          "Somente confirmação verbal da consultora",
          "Nenhum, se o preço não muda",
          "Alterar sem informar"
        ],
        [
          "Quem aprova exceção comercial fora da alçada?",
          "Responsável comercial competente",
          "Qualquer vendedor disponível",
          "O cliente sozinho",
          "O fornecedor por suposição"
        ],
        [
          "Como finalizar a conferência do pedido?",
          "Resumo de itens, aprovações, pendências e responsáveis",
          "Promessa de produção imediata",
          "Exclusão do histórico",
          "Aprovação automática de tudo"
        ]
      ]
    }
  },
  "86": {
    "titulo": "Handoff operacional sem retrabalho",
    "objetivo": "Transferir o pedido Sierra para faturamento, logística e montagem com informações verificadas, responsáveis definidos e retorno estruturado, evitando perda de contexto.",
    "aprender": [
      "Uma venda só está pronta para a operação quando o pedido pode ser entendido sem depender da memória da consultora. Prepare um dossiê mínimo com identificação interna da proposta, versão aprovada, lista de itens e especificações, comprovantes de aprovações, dados de entrega estritamente necessários e pendências sinalizadas. Não inclua informações pessoais que não sejam necessárias à execução.",
      "Organize a passagem por etapas: confirmação documental, conferência comercial e financeira, pedido ao fornecedor quando autorizado, acompanhamento de produção, planejamento de transporte, agendamento e montagem. Cada etapa deve ter responsável e critério de conclusão. A consultora não deve inventar data ou status; use somente informação formalmente confirmada pela equipe competente.",
      "Registre detalhes operacionais que frequentemente causam retrabalho: endereço e cidade confirmados, restrições de condomínio, acesso de caminhão, elevador, escadas, horário de recebimento, obra em andamento e necessidade de proteção do ambiente. Dados sensíveis devem circular apenas entre pessoas autorizadas. A checagem de acesso precisa ocorrer antes de qualquer promessa definitiva de entrega.",
      "Adote confirmação de recebimento pelo próximo responsável: a operação verifica se o dossiê está completo, informa dúvidas e devolve itens pendentes sem apagar o histórico. Se surgir incompatibilidade de medida, acabamento ou condição, pause somente a etapa impactada e acione a consultora e o responsável técnico. Uma atualização deve gerar nova versão rastreável, não mensagens conflitantes.",
      "Depois da passagem, mantenha o cliente informado por um único fluxo de comunicação combinado, sem mensagens automáticas nesta simulação. Diferencie pedido registrado, produção confirmada, transporte planejado e entrega agendada. Feche a aula com uma conferência de mão dupla: quem entregou as informações e quem as recebeu confirmam o próximo passo e a responsabilidade."
    ],
    "demonstrar": {
      "certo": "O pedido está na versão aprovada, com acabamentos e acessos conferidos. Encaminho o dossiê para a operação validar o recebimento e informar o próximo marco confirmado.",
      "errado": "Já passei o pedido pelo grupo; não precisa conferir documentos, e prometi entrega na sexta sem falar com a logística.",
      "porQue": "A passagem correta usa evidências e aceite do próximo responsável; a incorreta perde contexto e transforma suposição em compromisso."
    },
    "praticar": {
      "cenario": "Cliente comprou composição Sierra para apartamento em condomínio. A proposta está aprovada, mas a operação não recebeu medidas do elevador nem autorização de horário para descarga.",
      "tarefa": "Escreva o dossiê mínimo de passagem, uma mensagem interna solicitando confirmação de recebimento e um retorno ao cliente que diferencie pedido aprovado de entrega agendada."
    },
    "provar": {
      "criterios": [
        "Prepara dossiê",
        "Define responsáveis",
        "Confere acesso",
        "Obtém aceite interno",
        "Mantém versões",
        "Atualiza cliente sem prometer"
      ],
      "perguntas": [
        [
          "Qual é o objetivo do handoff operacional?",
          "Transferir contexto verificável e responsabilidades",
          "Encerrar qualquer acompanhamento",
          "Repetir a venda do início",
          "Dispensar conferência"
        ],
        [
          "O que deve constar no dossiê mínimo?",
          "Versão aprovada, itens, validações e pendências",
          "Somente primeiro nome",
          "Uma foto sem referência",
          "Promessa verbal de prazo"
        ],
        [
          "Quem confirma o agendamento de entrega?",
          "Equipe operacional competente após verificações",
          "Qualquer pessoa sem consulta",
          "A consultora por estimativa",
          "O cliente unilateralmente"
        ],
        [
          "Como tratar acesso de elevador não conferido?",
          "Registrar impedimento e solicitar validação",
          "Garantir que tudo cabe",
          "Omitir do transporte",
          "Trocar produto sem avisar"
        ],
        [
          "O próximo setor encontra divergência. O que fazer?",
          "Devolver pendência com registro e responsável",
          "Apagar versão anterior",
          "Prosseguir silenciosamente",
          "Culpar o cliente"
        ],
        [
          "Como reduzir retrabalho na passagem?",
          "Checklist e confirmação de recebimento pelo responsável",
          "Mensagens soltas sem histórico",
          "Mudar itens após o aceite",
          "Prometer prazo fixo"
        ],
        [
          "Qual status pode ser informado ao cliente?",
          "Apenas marco efetivamente confirmado",
          "Produção concluída por suposição",
          "Entrega agendada sem agenda",
          "Pedido faturado sem conferência"
        ],
        [
          "O que fazer com dados pessoais do cliente?",
          "Compartilhar apenas o necessário com autorizados",
          "Publicar no grupo geral",
          "Anexar em material de treinamento",
          "Enviar a qualquer parceiro"
        ]
      ]
    }
  },
  "87": {
    "titulo": "Pós-venda Sierra",
    "objetivo": "Acompanhar a experiência após entrega Sierra, registrar ocorrências de modo responsável e estimular relacionamento e indicação somente no momento adequado e com consentimento.",
    "aprender": [
      "O pós-venda começa antes de surgir um problema: confirme com a operação a conclusão da entrega e da montagem, sem presumir que pedido faturado significa ambiente finalizado. Combine com o cliente um canal e momento adequados para verificar sua experiência. Pergunte sobre integridade, instalação, uso inicial e aderência ao projeto, sem pressionar por avaliação ou indicação.",
      "Se o cliente relatar avaria, diferença de acabamento, peça faltante ou desconforto, acolha a descrição e registre fatos verificáveis: item, data, contexto, evidências autorizadas e impacto no uso. Não atribua culpa nem prometa troca, reparo ou cobertura antes de análise da área competente. Preserve privacidade ao solicitar imagens e não divulgue detalhes do ambiente a terceiros sem permissão.",
      "Classifique o encaminhamento pelo tipo de ocorrência: montagem e logística, divergência de pedido, possível assistência técnica ou orientação de uso. Informe quem será responsável por analisar e o próximo contato combinado. O cliente deve perceber continuidade entre consultora, gestor e operação, sem precisar repetir toda a história a cada transferência.",
      "Quando houver solução proposta, explique o que foi validado, o que ainda depende de análise e os passos seguintes. Registre a resposta do cliente e confirme a conclusão somente após evidência de resolução, não pelo simples encerramento de um chamado interno. Se a insatisfação persistir, escale ao gestor com histórico objetivo e respeite o prazo de retorno combinado.",
      "Após confirmação de satisfação, uma avaliação pública ou indicação pode ser convidada de forma opcional e respeitosa, nunca exigida como condição de assistência. Peça autorização antes de usar fotos do ambiente, nome ou depoimento. Esta aula usa cenário fictício e não abre chamados, envia mensagens ou altera cadastros; o foco é aprender a transformar entrega em relacionamento de longo prazo."
    ],
    "demonstrar": {
      "certo": "Quero confirmar como ficou a instalação e se o ambiente atendeu ao que planejamos. Se houver qualquer ponto a ajustar, registro e encaminho ao responsável para análise.",
      "errado": "Se o móvel chegou, o atendimento terminou. Dê cinco estrelas agora; qualquer problema é culpa da transportadora e já garanto troca.",
      "porQue": "O pós-venda correto acolhe, verifica e encaminha com responsabilidade; o incorreto pressiona, atribui culpa e promete solução sem autorização."
    },
    "praticar": {
      "cenario": "Após montagem Sierra, cliente relata um detalhe no acabamento de uma poltrona e elogia a composição da sala. Ainda não houve vistoria técnica, e a cliente pediu retorno na próxima semana.",
      "tarefa": "Crie roteiro de acolhimento, registro de ocorrência, encaminhamento à área competente, mensagem de atualização e convite opcional para avaliação apenas após resolução confirmada."
    },
    "provar": {
      "criterios": [
        "Confirma conclusão",
        "Escuta e registra",
        "Preserva privacidade",
        "Encaminha corretamente",
        "Verifica resolução",
        "Pede indicação com consentimento"
      ],
      "perguntas": [
        [
          "Quando considerar uma entrega concluída?",
          "Após confirmação operacional e verificação adequada",
          "Quando o pedido é vendido",
          "Quando há previsão de transporte",
          "Ao emitir orçamento"
        ],
        [
          "Cliente relata avaria. Qual a primeira atitude?",
          "Acolher e registrar fatos e evidências autorizadas",
          "Prometer troca imediata",
          "Negar antes de ouvir",
          "Culpar a montagem"
        ],
        [
          "Como tratar fotos do ambiente do cliente?",
          "Solicitar permissão e limitar o compartilhamento",
          "Publicar automaticamente",
          "Encaminhar a todos os vendedores",
          "Usar em anúncio sem autorização"
        ],
        [
          "Quem define eventual solução técnica?",
          "Área competente após análise do caso",
          "Consultora sem avaliação",
          "Qualquer visitante",
          "Uma postagem em rede social"
        ],
        [
          "Quando encerrar a ocorrência?",
          "Depois de confirmar a resolução com evidências",
          "Ao encaminhar ao gerente",
          "Quando o cliente para de responder uma vez",
          "Ao emitir novo orçamento"
        ],
        [
          "O cliente pede retorno na próxima semana. Como agir?",
          "Respeitar o momento combinado e registrar responsável",
          "Enviar mensagens diárias",
          "Ignorar a preferência",
          "Solicitar avaliação imediata"
        ],
        [
          "Qual momento adequado para pedir indicação?",
          "Após satisfação confirmada e sem pressão",
          "Antes de analisar reclamação",
          "Como condição de assistência",
          "Durante conflito não resolvido"
        ],
        [
          "O que comunicar em um caso ainda em análise?",
          "Status real, responsável e próximo retorno",
          "Prazo inventado de solução",
          "Garantia sem análise",
          "Culpa atribuída a terceiros"
        ]
      ]
    }
  }
};
