const { ErroFacility } = require('./ErroFacility');

const Intencoes = {
  SERVIDORES: 1 << 0, // GUILDS: canais, cargos, threads, GUILD_CREATE/UPDATE/DELETE
  MEMBROS_DO_SERVIDOR: 1 << 1, // privilegiada — membroEntrou/Saiu/Atualizado
  MODERACAO_DO_SERVIDOR: 1 << 2, // membroBanido / membroDesbanido
  EMOJIS_E_FIGURINHAS: 1 << 3, // emojisAtualizados / figurinhasAtualizadas
  INTEGRACOES: 1 << 4, // integracaoAtualizada
  WEBHOOKS: 1 << 5, // webhooksAtualizados
  CONVITES: 1 << 6, // conviteCriado / conviteDeletado
  ESTADOS_DE_VOZ: 1 << 7, // entrouNoVoz / saiuDoVoz / mudouDeCanalVoz
  PRESENCAS: 1 << 8, // privilegiada — presencaAtualizada
  MENSAGENS_DO_SERVIDOR: 1 << 9,
  REACOES_DE_MENSAGEM: 1 << 10,
  DIGITANDO_NO_SERVIDOR: 1 << 11, // evento "digitando" em canal de servidor
  MENSAGENS_DIRETAS: 1 << 12,
  DIGITANDO_EM_DM: 1 << 14,
  CONTEUDO_DE_MENSAGEM: 1 << 15, // privilegiada
  EVENTOS_AGENDADOS: 1 << 16, // eventoAgendadoCriado/Atualizado/Deletado + interesse
  CONFIGURACAO_AUTOMOD: 1 << 20, // automodRegraCriada/Atualizada/Deletada
  EXECUCAO_AUTOMOD: 1 << 21, // automodAcaoExecutada
  ENQUETES_DO_SERVIDOR: 1 << 24, // votoEnqueteAdicionado/Removido em servidor
  ENQUETES_DIRETAS: 1 << 25, // votoEnqueteAdicionado/Removido em DM
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
