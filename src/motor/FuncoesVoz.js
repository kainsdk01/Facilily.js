const { registrar } = require('./RegistroFuncoes');
const { resolverAlvo, servidorCache } = require('./AjudantesDiscord');

function estadoVozDoUsuario(ctx, usuarioId) {
  const servidor = servidorCache(ctx);
  return servidor?.voice_states?.find((v) => v.user_id === usuarioId) ?? null;
}

// #estaEmVoz[idOuMencao] -> "true"/"false"
registrar('estaEmVoz', (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  return String(Boolean(estadoVozDoUsuario(ctx, alvo)?.channel_id));
});

// #canalVozAtual[idOuMencao] -> id do canal de voz, vazio se não estiver em nenhum
registrar('canalVozAtual', (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  return estadoVozDoUsuario(ctx, alvo)?.channel_id ?? '';
});

// #totalUsuariosEmVoz[idCanal]
registrar('totalUsuariosEmVoz', (args, ctx) => {
  const idCanal = args[0];
  if (!idCanal) return '0';
  const servidor = servidorCache(ctx);
  const total = (servidor?.voice_states ?? []).filter((v) => v.channel_id === idCanal).length;
  return String(total);
});

// #moverParaCanalVoz[idOuMencao;idCanalVoz] -> arrasta o usuário pra outro canal de voz
registrar('moverParaCanalVoz', async (args, ctx) => {
  const alvo = args[0];
  const idCanalVoz = args[1];
  if (!alvo || !idCanalVoz) return '⚠️ Uso: `#moverParaCanalVoz[idOuMencao;idCanalVoz]`';
  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/members/${alvo}`, {
      channel_id: idCanalVoz,
    });
    return '✅ Usuário movido.';
  } catch (erro) {
    return `❌ Não consegui mover: ${erro.message}`;
  }
});

// #desconectarDeVoz[idOuMencao]
registrar('desconectarDeVoz', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/members/${alvo}`, {
      channel_id: null,
    });
    return '✅ Usuário desconectado da voz.';
  } catch (erro) {
    return `❌ Não consegui desconectar: ${erro.message}`;
  }
});

module.exports = {};
