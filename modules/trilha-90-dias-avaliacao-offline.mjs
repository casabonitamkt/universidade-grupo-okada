// Motor PURO de homologacao para provas A/B de aulas reais ainda ocultas.
// Nao importa Supabase, nao grava notas/progresso e NUNCA libera aulas ou certifica.
// Qualquer liberacao autenticada exige fluxo, RLS, auditoria e aprovacao separados.

const TAMANHO_PROVA = 10;
const NOTA_MINIMA = 8;

function falha(mensagem) { throw new Error(mensagem); }

export function validarBancoAvaliacao(conteudo) {
  if (!conteudo || typeof conteudo !== 'object') falha('Conteudo de avaliacao ausente');
  if (conteudo.minimum_score !== NOTA_MINIMA) falha('Nota minima nao homologada');
  if (typeof conteudo.retest_rule !== 'string' || !conteudo.retest_rule.trim()) {
    falha('Regra escrita de reteste ausente');
  }
  const enunciados = new Set();
  for (const versao of ['a', 'b']) {
    const questoes = conteudo['questions_' + versao];
    if (!Array.isArray(questoes) || questoes.length !== TAMANHO_PROVA) {
      falha('Prova ' + versao.toUpperCase() + ' exige 10 questoes');
    }
    let criticas = 0;
    for (const questao of questoes) {
      if (!Array.isArray(questao) || questao.length !== 4) falha('Questao malformada');
      const [enunciado, alternativas, correta, critica] = questao;
      if (typeof enunciado !== 'string' || !enunciado.trim()) falha('Enunciado vazio');
      const chave = enunciado.trim().toLocaleLowerCase('pt-BR');
      if (enunciados.has(chave)) falha('Enunciado repetido entre A e B');
      enunciados.add(chave);
      if (!Array.isArray(alternativas) || alternativas.length < 3 ||
          alternativas.some(a => typeof a !== 'string' || !a.trim())) {
        falha('Alternativas invalidas');
      }
      if (!Number.isInteger(correta) || correta < 0 || correta >= alternativas.length) {
        falha('Gabarito invalido');
      }
      if (typeof critica !== 'boolean') falha('Marcador de erro critico invalido');
      if (critica) criticas++;
    }
    if (!criticas) falha('Prova ' + versao.toUpperCase() + ' sem avaliacao de erro critico');
  }
  return Object.freeze({ versoes: ['A', 'B'], questoesPorVersao: TAMANHO_PROVA, notaMinima: NOTA_MINIMA });
}

export function corrigirAvaliacaoOffline({ conteudo, versao, respostas, resultadoA = null, revisaoEscrita = '' }) {
  validarBancoAvaliacao(conteudo);
  if (versao !== 'A' && versao !== 'B') falha('Versao de prova invalida');
  if (versao === 'B' && (
    resultadoA?.versao !== 'A' || resultadoA?.aprovado !== false ||
    typeof revisaoEscrita !== 'string' || revisaoEscrita.trim().length < 20
  )) falha('Reteste B exige reprovacao A e revisao escrita');
  const questoes = conteudo['questions_' + versao.toLowerCase()];
  if (!Array.isArray(respostas) || respostas.length !== TAMANHO_PROVA) {
    falha('Todas as dez respostas sao obrigatorias');
  }
  let acertos = 0;
  let erroCritico = false;
  for (let i = 0; i < TAMANHO_PROVA; i++) {
    const [, alternativas, correta, critica] = questoes[i];
    if (!Number.isInteger(respostas[i]) || respostas[i] < 0 || respostas[i] >= alternativas.length) {
      falha('Resposta invalida na questao ' + (i + 1));
    }
    if (respostas[i] === correta) acertos++;
    else if (critica) erroCritico = true;
  }
  const aprovado = acertos >= NOTA_MINIMA && !erroCritico;
  return Object.freeze({
    versao, acertos, total: TAMANHO_PROVA, erroCritico, aprovado,
    requerRevisao: !aprovado, proximaVersao: versao === 'A' && !aprovado ? 'B' : null,
    // Sem autenticacao, assinatura do gestor ou persistencia: jamais concluir a aula real.
    conclusaoAutomatica: false, certificacaoAutomatica: false
  });
}

export function avaliarPraticaOffline({ resultadoTeorico, notaPratica, erroCriticoPratico }) {
  if (!resultadoTeorico || typeof resultadoTeorico.aprovado !== 'boolean') {
    falha('Resultado teorico ausente');
  }
  if (!Number.isInteger(notaPratica) || notaPratica < 0 || notaPratica > 10 ||
      typeof erroCriticoPratico !== 'boolean') falha('Avaliacao pratica invalida');
  return Object.freeze({
    teoriaAprovada: resultadoTeorico.aprovado,
    praticaAprovada: notaPratica >= NOTA_MINIMA && !erroCriticoPratico,
    prontoParaAnaliseDoGestor: resultadoTeorico.aprovado &&
      notaPratica >= NOTA_MINIMA && !erroCriticoPratico,
    conclusaoAutomatica: false, certificacaoAutomatica: false
  });
}
