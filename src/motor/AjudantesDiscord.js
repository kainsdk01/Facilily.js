const EPOCA_DISCORD = 1420070400000n;

function dataDoSnowflake(id) {
  const timestampMs = (BigInt(id) >> 22n) + EPOCA_DISCORD;
  return new Date(Number(timestampMs));
}

// Se não passar um alvo, usa quem executou o comando.
function resolverAlvo(args, indice, ctx) {
  return args[indice] || ctx.mensagem.autor.id;
}

function cabecalhoMotivo(motivo) {
  return motivo ? { 'X-Audit-Log-Reason': motivo } : {};
}

function servidorCache(ctx) {
  return ctx.cliente.servidores.get(ctx.mensagem.servidorId);
}

// Bits de permissão da Discord (BigInt porque passam de 32 bits).
// Nomes em português pra usar direto nas tags: #temPermissao[usuario;BANIR_MEMBROS]
const PERMISSOES = {
  CRIAR_CONVITE: 1n << 0n,
  EXPULSAR_MEMBROS: 1n << 1n,
  BANIR_MEMBROS: 1n << 2n,
  ADMINISTRADOR: 1n << 3n,
  GERENCIAR_CANAIS: 1n << 4n,
  GERENCIAR_SERVIDOR: 1n << 5n,
  ADICIONAR_REACOES: 1n << 6n,
  VER_AUDITORIA: 1n << 7n,
  VER_CANAL: 1n << 10n,
  ENVIAR_MENSAGENS: 1n << 11n,
  GERENCIAR_MENSAGENS: 1n << 13n,
  INCORPORAR_LINKS: 1n << 14n,
  ANEXAR_ARQUIVOS: 1n << 15n,
  LER_HISTORICO: 1n << 16n,
  MENCIONAR_EVERYONE: 1n << 17n,
  CONECTAR_VOZ: 1n << 20n,
  FALAR_VOZ: 1n << 21n,
  SILENCIAR_MEMBROS: 1n << 22n,
  ENSURDECER_MEMBROS: 1n << 23n,
  MOVER_MEMBROS: 1n << 24n,
  ALTERAR_APELIDO: 1n << 26n,
  GERENCIAR_APELIDOS: 1n << 27n,
  GERENCIAR_CARGOS: 1n << 28n,
  GERENCIAR_WEBHOOKS: 1n << 29n,
  GERENCIAR_EMOJIS: 1n << 30n,
  GERENCIAR_EVENTOS: 1n << 33n,
  GERENCIAR_THREADS: 1n << 34n,
  MODERAR_MEMBROS: 1n << 40n,
};

// Soma as permissões de todos os cargos que o membro possui (inclui @everyone).
function calcularPermissoesBase(servidor, cargosIds) {
  if (!servidor?.roles) return 0n;
  let total = 0n;
  for (const cargo of servidor.roles) {
    if (cargo.id === servidor.id || cargosIds.includes(cargo.id)) {
      total |= BigInt(cargo.permissions ?? 0);
    }
  }
  return total;
}

function temPermissaoBit(permissoesBase, bit) {
  return (permissoesBase & PERMISSOES.ADMINISTRADOR) === PERMISSOES.ADMINISTRADOR || (permissoesBase & bit) === bit;
}

// Busca o membro pela API (não confia em cache, sempre atualizado).
// Devolve null se o usuário não é membro do servidor.
async function buscarMembro(ctx, usuarioId) {
  try {
    return await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/members/${usuarioId}`);
  } catch {
    return null;
  }
}

module.exports = {
  dataDoSnowflake,
  resolverAlvo,
  cabecalhoMotivo,
  servidorCache,
  PERMISSOES,
  calcularPermissoesBase,
  temPermissaoBit,
  buscarMembro,
};
