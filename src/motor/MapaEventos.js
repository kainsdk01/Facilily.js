/**
 * Traduz eventos DISPATCH do gateway da Discord em eventos da facility.js.
 *
 * Cada entrada tem:
 *   - evento: o nome que aparece em bot.on('...') e em eventos/nome.txt
 *   - construir(dados): retorna { mensagem, extras }
 *
 * "mensagem" segue o MESMO formato usado por MESSAGE_CREATE (autor, canalId,
 * servidorId, id, mencoes), então TODAS as tags que já existem hoje
 * (#nomeAutor[], #idAutor[], #mencaoAutor[], #idCanal[], #idServidor[],
 * #avatarAutor[], #dataCriacaoConta[], #ehDono[], etc.) já funcionam de
 * graça em qualquer evento novo, sem precisar reescrever nada.
 *
 * "extras" é um objeto simples só com strings/números, lido pela tag
 * genérica #evento[chave] (ex: #evento[nomeCargo]) e por algumas tags de
 * atalho. Veja a tabela completa no README.
 */

const USUARIO_VAZIO = { id: '', username: '', bot: false };

function usuario(u) {
  return u ?? USUARIO_VAZIO;
}

// Monta o formato "mensagem" reaproveitado por todas as tags existentes.
function msg(autor, canalId, servidorId, id = null) {
  return {
    autor: usuario(autor),
    canalId: canalId ?? null,
    servidorId: servidorId ?? null,
    id,
    conteudo: null,
    mencoes: [],
  };
}

function paraTexto(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor);
}

const MAPA_EVENTOS = {
  // ---- Membros ----
  GUILD_MEMBER_ADD: {
    evento: 'membroEntrou',
    construir: (d) => ({
      mensagem: msg(d.user, null, d.guild_id),
      extras: {
        apelido: paraTexto(d.nick),
        cargos: (d.roles ?? []).join(','),
        dataEntrada: paraTexto(d.joined_at),
      },
    }),
  },
  GUILD_MEMBER_REMOVE: {
    evento: 'membroSaiu',
    construir: (d) => ({ mensagem: msg(d.user, null, d.guild_id), extras: {} }),
  },
  GUILD_MEMBER_UPDATE: {
    evento: 'membroAtualizado',
    construir: (d) => ({
      mensagem: msg(d.user, null, d.guild_id),
      extras: {
        apelido: paraTexto(d.nick),
        cargos: (d.roles ?? []).join(','),
        estaBoostando: paraTexto(Boolean(d.premium_since)),
      },
    }),
  },
  GUILD_BAN_ADD: {
    evento: 'membroBanido',
    construir: (d) => ({ mensagem: msg(d.user, null, d.guild_id), extras: {} }),
  },
  GUILD_BAN_REMOVE: {
    evento: 'membroDesbanido',
    construir: (d) => ({ mensagem: msg(d.user, null, d.guild_id), extras: {} }),
  },
  PRESENCE_UPDATE: {
    evento: 'presencaAtualizada',
    construir: (d) => ({
      mensagem: msg(d.user, null, d.guild_id),
      extras: {
        status: paraTexto(d.status),
        atividade: paraTexto(d.activities?.[0]?.name),
      },
    }),
  },
  TYPING_START: {
    evento: 'digitando',
    construir: (d) => ({
      mensagem: msg(d.member?.user, d.channel_id, d.guild_id),
      extras: { timestamp: paraTexto(d.timestamp) },
    }),
  },

  // ---- Mensagens ----
  MESSAGE_UPDATE: {
    evento: 'mensagemEditada',
    construir: (d) => ({
      mensagem: msg(d.author, d.channel_id, d.guild_id, d.id),
      extras: { conteudo: paraTexto(d.content) },
    }),
  },
  MESSAGE_DELETE: {
    evento: 'mensagemDeletada',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id, d.id),
      extras: { idMensagem: paraTexto(d.id) },
    }),
  },
  MESSAGE_DELETE_BULK: {
    evento: 'mensagensDeletadasEmMassa',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id),
      extras: { quantidade: paraTexto(d.ids?.length ?? 0), ids: (d.ids ?? []).join(',') },
    }),
  },
  CHANNEL_PINS_UPDATE: {
    evento: 'canalPinsAtualizado',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id),
      extras: { ultimoPin: paraTexto(d.last_pin_timestamp) },
    }),
  },

  // ---- Reações ----
  MESSAGE_REACTION_ADD: {
    evento: 'reacaoAdicionada',
    construir: (d) => ({
      mensagem: msg(d.member?.user ?? { id: d.user_id }, d.channel_id, d.guild_id, d.message_id),
      extras: { emoji: paraTexto(d.emoji?.name), idEmoji: paraTexto(d.emoji?.id) },
    }),
  },
  MESSAGE_REACTION_REMOVE: {
    evento: 'reacaoRemovida',
    construir: (d) => ({
      mensagem: msg({ id: d.user_id }, d.channel_id, d.guild_id, d.message_id),
      extras: { emoji: paraTexto(d.emoji?.name), idEmoji: paraTexto(d.emoji?.id) },
    }),
  },
  MESSAGE_REACTION_REMOVE_ALL: {
    evento: 'todasReacoesRemovidas',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id, d.message_id),
      extras: {},
    }),
  },
  MESSAGE_REACTION_REMOVE_EMOJI: {
    evento: 'reacaoEmojiRemovida',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id, d.message_id),
      extras: { emoji: paraTexto(d.emoji?.name) },
    }),
  },

  // ---- Cargos ----
  GUILD_ROLE_CREATE: {
    evento: 'cargoCriado',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: {
        idCargo: paraTexto(d.role?.id),
        nomeCargo: paraTexto(d.role?.name),
        corCargo: paraTexto(d.role?.color),
      },
    }),
  },
  GUILD_ROLE_UPDATE: {
    evento: 'cargoAtualizado',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: {
        idCargo: paraTexto(d.role?.id),
        nomeCargo: paraTexto(d.role?.name),
        corCargo: paraTexto(d.role?.color),
      },
    }),
  },
  GUILD_ROLE_DELETE: {
    evento: 'cargoDeletado',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: { idCargo: paraTexto(d.role_id) },
    }),
  },

  // ---- Canais / Threads ----
  CHANNEL_CREATE: {
    evento: 'canalCriado',
    construir: (d) => ({
      mensagem: msg(null, d.id, d.guild_id),
      extras: { nomeCanal: paraTexto(d.name), tipoCanal: paraTexto(d.type) },
    }),
  },
  CHANNEL_UPDATE: {
    evento: 'canalAtualizado',
    construir: (d) => ({
      mensagem: msg(null, d.id, d.guild_id),
      extras: { nomeCanal: paraTexto(d.name), tipoCanal: paraTexto(d.type) },
    }),
  },
  CHANNEL_DELETE: {
    evento: 'canalDeletado',
    construir: (d) => ({
      mensagem: msg(null, d.id, d.guild_id),
      extras: { nomeCanal: paraTexto(d.name), tipoCanal: paraTexto(d.type) },
    }),
  },
  THREAD_CREATE: {
    evento: 'threadCriada',
    construir: (d) => ({
      mensagem: msg(null, d.id, d.guild_id),
      extras: { nomeThread: paraTexto(d.name), idCanalPai: paraTexto(d.parent_id) },
    }),
  },
  THREAD_UPDATE: {
    evento: 'threadAtualizada',
    construir: (d) => ({
      mensagem: msg(null, d.id, d.guild_id),
      extras: { nomeThread: paraTexto(d.name), idCanalPai: paraTexto(d.parent_id) },
    }),
  },
  THREAD_DELETE: {
    evento: 'threadDeletada',
    construir: (d) => ({
      mensagem: msg(null, d.id, d.guild_id),
      extras: { idCanalPai: paraTexto(d.parent_id) },
    }),
  },
  THREAD_MEMBERS_UPDATE: {
    evento: 'threadMembrosAtualizados',
    construir: (d) => ({
      mensagem: msg(null, d.id, d.guild_id),
      extras: { totalMembrosThread: paraTexto(d.member_count ?? 0) },
    }),
  },

  // ---- Convites ----
  INVITE_CREATE: {
    evento: 'conviteCriado',
    construir: (d) => ({
      mensagem: msg(d.inviter, d.channel_id, d.guild_id),
      extras: { codigoConvite: paraTexto(d.code) },
    }),
  },
  INVITE_DELETE: {
    evento: 'conviteDeletado',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id),
      extras: { codigoConvite: paraTexto(d.code) },
    }),
  },

  // ---- Emojis / Figurinhas ----
  GUILD_EMOJIS_UPDATE: {
    evento: 'emojisAtualizados',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: { quantidadeEmojis: paraTexto(d.emojis?.length ?? 0) },
    }),
  },
  GUILD_STICKERS_UPDATE: {
    evento: 'figurinhasAtualizadas',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: { quantidadeFigurinhas: paraTexto(d.stickers?.length ?? 0) },
    }),
  },

  // ---- Integrações / Webhooks ----
  GUILD_INTEGRATIONS_UPDATE: {
    evento: 'integracaoAtualizada',
    construir: (d) => ({ mensagem: msg(null, null, d.guild_id), extras: {} }),
  },
  WEBHOOKS_UPDATE: {
    evento: 'webhooksAtualizados',
    construir: (d) => ({ mensagem: msg(null, d.channel_id, d.guild_id), extras: {} }),
  },

  // ---- AutoMod ----
  AUTO_MODERATION_RULE_CREATE: {
    evento: 'automodRegraCriada',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: { idRegra: paraTexto(d.id), nomeRegra: paraTexto(d.name) },
    }),
  },
  AUTO_MODERATION_RULE_UPDATE: {
    evento: 'automodRegraAtualizada',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: { idRegra: paraTexto(d.id), nomeRegra: paraTexto(d.name) },
    }),
  },
  AUTO_MODERATION_RULE_DELETE: {
    evento: 'automodRegraDeletada',
    construir: (d) => ({
      mensagem: msg(null, null, d.guild_id),
      extras: { idRegra: paraTexto(d.id), nomeRegra: paraTexto(d.name) },
    }),
  },
  AUTO_MODERATION_ACTION_EXECUTION: {
    evento: 'automodAcaoExecutada',
    construir: (d) => ({
      mensagem: msg({ id: d.user_id }, d.channel_id, d.guild_id, d.message_id),
      extras: {
        idRegra: paraTexto(d.rule_id),
        palavraDetectada: paraTexto(d.matched_keyword),
        conteudoDetectado: paraTexto(d.matched_content),
      },
    }),
  },

  // ---- Eventos agendados ----
  GUILD_SCHEDULED_EVENT_CREATE: {
    evento: 'eventoAgendadoCriado',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id),
      extras: { idEventoAgendado: paraTexto(d.id), nomeEventoAgendado: paraTexto(d.name) },
    }),
  },
  GUILD_SCHEDULED_EVENT_UPDATE: {
    evento: 'eventoAgendadoAtualizado',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id),
      extras: { idEventoAgendado: paraTexto(d.id), nomeEventoAgendado: paraTexto(d.name) },
    }),
  },
  GUILD_SCHEDULED_EVENT_DELETE: {
    evento: 'eventoAgendadoDeletado',
    construir: (d) => ({
      mensagem: msg(null, d.channel_id, d.guild_id),
      extras: { idEventoAgendado: paraTexto(d.id), nomeEventoAgendado: paraTexto(d.name) },
    }),
  },
  GUILD_SCHEDULED_EVENT_USER_ADD: {
    evento: 'usuarioInteressadoEvento',
    construir: (d) => ({
      mensagem: msg({ id: d.user_id }, null, d.guild_id),
      extras: { idEventoAgendado: paraTexto(d.guild_scheduled_event_id) },
    }),
  },
  GUILD_SCHEDULED_EVENT_USER_REMOVE: {
    evento: 'usuarioDesinteressadoEvento',
    construir: (d) => ({
      mensagem: msg({ id: d.user_id }, null, d.guild_id),
      extras: { idEventoAgendado: paraTexto(d.guild_scheduled_event_id) },
    }),
  },

  // ---- Enquetes ----
  MESSAGE_POLL_VOTE_ADD: {
    evento: 'votoEnqueteAdicionado',
    construir: (d) => ({
      mensagem: msg({ id: d.user_id }, d.channel_id, d.guild_id, d.message_id),
      extras: { idResposta: paraTexto(d.answer_id) },
    }),
  },
  MESSAGE_POLL_VOTE_REMOVE: {
    evento: 'votoEnqueteRemovido',
    construir: (d) => ({
      mensagem: msg({ id: d.user_id }, d.channel_id, d.guild_id, d.message_id),
      extras: { idResposta: paraTexto(d.answer_id) },
    }),
  },
};

module.exports = { MAPA_EVENTOS, msg, paraTexto };
