const funcoes = new Map();

/**
 * @param {string} nome
 * @param {Function} executar
 * @param {{ bruto?: boolean }} [opcoes]
 *   bruto: quando true, o motor NÃO avalia os argumentos antes de chamar a
 *   função — passa os pedaços de código crus (ainda com #outrasFuncoes[]
 *   dentro, não resolvidas) e um terceiro parâmetro `avaliar(texto)` pra
 *   função decidir, ela mesma, quais pedaços resolver. Necessário pra
 *   funções que ramificam (tipo #se[]), senão TODOS os branches seriam
 *   executados (com efeitos colaterais e tudo) antes da escolha acontecer.
 */
function registrar(nome, executar, opcoes = {}) {
  funcoes.set(nome.toLowerCase(), { nome: nome.toLowerCase(), executar, bruto: !!opcoes.bruto });
}

function obter(nome) {
  return funcoes.get(nome.toLowerCase());
}

module.exports = { registrar, obter, funcoes };
