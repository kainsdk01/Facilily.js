const { ErroFacility } = require('./ErroFacility');

const Intencoes = {
  SERVIDORES: 1 << 0,
  MEMBROS_DO_SERVIDOR: 1 << 1,
  MODERACAO_DO_SERVIDOR: 1 << 2,
  ESTADOS_DE_VOZ: 1 << 7,
  MENSAGENS_DO_SERVIDOR: 1 << 9,
  CONTEUDO_DE_MENSAGEM: 1 << 15,
  REACOES_DE_MENSAGEM: 1 << 10,
  MENSAGENS_DIRETAS: 1 << 12,
};

function combinar(...flags) {
  return flags.reduce((acumulado, f) => acumulado | f, 0);
}

/**
 * Resolve uma lista de intenções em bitfield.
 * Aceita strings ("SERVIDORES"), números já resolvidos, ou uma mistura dos dois.
 * Lança erro claro se alguma string não existir, em vez de silenciosamente virar 0.
 */
function resolver(lista) {
  if (typeof lista === 'number') return lista;
  if (!Array.isArray(lista)) return 0;

  return lista.reduce((acumulado, item) => {
    if (typeof item === 'number') return acumulado | item;

    const valor = Intencoes[item];
    if (valor === undefined) {
      throw new ErroFacility(
        'CONFIG_INTENCAO_DESCONHECIDA',
        `Intenção "${item}" não existe. Opções válidas: ${Object.keys(Intencoes).join(', ')}.`,
      );
    }
    return acumulado | valor;
  }, 0);
}

module.exports = { Intencoes, combinar, resolver };
