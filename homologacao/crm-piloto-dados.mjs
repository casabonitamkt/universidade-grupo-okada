export const LOJAS=['Casa Bonita Móveis','Móveis Modernos'];
export const ETAPAS=['Novo lead','Qualificação','Proposta enviada','Negociação','Fechado'];

export const CASOS=[
{id:"mesa",titulo:"Mesa 8 lugares",etapa:"Qualificação",briefing:"Cliente procura mesa de jantar para 8 pessoas. Mencionou ter fotos de referência, mas ainda não as enviou. Não informou medidas.",criterio:"Pedir somente as fotos, sem confundir mencionadas com recebidas."},
{id:"sierra",titulo:"Sofá Sierra",etapa:"Qualificação",briefing:"Cliente viu um sofá Sierra no Instagram e deseja informações. Ainda não enviou imagem ou link.",criterio:"Pedir apenas a referência do sofá visto. Não inventar modelos."},
{id:"objecao",titulo:"Objeção de preço",etapa:"Negociação",briefing:"Cliente gostou do sofá, mas encontrou outro parecido mais barato em outra loja. Não há ficha técnica do concorrente.",criterio:"Investigar comparação equivalente, sem oferecer desconto ou produto inferior."},
{id:"followup",titulo:"Recuperar orçamento",etapa:"Proposta enviada",briefing:"Cliente recebeu orçamento completo do mobiliário de sua casa há cinco dias e ainda avalia outras lojas.",criterio:"Retomar a decisão com pergunta útil, sem reiniciar briefing."},
{id:"fechamento",titulo:"Fechamento hoje",etapa:"Negociação",briefing:"Cliente gostou da proposta detalhada para a sala e disse que fecha hoje se conseguir condição comercial melhor.",criterio:"Pedir contraproposta e confirmar fechamento condicionado à aprovação."}
];
export const DEMO_LEADS=[
{id:"L101",nome:"Marina A.",loja:"Casa Bonita Móveis",consultora:"Consultora A",origem:"Instagram",produto:"Mesa · 8 lugares",etapa:"Novo lead",ultimo:"09:18",prazo:"Hoje",caso:"mesa"},
{id:"L102",nome:"Carlos R.",loja:"Casa Bonita Móveis",consultora:"Consultora B",origem:"Instagram",produto:"Sofá Sierra",etapa:"Qualificação",ultimo:"Ontem",prazo:"Hoje",caso:"sierra"},
{id:"L103",nome:"Patrícia M.",loja:"Móveis Modernos",consultora:"Consultora C",origem:"WhatsApp",produto:"Sofá",etapa:"Negociação",ultimo:"Ontem",prazo:"Hoje",caso:"objecao"},
{id:"L104",nome:"Ricardo F.",loja:"Móveis Modernos",consultora:"Consultora D",origem:"Indicação",produto:"Projeto residencial",etapa:"Proposta enviada",ultimo:"Há 5 dias",prazo:"Atrasado",caso:"followup"},
{id:"L105",nome:"Fernanda S.",loja:"Casa Bonita Móveis",consultora:"Consultora A",origem:"WhatsApp",produto:"Sala de estar",etapa:"Negociação",ultimo:"Hoje",prazo:"Hoje",caso:"fechamento"},
{id:"L106",nome:"André L.",loja:"Móveis Modernos",consultora:"Consultora C",origem:"Arquiteto",produto:"Projeto por ambientes",etapa:"Fechado",ultimo:"Há 2 dias",prazo:"Concluído",caso:"followup"}
];

export function extrairMensagem(texto){
 const m=String(texto||"").match(/(?:Mensagem para WhatsApp|Mensagem sugerida ao cliente):\s*([\s\S]*?)(?=\n\s*(?:Cuidado|Atenção comercial):|$)/i);
 return m?m[1].trim().replace(/^["“]|["”]$/g,""):"";
}
export function avaliarMensagem(texto,casoId){
 const m=extrairMensagem(texto),problemas=[];
 if(!m)problemas.push("Mensagem não identificada.");
 if(m.length>320)problemas.push("Mensagem muito longa.");
 if((m.match(/\?/g)||[]).length>1)problemas.push("Mais de uma pergunta.");
 if(/desconto garantido|desconto aprovado|garanto o desconto|pronta entrega/i.test(m))problemas.push("Promessa não verificada.");
 if(casoId==="fechamento"&&m&&!/se (eu |nós )?(conseguir|conseguirmos|for aprovad|aprovar)|caso (seja|consiga)|concluir.*hoje/i.test(m))problemas.push("Não confirmou fechamento condicionado.");
 if(casoId==="mesa"&&/foto/i.test(m)&&/medid|formato|estilo/i.test(m))problemas.push("Pediu fotos e outros dados juntos.");
 if(casoId==="objecao"&&/mais barat|opção mais econômica/i.test(m))problemas.push("Ofereceu alternativa barata.");
 return {mensagem:m,problemas,aprovado:problemas.length===0};
}
export function resumo(leads){return {total:leads.length,abertos:leads.filter(l=>l.etapa!=="Fechado").length,propostas:leads.filter(l=>l.etapa==="Proposta enviada").length,negociacoes:leads.filter(l=>l.etapa==="Negociação").length,fechados:leads.filter(l=>l.etapa==="Fechado").length,atrasados:leads.filter(l=>l.prazo==="Atrasado"&&l.etapa!=="Fechado").length};}
