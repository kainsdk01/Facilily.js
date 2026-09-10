const { registrar } = require('./RegistroFuncoes');
const { servidorCache, cabecalhoMotivo } = require('./AjudantesDiscord');

const TIPOS_CANAL = {
  0: 'texto',
  2: 'voz',
  4: 'categoria',
  5: 'anuncio',
  13: 'palco',
  15: 'forum',
};

function acharCanal(ctx, idCanal) {
  return servidorCache(ctx)?.channels?.find((c) => c.id === idCanal);
}

// #existeCanal[idCanal] -> "true"/"false"
registrar('existeCanal', (args, ctx) => String(Boolean(acharCanal(ctx, args[0]))));

// #tipoCanal[idCanal] -> "texto" | "voz" | "categoria" | "anuncio" | "palco" | "forum"
registrar('tipoCanal', (args, ctx) => {
  const canal = acharCanal(ctx, args[0]);
  return canal ? (TIPOS_CANAL[canal.type] ?? `desconhecido(${canal.type})`) : '';
});

// #canalENsfw[idCanal] -> "true"/"false"
registrar('canalENsfw', (args, ctx) => String(Boolean(acharCanal(ctx, args[0])?.nsfw)));

// #categoriaDoCanal[idCanal] -> id da categoria pai, vazio se não tiver
registrar('categoriaDoCanal', (args, ctx) => acharCanal(ctx, args[0])?.parent_id ?? '');

// #canaisDaCategoria[idCategoria] -> ids separados por vírgula
registrar('canaisDaCategoria', (args, ctx) => {
  const servidor = servidorCache(ctx);
  const lista = (servidor?.channels ?? []).filter((c) => c.parent_id === args[0]);
  return lista.map((c) => c.id).join(',');
});

// #topicoCanal[idCanal]
registrar('topicoCanal', (args, ctx) => acharCanal(ctx, args[0])?.topic ?? '');

// #limiteUsuariosVoz[idCanal] -> "0" = sem limite
registrar('limiteUsuariosVoz', (args, ctx) => String(acharCanal(ctx, args[0])?.user_limit ?? 0));

// #bitrateCanalVoz[idCanal]
registrar('bitrateCanalVoz', (args, ctx) => String(acharCanal(ctx, args[0])?.bitrate ?? 0));

// #mencaoCanal[idCanal] -> "<#id>"
registrar('mencaoCanal', (args) => (args[0] ? `<#${args[0]}>` : ''));

// #definirTopico[idCanal;texto]
registrar('definirTopico', async (args, ctx) => {
  const idCanal = args[0];
  const texto = args[1] ?? '';
  if (!idCanal) return '⚠️ Uso: `#definirTopico[idCanal;texto]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idCanal}`, { topic: texto });
    return '✅ Tópico atualizado.';
  } catch (erro) {
    return `❌ Não consegui mudar o tópico: ${erro.message}`;
  }
});

// #definirNsfw[idCanal;true|false]
registrar('definirNsfw', async (args, ctx) => {
  const idCanal = args[0];
  if (!idCanal) return '⚠️ Uso: `#definirNsfw[idCanal;true|false]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idCanal}`, { nsfw: args[1] === 'true' });
    return '✅ NSFW atualizado.';
  } catch (erro) {
    return `❌ Não consegui mudar o NSFW: ${erro.message}`;
  }
});

// #definirLimiteVoz[idCanal;numero]
registrar('definirLimiteVoz', async (args, ctx) => {
  const idCanal = args[0];
  const limite = Number(args[1]);
  if (!idCanal || Number.isNaN(limite)) return '⚠️ Uso: `#definirLimiteVoz[idCanal;numero]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idCanal}`, { user_limit: limite });
    return '✅ Limite atualizado.';
  } catch (erro) {
    return `❌ Não consegui mudar o limite: ${erro.message}`;
  }
});

// #definirRegiaoVoz[idCanal;regiao] -> ex: "brazil", "us-east"; vazio = automático
registrar('definirRegiaoVoz', async (args, ctx) => {
  const idCanal = args[0];
  if (!idCanal) return '⚠️ Uso: `#definirRegiaoVoz[idCanal;regiao]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idCanal}`, { rtc_region: args[1] || null });
    return '✅ Região atualizada.';
  } catch (erro) {
    return `❌ Não consegui mudar a região: ${erro.message}`;
  }
});

// #moverCanal[idCanal;posicao]
registrar('moverCanal', async (args, ctx) => {
  const idCanal = args[0];
  const posicao = Number(args[1]);
  if (!idCanal || Number.isNaN(posicao)) return '⚠️ Uso: `#moverCanal[idCanal;posicao]`';
  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/channels`, [{ id: idCanal, position: posicao }]);
    return '✅ Canal movido.';
  } catch (erro) {
    return `❌ Não consegui mover o canal: ${erro.message}`;
  }
});

// #clonarCanal[idCanal] -> cria uma cópia do canal (nome, tipo, categoria, permissões), devolve o novo ID
registrar('clonarCanal', async (args, ctx) => {
  const idCanal = args[0];
  const canal = acharCanal(ctx, idCanal);
  if (!canal) return '⚠️ Canal não encontrado.';
  try {
    const novo = await ctx.cliente.rest.post(`/guilds/${ctx.mensagem.servidorId}/channels`, {
      name: canal.name,
      type: canal.type,
      parent_id: canal.parent_id,
      topic: canal.topic,
      nsfw: canal.nsfw,
      permission_overwrites: canal.permission_overwrites,
    });
    return novo.id;
  } catch (erro) {
    return `❌ Não consegui clonar o canal: ${erro.message}`;
  }
});

// ---- Threads ----

// #criarThread[idCanal;nome] -> devolve o ID da thread criada
registrar('criarThread', async (args, ctx) => {
  const idCanal = args[0];
  const nome = args[1];
  if (!idCanal || !nome) return '⚠️ Uso: `#criarThread[idCanal;nome]`';
  try {
    const thread = await ctx.cliente.rest.post(`/channels/${idCanal}/threads`, {
      name: nome,
      type: 11, // thread pública
      auto_archive_duration: 1440,
    });
    return thread.id;
  } catch (erro) {
    return `❌ Não consegui criar a thread: ${erro.message}`;
  }
});

// #arquivarThread[idThread]
registrar('arquivarThread', async (args, ctx) => {
  const idThread = args[0];
  if (!idThread) return '⚠️ Uso: `#arquivarThread[idThread]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idThread}`, { archived: true });
    return '✅ Thread arquivada.';
  } catch (erro) {
    return `❌ Não consegui arquivar: ${erro.message}`;
  }
});

// #desarquivarThread[idThread]
registrar('desarquivarThread', async (args, ctx) => {
  const idThread = args[0];
  if (!idThread) return '⚠️ Uso: `#desarquivarThread[idThread]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idThread}`, { archived: false });
    return '✅ Thread reaberta.';
  } catch (erro) {
    return `❌ Não consegui desarquivar: ${erro.message}`;
  }
});

// #trancarThread[idThread] -> só moderadores podem desarquivar depois
registrar('trancarThread', async (args, ctx) => {
  const idThread = args[0];
  if (!idThread) return '⚠️ Uso: `#trancarThread[idThread]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idThread}`, { locked: true, archived: true });
    return '🔒 Thread trancada.';
  } catch (erro) {
    return `❌ Não consegui trancar: ${erro.message}`;
  }
});

// #threadEstaArquivada[idThread] -> "true"/"false"
registrar('threadEstaArquivada', async (args, ctx) => {
  const idThread = args[0];
  if (!idThread) return 'false';
  try {
    const thread = await ctx.cliente.rest.get(`/channels/${idThread}`);
    return String(Boolean(thread.thread_metadata?.archived));
  } catch {
    return 'false';
  }
});

// #adicionarMembroThread[idThread;idUsuario]
registrar('adicionarMembroThread', async (args, ctx) => {
  const idThread = args[0];
  const idUsuario = args[1];
  if (!idThread || !idUsuario) return '⚠️ Uso: `#adicionarMembroThread[idThread;idUsuario]`';
  try {
    await ctx.cliente.rest.put(`/channels/${idThread}/thread-members/${idUsuario}`, {});
    return '✅ Membro adicionado à thread.';
  } catch (erro) {
    return `❌ Não consegui adicionar: ${erro.message}`;
  }
});

// #removerMembroThread[idThread;idUsuario]
registrar('removerMembroThread', async (args, ctx) => {
  const idThread = args[0];
  const idUsuario = args[1];
  if (!idThread || !idUsuario) return '⚠️ Uso: `#removerMembroThread[idThread;idUsuario]`';
  try {
    await ctx.cliente.rest.deletar(`/channels/${idThread}/thread-members/${idUsuario}`);
    return '✅ Membro removido da thread.';
  } catch (erro) {
    return `❌ Não consegui remover: ${erro.message}`;
  }
});

// ---- Permissões por canal ----

// #definirPermissaoCanal[idCanal;idCargoOuUsuario;tipo;permitir;negar]
// tipo: "cargo" ou "usuario". permitir/negar são bits somados (use #temPermissao pra descobrir os nomes,
// aqui é avançado: passe o valor numérico já somado dos bits que você quer).
registrar('definirPermissaoCanal', async (args, ctx) => {
  const [idCanal, idAlvo, tipo, permitir, negar] = args;
  if (!idCanal || !idAlvo || !tipo) {
    return '⚠️ Uso: `#definirPermissaoCanal[idCanal;idCargoOuUsuario;cargo|usuario;permitir;negar]`';
  }
  try {
    await ctx.cliente.rest.put(`/channels/${idCanal}/permissions/${idAlvo}`, {
      type: tipo === 'cargo' ? 0 : 1,
      allow: permitir || '0',
      deny: negar || '0',
    });
    return '✅ Permissão do canal atualizada.';
  } catch (erro) {
    return `❌ Não consegui atualizar a permissão: ${erro.message}`;
  }
});

// #removerPermissaoCanal[idCanal;idCargoOuUsuario]
registrar('removerPermissaoCanal', async (args, ctx) => {
  const [idCanal, idAlvo] = args;
  if (!idCanal || !idAlvo) return '⚠️ Uso: `#removerPermissaoCanal[idCanal;idCargoOuUsuario]`';
  try {
    await ctx.cliente.rest.deletar(`/channels/${idCanal}/permissions/${idAlvo}`, cabecalhoMotivo(args[2]));
    return '✅ Permissão removida.';
  } catch (erro) {
    return `❌ Não consegui remover: ${erro.message}`;
  }
});

module.exports = {};
