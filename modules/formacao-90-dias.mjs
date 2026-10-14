/* Formação de 90 dias — configuração de homologação, sem alterar dados de alunos.
   Conteúdo Sierra só pode ser publicado com fontes internas autorizadas. */
export const TRILHAS = Object.freeze([
 {inicio:1,fim:30,nome:"Fundamentos do atendimento de alto padrão"},
 {inicio:31,fim:60,nome:"Projetos, arquitetos e negociação avançada"},
 {inicio:61,fim:90,nome:"Especialização e prontidão Sierra"}
]);
export const MARCOS = Object.freeze({
 30:{competencias:["diagnostico","briefing","comunicacao","registro_crm"],notaMinima:8,evidenciasMinimas:2,aprovacaoGestor:true},
 60:{competencias:["projeto","arquiteto","proposta","negociacao","followup"],notaMinima:8,evidenciasMinimas:3,aprovacaoGestor:true},
 90:{competencias:["sierra_produto_validado","sierra_especificacao_validada","atendimento_completo","etica_comercial"],notaMinima:8,evidenciasMinimas:3,aprovacaoGestor:true,exigeFontesSierra:true}
});
export function trilhaDoDia(dia){
 if(!Number.isInteger(dia)||dia<1||dia>90) throw new RangeError("Dia deve estar entre 1 e 90");
 return TRILHAS.find(t=>dia>=t.inicio&&dia<=t.fim);
}
export function avaliarMarco(marco,avaliacao={}){
 const regra=MARCOS[marco];
 if(!regra) throw new Error("Marco inexistente");
 const pendencias=[];
 if(!Number.isFinite(avaliacao.nota)||avaliacao.nota<regra.notaMinima) pendencias.push("Prova mínima 8,0");
 if(!Number.isInteger(avaliacao.evidenciasAprovadas)||avaliacao.evidenciasAprovadas<regra.evidenciasMinimas) pendencias.push("Evidências práticas aprovadas insuficientes");
 for(const competencia of regra.competencias){
  if(!Number.isFinite(avaliacao.competencias?.[competencia])||avaliacao.competencias[competencia]<8) pendencias.push("Competência abaixo de 8: "+competencia);
 }
 if(regra.exigeFontesSierra && avaliacao.fontesSierraAutorizadas!==true) pendencias.push("Materiais Sierra não validados");
 if(avaliacao.gestorAprovou!==true) pendencias.push("Aprovação expressa do gestor");
 return {marco,apto:pendencias.length===0,pendencias};
}
export const AULA_41 = Object.freeze({
 dia:41,
 titulo:"Condição excepcional: compromisso antes da autorização",
 duracaoMinutos:14,
 publico:"Consultoras e consultores — negociação de alto padrão",
 competencias:["negociacao","comunicacao","etica_comercial"],
 objetivo:"Distinguir pedido comercial do cliente de autorização da loja, registrar a proposta do cliente e confirmar intenção real de fechamento antes de submeter uma exceção.",
 blocos:[
  {etapa:"APRENDER",minutos:4,texto:"Quando o cliente pede condição fora da alçada, não prometa aprovação. Primeiro compreenda a condição desejada, o escopo e o prazo. Peça que o cliente formalize a proposta, confirme se o projeto e os itens permanecem iguais e registre tudo. A aprovação pertence ao gestor."},
  {etapa:"DEMONSTRAR",minutos:3,texto:"Cenário: cliente recebeu orçamento de um ambiente e solicita uma condição adicional. Resposta adequada: 'Entendi a condição que você procura. Pode me encaminhar exatamente a proposta que gostaria de apresentar? Vou verificar internamente, sem prometer aprovação. Se conseguirmos chegar nessa condição, ou muito próximo dela, você consegue confirmar o fechamento hoje?' Resposta inadequada: 'Pode deixar que consigo mais desconto'."},
  {etapa:"PRATICAR",minutos:4,texto:"Simule três objeções: pedido sem valor definido, proposta concorrente com escopo diferente e pedido de desconto com prazo incerto. Para cada uma, escreva uma resposta de WhatsApp, registre o compromisso condicional e identifique o que precisa de autorização. Nunca altere peça, material ou medida sem concordância."},
  {etapa:"PROVAR",minutos:3,texto:"Responda à prova A. Nota mínima 8. Se reprovar, revise as competências erradas e faça a prova B, com questões diferentes. O gestor avalia a simulação e registra evidência antes de liberar competência."}
 ],
 certoErrado:[
  {certo:"Pedir ao cliente a condição específica e confirmar fechamento condicionado à aprovação.",errado:"Prometer desconto sem alçada."},
  {certo:"Confirmar escopo, materiais e prazo antes de comparar propostas.",errado:"Trocar itens silenciosamente para reduzir o preço."},
  {certo:"Registrar negociação e solicitar autorização ao gestor.",errado:"Marcar venda fechada antes da confirmação."}
 ],
 errosComuns:["Negociar sem identificar o que o cliente quer","Confundir intenção com compromisso","Prometer aprovação","Mudar o projeto sem consentimento","Não registrar o próximo contato"],
 exercicio:{instrucao:"Escreva a mensagem de retorno ao cliente, o resumo de CRM e a solicitação ao gestor para uma proposta excepcional.",rubrica:["Condição solicitada explícita","Compromisso condicional de fechamento hoje","Sem promessa de aprovação","Escopo preservado","Próximo contato definido"]},
 provas:{
 A:[
  {pergunta:"Quem aprova condição fora da alçada?",alternativas:["Consultora","Gestor autorizado","Cliente","Arquiteto"],correta:1,competencia:"etica_comercial"},
  {pergunta:"Qual o primeiro passo após pedido genérico de desconto?",alternativas:["Alterar produto","Prometer retorno com desconto","Solicitar proposta específica do cliente","Marcar venda"],correta:2,competencia:"negociacao"},
  {pergunta:"Qual frase confirma intenção sem prometer aprovação?",alternativas:["Está aprovado","Se alcançarmos essa condição ou algo próximo, fechamos hoje?","Vou trocar o tecido","É o menor preço do mercado"],correta:1,competencia:"negociacao"},
  {pergunta:"Antes de comparar duas propostas, o que conferir?",alternativas:["Somente total","Cor da logo","Escopo, itens, materiais e prazo","Nome do vendedor"],correta:2,competencia:"comunicacao"},
  {pergunta:"Quando registrar venda?",alternativas:["Ao receber objeção","Quando o cliente pedir desconto","Após confirmação real e validações","Antes da autorização"],correta:2,competencia:"etica_comercial"}
 ],
 B:[
  {pergunta:"O cliente pede 'o melhor preço'. Qual resposta é adequada?",alternativas:["Consigo qualquer condição","Qual condição objetiva você gostaria que eu avaliasse?","Vou retirar peças","Já está fechado"],correta:1,competencia:"negociacao"},
  {pergunta:"A condição desejada está fora da alçada. Como agir?",alternativas:["Aprovar sozinho","Não registrar","Encaminhar proposta e compromisso ao gestor","Trocar produto sem avisar"],correta:2,competencia:"etica_comercial"},
  {pergunta:"O concorrente ofertou preço menor com itens diferentes. O que fazer?",alternativas:["Comparar apenas totais","Revisar escopo antes da negociação","Afirmar que é igual","Copiar preço"],correta:1,competencia:"comunicacao"},
  {pergunta:"O cliente aceita fechar se a condição for aprovada. O que registrar?",alternativas:["Condição, escopo, compromisso e próximo contato","Somente nome","Somente preço","Nada"],correta:0,competencia:"negociacao"},
  {pergunta:"Aprovação interna foi negada. O que comunicar?",alternativas:["Inventar aprovação","Ocultar decisão","Apresentar alternativas autorizadas sem prometer","Alterar medidas"],correta:2,competencia:"etica_comercial"}
 ]
 },
 avaliacao:{notaMinima:8,retesteDiferente:true,evidenciaGestorObrigatoria:true,semCertificacaoAutomatica:true}
});
export function corrigirProva(versao,respostas){
 const questoes=AULA_41.provas[versao];
 if(!questoes||!Array.isArray(respostas)||respostas.length!==questoes.length) throw new Error("Prova ou respostas inválidas");
 const erros=questoes.flatMap((q,i)=>q.correta===respostas[i]?[]:[q.competencia]);
 const nota=Number(((questoes.length-erros.length)*10/questoes.length).toFixed(1));
 return {nota,aprovado:nota>=8,revisar:[...new Set(erros)],proximo:nota>=8?"Aguardar validação prática do gestor":versao==="A"?"Revisão direcionada e reteste B":"Nova revisão orientada pelo gestor"};
}
