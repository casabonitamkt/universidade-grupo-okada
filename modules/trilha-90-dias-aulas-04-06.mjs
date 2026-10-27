/* Conteúdo editorial para homologação da formação de 90 dias.
 * Dias 4 a 6: material de revisão, sem publicação no treinamento oficial,
 * sem gravação de progresso, nota, usuário ou certificação.
 * Respostas corretas das questões ficam na primeira alternativa e
 * são reordenadas pela função questoesPara do módulo principal.
 */
export const AULAS_04_06 = {
  4: {
    objetivo: "Confirmar cidade, endereço de entrega quando apropriado e contexto logístico sem transformar o primeiro atendimento em coleta excessiva de dados.",
    aprender: [
      "A cidade do cliente é uma informação comercial básica porque pode influenciar visita, atendimento remoto, conferência de entrega e encaminhamento para a equipe correta. Pergunte a cidade logo após entender a demanda, de forma natural: 'Para eu organizar seu atendimento, em qual cidade fica o ambiente?'. Não peça endereço completo na primeira mensagem se isso ainda não for necessário.",
      "Diferencie cidade onde o cliente mora de cidade onde os móveis serão instalados. Um cliente pode morar em Umuarama e mobiliar um imóvel em Dourados, por exemplo. Registre ambas apenas se forem relevantes. Quando o imóvel está em obra, confirme o estágio do projeto e quem será o contato para medições e recebimento.",
      "A localização nunca deve virar promessa de prazo ou valor de frete. A consultora registra a cidade, consulta a equipe responsável e informa que disponibilidade, logística e condições serão confirmadas. Evite dizer 'entregamos em qualquer lugar' ou 'chega na próxima semana' sem verificação.",
      "Para cliente de outra cidade, ofereça continuidade por WhatsApp, ligação ou vídeo conforme preferência dele. Se houver arquiteto ou responsável local, peça autorização para incluí-lo no alinhamento. A prioridade é avançar com o projeto e não exigir deslocamento até a loja.",
      "No CRM, registre a cidade do projeto, o canal de atendimento, eventual necessidade de visita técnica e a próxima ação com responsável e prazo combinado. Se a informação ainda não estiver confirmada, marque como pendente; nunca complete campos por suposição."
    ],
    demonstrar: {
      certo: "Ótimo, vou analisar as opções para sua sala. O imóvel fica em qual cidade? Assim consigo orientar o atendimento e confirmar a logística com nossa equipe quando chegarmos à proposta.",
      errado: "Pode fechar agora; entregamos amanhã em qualquer cidade sem custo.",
      porQue: "A abordagem correta coleta apenas o necessário e condiciona logística à confirmação. A incorreta cria promessas comerciais e operacionais não autorizadas."
    },
    praticar: {
      cenario: "Uma cliente de Maringá pede um sofá para um apartamento em construção em Campo Mourão. Ela prefere atendimento por vídeo e ainda não sabe a data de entrega da obra.",
      tarefa: "Escreva a resposta inicial, identifique qual cidade deve constar como local do projeto, quais informações logísticas ficam pendentes e a próxima ação. Não prometa frete ou prazo."
    },
    provar: {
      criterios: ["Cidade do projeto confirmada", "Residência e instalação diferenciadas", "Privacidade na coleta", "Logística sujeita a consulta", "Canal remoto respeitado", "Pendências registradas"],
      perguntas: [
        ["Por que confirmar a cidade do projeto?", "Para orientar atendimento e verificar logística", "Para presumir renda", "Para prometer frete", "Para dispensar briefing"],
        ["Cliente mora em uma cidade e instala em outra. O que registrar?", "Cidade da instalação e, se útil, residência", "Somente a cidade da loja", "A cidade que parecer mais próxima", "Nenhuma cidade"],
        ["Quando solicitar endereço completo?", "Quando necessário à etapa operacional e com finalidade clara", "Na primeira saudação sempre", "Antes de entender o pedido", "Nunca, mesmo na entrega"],
        ["Como responder sobre frete ainda não conferido?", "Informar que a equipe verificará condições", "Prometer frete grátis", "Inventar valor", "Ignorar a pergunta"],
        ["Cliente distante prefere vídeo. Qual conduta?", "Oferecer continuidade remota e combinar horário", "Exigir visita presencial", "Encerrar atendimento", "Transferir sem contexto"],
        ["Imóvel em obra exige...", "Confirmar estágio e restrições antes de prometer entrega", "Presumir data pronta", "Ignorar acesso ao imóvel", "Aprovar dimensões sem medidas"],
        ["Se a cidade não foi confirmada...", "Registrar pendência e perguntar com respeito", "Preencher por palpite", "Copiar de outro lead", "Prometer entrega"],
        ["Qual próximo passo correto?", "Registrar responsável, ação e prazo combinado", "Esperar sem acompanhamento", "Enviar ofertas sem contexto", "Mudar peças do projeto"]
      ]
    }
  },
  5: {
    objetivo: "Solicitar e organizar fotos, planta e medidas de modo respeitoso, identificando lacunas antes de indicar produtos ou aprovar dimensões.",
    aprender: [
      "Fotos, planta e medidas são instrumentos de diagnóstico, não obstáculos ao atendimento. Explique por que cada referência ajuda: uma foto mostra estilo e contexto; a planta ajuda a compreender circulação; as medidas verificadas reduzem o risco de sugerir um móvel incompatível. Se o cliente não tiver tudo, avance com o que já possui e registre as lacunas.",
      "Para uma peça, pergunte largura, profundidade e altura disponíveis quando fizer sentido, além de portas, elevadores e acessos que possam impactar instalação. Para projeto completo, solicite planta atualizada, ambientes envolvidos, imagens e memorial do arquiteto quando houver. Não trate uma imagem sem escala como medição confiável.",
      "Evite orientar o cliente a medir de forma insegura. Se houver dúvida técnica, ofereça verificação com profissional habilitado ou equipe responsável, conforme processo da loja. Dimensões do produto devem vir de ficha técnica vigente e não de memória, fotografia ou catálogo desatualizado.",
      "Se o cliente enviar um PDF de projeto, confirme o recebimento, identifique páginas e ambientes relevantes e informe que irá estudar antes de montar a proposta. Não substitua peças especificadas sem aprovação do cliente e do arquiteto quando aplicável. Quando a imagem estiver ilegível, peça apenas o trecho necessário em melhor resolução.",
      "No CRM, diferencie 'referência recebida', 'medida informada pelo cliente' e 'medida validada'. Registre o que falta e combine retorno concreto. Essa disciplina evita retrabalho, orçamentos errados e conflitos na entrega."
    ],
    demonstrar: {
      certo: "Para selecionar uma opção que respeite seu espaço, você consegue me enviar uma foto e, se tiver, a planta ou as medidas disponíveis? Posso começar pela foto e confirmar o restante antes da proposta.",
      errado: "Vi sua foto; tenho certeza de que o sofá de 3 metros cabe, pode pagar.",
      porQue: "A abordagem correta justifica o pedido e não bloqueia o atendimento. A incorreta presume escala e promete compatibilidade sem conferência."
    },
    praticar: {
      cenario: "Um cliente envia uma foto da sala e um PDF do arquiteto, mas não há medidas legíveis. Ele pede orçamento imediato de um sofá específico e quer manter o projeto original.",
      tarefa: "Responda ao cliente confirmando os arquivos, liste o que precisa ser conferido, indique como seguirá com o orçamento preliminar sem inventar dimensões e preserve a especificação aprovada."
    },
    provar: {
      criterios: ["Pedido de referências explicado", "Planta e fotos diferenciadas", "Medidas verificadas", "Projeto preservado", "PDF recebido e analisado", "Pendências registradas"],
      perguntas: [
        ["Foto sem escala permite concluir que o móvel cabe?", "Não; medidas precisam ser confirmadas", "Sim, sempre", "Sim, se a foto for nítida", "Sim, pelo preço"],
        ["O que fazer quando faltam medidas?", "Solicitar as necessárias e registrar pendência", "Inventar", "Fechar pedido sem validar", "Descartar cliente"],
        ["Um PDF de arquiteto foi enviado. Próxima etapa?", "Confirmar recebimento e estudar o projeto", "Trocar peças imediatamente", "Ignorar páginas", "Enviar catálogo aleatório"],
        ["Dimensões do produto devem vir de...", "Ficha técnica vigente e aprovada", "Memória da consultora", "Palpite por foto", "Mensagem de concorrente"],
        ["Quando cliente não possui planta...", "Avançar com fotos e dados disponíveis, mantendo pendências", "Encerrar atendimento", "Prometer encaixe", "Exigir planta antes de responder"],
        ["Se houver acesso difícil ao imóvel...", "Encaminhar verificação logística e técnica", "Prometer passagem garantida", "Ignorar elevador", "Adivinhar medidas"],
        ["Substituição de item especificado pelo arquiteto...", "Exige validação expressa antes da proposta final", "É automática", "Pode ser oculta", "Depende só da consultora"],
        ["No CRM, medida informada pelo cliente deve ser...", "Identificada como informada, não validada", "Marcada como verificada", "Excluída", "Tratada como ficha técnica"]
      ]
    }
  },
  6: {
    objetivo: "Transformar rotina, uso do ambiente e prioridades da família em critérios objetivos para uma proposta coerente, sem pressupostos sobre o cliente.",
    aprender: [
      "Um briefing completo começa pelo uso do espaço. A mesma sala pode servir para televisão, leitura, receber amigos ou integrar jantar e estar. Pergunte o que acontece ali durante a semana e em ocasiões especiais. Isso orienta conforto, quantidade de assentos, circulação e manutenção, sem antecipar modelos.",
      "Investigue quem utiliza o ambiente e como: crianças, animais, visitas, pessoas com mobilidade reduzida, hábitos de alimentação, tempo de permanência e necessidade de flexibilidade. Faça perguntas abertas e respeitosas, sem inferir preferências pela aparência ou pela composição familiar.",
      "Separe desejos de restrições. Desejos incluem atmosfera, estilo e sensação de conforto. Restrições incluem espaço, acesso, rotina de limpeza, prazo, projeto aprovado e faixa de investimento quando o cliente desejar compartilhar. Confirme quais critérios são indispensáveis e quais são negociáveis.",
      "Traduza o briefing em argumentos verificáveis. Se o cliente prioriza manutenção, explique que materiais e acabamentos serão conferidos nas fichas técnicas, sem prometer resistência absoluta a manchas ou riscos. Se recebe muitos convidados, avalie composição e circulação com base nas medidas validadas.",
      "Antes de sugerir produtos, faça uma síntese e peça confirmação: 'Entendi que sua prioridade é conforto diário, receber seis pessoas e manter circulação livre; confere?'. Registre no CRM prioridades, restrições, pendências e próximo passo. A proposta deve resolver a necessidade, não apenas apresentar peças bonitas."
    ],
    demonstrar: {
      certo: "Para acertarmos na escolha, como a família costuma usar essa sala no dia a dia? Há alguma prioridade de conforto, manutenção ou circulação que eu deva considerar?",
      errado: "Como você tem cachorro, só pode comprar este tecido; ele nunca mancha.",
      porQue: "A abordagem correta investiga uso sem presumir solução. A incorreta impõe uma escolha e faz afirmação técnica não verificada."
    },
    praticar: {
      cenario: "Um casal quer mobiliar sala integrada. Recebe oito amigos aos sábados, tem duas crianças e um cachorro, e deseja circulação livre. Ainda não enviou a planta.",
      tarefa: "Escreva seis perguntas de briefing, organize três prioridades e três pendências, e conclua com uma síntese de confirmação e próximo passo. Não invente medidas ou propriedades de tecidos."
    },
    provar: {
      criterios: ["Uso diário e eventual", "Pessoas e rotina investigadas", "Desejos separados de restrições", "Argumentos técnicos verificáveis", "Síntese confirmada", "Próxima ação registrada"],
      perguntas: [
        ["Qual pergunta inicia um briefing de uso?", "Como o ambiente é utilizado no dia a dia?", "Quer fechar agora?", "Qual é sua roupa favorita?", "Pode pagar hoje?"],
        ["Cliente recebe amigos frequentemente. O que investigar?", "Assentos, circulação e forma de uso", "Somente cor", "Somente desconto", "Somente marca"],
        ["Com animais de estimação, qual conduta?", "Investigar manutenção e consultar fichas técnicas", "Prometer tecido indestrutível", "Impor um único produto", "Ignorar rotina"],
        ["Desejo e restrição devem ser...", "Diferenciados e priorizados com o cliente", "Tratados como a mesma coisa", "Ignorados", "Definidos sem perguntar"],
        ["Sem planta, é adequado...", "Registrar medidas pendentes antes de garantir encaixe", "Aprovar dimensões por palpite", "Prometer instalação", "Descartar briefing"],
        ["Qual argumento é responsável?", "Conferir especificação e explicar benefício verificável", "Garantir que nunca haverá manchas", "Inventar resistência", "Prometer prazo não consultado"],
        ["Antes de propor a primeira opção...", "Resumir e confirmar critérios com o cliente", "Enviar dezenas de produtos", "Trocar projeto", "Pressionar"],
        ["O que registrar após o briefing?", "Prioridades, restrições, pendências e próxima ação", "Apenas nome", "Apenas preço", "Somente foto"]
      ]
    }
  }
};
