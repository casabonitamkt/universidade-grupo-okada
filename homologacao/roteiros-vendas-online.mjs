/* Conteúdo complementar do piloto: estudo aplicado para vendas online.
 * Apenas homologação. Não altera avaliações ou progresso.
 */
export const CENARIOS_WHATSAPP={
  1:{
    titulo:"Primeiro contato com referência",
    cliente:"Olá, vi uma mesa de jantar para oito lugares no Instagram de vocês. Tenho umas fotos de referência, mas ainda não mandei. Como funciona?",
    contexto:"O cliente não enviou imagens, não informou medidas e não pediu preço. É o primeiro contato.",
    tarefa:"Escreva uma mensagem de WhatsApp que reconheça o pedido, apresente o atendimento e faça UMA pergunta prioritária. Não presuma ter recebido fotos, não ofereça catálogo nem preço.",
    criterio:"Priorize receber a referência mencionada; deixe medidas, cidade e prazo para a sequência."
  },
  2:{
    titulo:"Escuta ativa com uso do ambiente",
    cliente:"Quero um sofá bonito para minha sala, mas temos cachorro e recebemos muita visita. Ainda não pensei em orçamento.",
    contexto:"Não há fotos, medidas nem ficha técnica. O cliente não definiu faixa de investimento.",
    tarefa:"Responda com acolhimento e uma pergunta aberta sobre a rotina. Não pressione orçamento e não prometa tecido impermeável ou resistente a arranhões.",
    criterio:"A primeira pergunta deve ajudar a compreender o uso; outras informações virão depois."
  },
  3:{
    titulo:"Peça ou projeto completo?",
    cliente:"Preciso de duas poltronas, mas estou reformando a casa inteira. Minha arquiteta ainda está finalizando a planta.",
    contexto:"O pedido inicial é uma peça, mas existe potencial de projeto e participação de arquiteta.",
    tarefa:"Escreva a próxima mensagem para confirmar o escopo sem impor mudança ao projeto. Indique qual material pediria na sequência e como envolveria a arquiteta.",
    criterio:"Confirmar se a cotação abrange os demais ambientes antes de enviar opções."
  },
  4:{
    titulo:"Cidade, obra e prazo sem promessas",
    cliente:"Estou terminando minha casa em outra cidade. Queria mobiliar a sala e receber tudo antes de mudar, mas não sei quando a obra fica pronta.",
    contexto:"Não foram informados município, data de liberação da obra, medidas ou plantas. O cliente quer planejar.",
    tarefa:"Escreva a primeira resposta para esclarecer uma pendência decisiva do contexto e combinar o próximo passo. Não prometa prazo de fabricação ou entrega.",
    criterio:"Distinguir desejo de entrega e obra pronta; coletar dados gradualmente."
  }
};
export const MISSOES_APLICADAS={
  1:{
    foco:"Transformar uma mensagem vaga em um diálogo com próximo passo.",
    passos:[
      "Leia o pedido como o cliente escreveu. Antes de responder, sublinhe mentalmente o produto, o contexto já confirmado e a principal informação que falta.",
      "Comece reconhecendo o interesse específico. Em alto padrão, a resposta deve demonstrar atenção ao pedido, não ser uma saudação automática ou um catálogo genérico.",
      "Faça uma única pergunta que desbloqueie a próxima ação. Se ele citou fotos mas não as enviou, peça a referência primeiro. Se já enviou, agradeça e não repita a solicitação.",
      "Depois da resposta, avance para medidas, ambiente, cidade, prazo e eventual arquiteto, conforme a necessidade. Não faça um interrogatório na primeira mensagem.",
      "Registre produto, origem do lead, status das fotos e próximo contato. Uma conversa sem responsável e retorno pode ser perdida mesmo quando o cliente está interessado."
    ],
    desafio:"Cliente escreveu: 'Vi um sofá Sierra no Instagram'. Qual seria sua única pergunta inicial? Explique por que pedir preço ou medidas antes de identificar a referência pode atrapalhar.",
    sinal:"Você concluiu bem se a resposta poderia ser enviada agora, sem inventar informação e sem sobrecarregar o cliente."
  },
  2:{
    foco:"Identificar critérios de compra sem transformar a conversa em interrogatório.",
    passos:[
      "Escuta ativa não é colecionar dados: é identificar o que muda a escolha. 'Receber visitas' aponta para conforto e quantidade de assentos; 'cachorro' aponta para cuidados de manutenção que precisam de ficha técnica.",
      "Pergunte primeiro sobre a rotina e aguarde a resposta. Uma pergunta aberta pode revelar mais do que uma lista de cinco perguntas fechadas.",
      "Faça uma síntese com fatos: 'Pelo que entendi, você busca uma sala confortável para receber amigos e precisa considerar a rotina com o cachorro'. Depois valide se entendeu.",
      "Se a pessoa evita falar em investimento, não encerre o contato. Continue entendendo o ambiente e proponha alinhar faixa de valores quando houver opções coerentes.",
      "Antes de prometer resistência, impermeabilidade ou prazo, consulte o catálogo e a equipe responsável. Uma promessa errada prejudica a confiança construída na conversa."
    ],
    desafio:"O cliente diz: 'Quero algo bonito, mas não quero ficar limpando o sofá o tempo todo'. Escreva uma pergunta útil e uma frase de cautela técnica, sem afirmar características não verificadas.",
    sinal:"O cliente deve perceber que sua rotina está orientando a proposta e não que você está tentando empurrar uma peça."
  },
  3:{
    foco:"Classificar corretamente projeto x peça e respeitar o especificador.",
    passos:[
      "A primeira palavra do pedido não define o escopo. Duas poltronas podem ser uma compra isolada ou a entrada para o mobiliário de uma residência inteira.",
      "Confirme se a cotação será apenas das poltronas ou se o cliente pretende orçar outros ambientes. Só depois organize o levantamento.",
      "Se for projeto, peça planta e memorial quando disponíveis, mapeie os ambientes e registre o que já foi especificado pela arquiteta.",
      "Não substitua peças, dimensões ou acabamentos aprovados sem autorização. Se houver alternativa, apresente-a como proposta sujeita à validação do cliente e da arquiteta.",
      "Organize a proposta por ambientes e combine como será a apresentação: conversa com arquiteta, chamada com cliente ou revisão conjunta."
    ],
    desafio:"Uma arquiteta já especificou um sofá e o cliente pede outro modelo mais barato. Escreva como você encaminharia a comparação sem trocar o item por conta própria.",
    sinal:"O registro deve permitir que gerente e consultora saibam quais peças estão aprovadas e quais ainda exigem validação."
  },
  4:{
    foco:"Criar um briefing verificável com cidade, estágio da obra e prazos.",
    passos:[
      "Confirme a cidade de instalação e se o imóvel já pode receber móveis. Local e acesso afetam o planejamento, mas não autorizam prometer prazo.",
      "Separe três datas: quando o cliente gostaria de receber, quando a obra ficará pronta e quando a equipe responsável poderá confirmar entrega. Não trate uma como se fosse outra.",
      "Uma foto mostra composição e referências; medidas e planta cotada ajudam a conferir proporção e circulação. Registre o que foi recebido e o que ainda está pendente.",
      "Se houver arquiteto, identifique a versão válida do projeto e o responsável por autorizar qualquer mudança. Documente a proposta por ambientes.",
      "Encerre o contato com um resumo do que está confirmado e uma ação com responsável e data combinada para retorno. Isso reduz retrabalho e abandono do lead."
    ],
    desafio:"O cliente quer tudo entregue antes da mudança, mas a obra não tem data. Como registrar o prazo sem prometer o que depende de terceiros?",
    sinal:"O briefing está bom se outra consultora conseguir retomar a conversa sem perguntar novamente o que já foi informado."
  }
};
