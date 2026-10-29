// Homologacao puramente local: ficha observacional do marco F1-D30.
// Nao autentica avaliador, nao grava notas, nao conclui aula e nao certifica.
// Nunca utilizar este parecer para liberar acesso no treinamento real.

const CRITERIOS = 10;
const NOTA_MINIMA = 8;
const NOTAS_PERMITIDAS = new Set([0, 0.5, 1]);

function validarTexto(texto, nome) {
  if (typeof texto !== 'string' || texto.trim().length < 12) {
    throw new Error(nome + ' exige descricao observavel');
  }
  return texto.trim();
}

export function avaliarFichaPraticaOffline(ficha) {
  if (!ficha || typeof ficha !== 'object' || Array.isArray(ficha)) {
    throw new Error('Ficha pratica ausente');
  }
  if (!Array.isArray(ficha.criterios) || ficha.criterios.length !== CRITERIOS ||
      ficha.criterios.some(nota => !NOTAS_PERMITIDAS.has(nota))) {
    throw new Error('Rubrica exige 10 criterios de 0, 0.5 ou 1 ponto');
  }
  for (let i = 0; i < CRITERIOS; i++) {
    if (ficha.criterios[i] === 0.5) {
      validarTexto(ficha.justificativasParciais?.[i], 'Justificativa parcial do criterio ' + (i + 1));
    }
  }
  if (typeof ficha.erroCritico !== 'boolean') {
    throw new Error('Erro critico deve ser registrado explicitamente');
  }
  if (!Array.isArray(ficha.evidencias) || ficha.evidencias.length < 2) {
    throw new Error('Cada simulacao exige duas evidencias observaveis');
  }
  const evidencias = ficha.evidencias.map(item => validarTexto(item, 'Evidencia'));
  if (new Set(evidencias.map(item => item.toLocaleLowerCase('pt-BR'))).size !== evidencias.length) {
    throw new Error('Evidencias repetidas na mesma simulacao');
  }
  validarTexto(ficha.acaoMelhoria, 'Acao de melhoria');
  const nota = ficha.criterios.reduce((soma, ponto) => soma + ponto, 0);
  return Object.freeze({
    nota,
    erroCritico: ficha.erroCritico,
    praticaAprovada: nota >= NOTA_MINIMA && !ficha.erroCritico,
    evidenciasRegistradas: evidencias.length,
    // Evidencia e texto nao assinado: a verificacao humana ainda e obrigatoria.
    avaliacaoAutenticada: false,
    conclusaoAutomatica: false,
    certificacaoAutomatica: false
  });
}

export function avaliarMarco30ComRubricaOffline({ resultadoTeorico, simulacaoProjeto, simulacaoPecaAvulsa } = {}) {
  if (!resultadoTeorico || typeof resultadoTeorico.aprovado !== 'boolean') {
    throw new Error('Resultado teorico ausente');
  }
  if (!simulacaoProjeto || !simulacaoPecaAvulsa ||
      simulacaoProjeto === simulacaoPecaAvulsa) {
    throw new Error('Marco 30 exige duas fichas praticas distintas');
  }
  const projeto = avaliarFichaPraticaOffline(simulacaoProjeto);
  const pecaAvulsa = avaliarFichaPraticaOffline(simulacaoPecaAvulsa);
  return Object.freeze({
    teoriaAprovada: resultadoTeorico.aprovado,
    projeto,
    pecaAvulsa,
    prontoParaAnaliseDoGestor: resultadoTeorico.aprovado &&
      projeto.praticaAprovada && pecaAvulsa.praticaAprovada,
    aprovacaoGestorNecessaria: true,
    avaliacaoAutenticada: false,
    conclusaoAutomatica: false,
    certificacaoAutomatica: false
  });
}
