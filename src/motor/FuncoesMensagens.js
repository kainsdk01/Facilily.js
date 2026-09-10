const { registrar } = require('./RegistroFuncoes');

// #buscarMensagem[idCanal;idMensagem] -> conteúdo de texto da mensagem
registrar('buscarMensagem', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return '⚠️ Uso: `#buscarMensagem[idCanal;idMensagem]`';
  try {
    const mensagem = await ctx.cliente.rest.get(`/channels/${idCanal}/messages/${idMensagem}`);
    return mensagem.content ?? '';
  } catch (erro) {
    return `❌ Não consegui buscar a mensagem: ${erro.message}`;
  }
});

// #autorDaMensagem[idCanal;idMensagem] -> id do autor
registrar('autorDaMensagem', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return '⚠️ Uso: `#autorDaMensagem[idCanal;idMensagem]`';
  try {
    const mensagem = await ctx.cliente.rest.get(`/channels/${idCanal}/messages/${idMensagem}`);
    return mensagem.author?.id ?? '';
  } catch {
    return '';
  }
});

// #mensagemEstaFixada[idCanal;idMensagem] -> "true"/"false"
registrar('mensagemEstaFixada', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return 'false';
  try {
    const mensagem = await ctx.cliente.rest.get(`/channels/${idCanal}/messages/${idMensagem}`);
    return String(Boolean(mensagem.pinned));
  } catch {
    return 'false';
  }
});

// #anexosMensagem[idCanal;idMensagem] -> URLs separadas por vírgula
registrar('anexosMensagem', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return '';
  try {
    const mensagem = await ctx.cliente.rest.get(`/channels/${idCanal}/messages/${idMensagem}`);
    return (mensagem.attachments ?? []).map((a) => a.url).join(',');
  } catch {
    return '';
  }
});

// #fixarMensagem[idCanal;idMensagem]
registrar('fixarMensagem', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return '⚠️ Uso: `#fixarMensagem[idCanal;idMensagem]`';
  try {
    await ctx.cliente.rest.put(`/channels/${idCanal}/pins/${idMensagem}`, {});
    return '📌 Mensagem fixada.';
  } catch (erro) {
    return `❌ Não consegui fixar: ${erro.message}`;
  }
});

// #desafixarMensagem[idCanal;idMensagem]
registrar('desafixarMensagem', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return '⚠️ Uso: `#desafixarMensagem[idCanal;idMensagem]`';
  try {
    await ctx.cliente.rest.deletar(`/channels/${idCanal}/pins/${idMensagem}`);
    return '✅ Mensagem desafixada.';
  } catch (erro) {
    return `❌ Não consegui desafixar: ${erro.message}`;
  }
});

// #totalMensagensFixadas[idCanal]
registrar('totalMensagensFixadas', async (args, ctx) => {
  const idCanal = args[0];
  if (!idCanal) return '0';
  try {
    const pins = await ctx.cliente.rest.get(`/channels/${idCanal}/pins`);
    return String(pins.length);
  } catch {
    return '0';
  }
});

// #editarMensagemBot[idCanal;idMensagem;novoTexto] -> só funciona em mensagens do próprio bot
registrar('editarMensagemBot', async (args, ctx) => {
  const [idCanal, idMensagem, novoTexto] = args;
  if (!idCanal || !idMensagem) return '⚠️ Uso: `#editarMensagemBot[idCanal;idMensagem;novoTexto]`';
  try {
    await ctx.cliente.rest.patch(`/channels/${idCanal}/messages/${idMensagem}`, { content: novoTexto ?? '' });
    return '✅ Mensagem editada.';
  } catch (erro) {
    return `❌ Não consegui editar: ${erro.message}`;
  }
});

// #deletarMensagem[idCanal;idMensagem]
registrar('deletarMensagem', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return '⚠️ Uso: `#deletarMensagem[idCanal;idMensagem]`';
  try {
    await ctx.cliente.rest.deletar(`/channels/${idCanal}/messages/${idMensagem}`);
    return '🗑️ Mensagem deletada.';
  } catch (erro) {
    return `❌ Não consegui deletar: ${erro.message}`;
  }
});

// #totalReacoesMensagem[idCanal;idMensagem;emoji]
registrar('totalReacoesMensagem', async (args, ctx) => {
  const [idCanal, idMensagem, emoji] = args;
  if (!idCanal || !idMensagem || !emoji) return '0';
  try {
    const mensagem = await ctx.cliente.rest.get(`/channels/${idCanal}/messages/${idMensagem}`);
    const reacao = mensagem.reactions?.find((r) => r.emoji.name === emoji);
    return String(reacao?.count ?? 0);
  } catch {
    return '0';
  }
});

// #quemReagiu[idCanal;idMensagem;emoji] -> ids separados por vírgula
registrar('quemReagiu', async (args, ctx) => {
  const [idCanal, idMensagem, emoji] = args;
  if (!idCanal || !idMensagem || !emoji) return '';
  try {
    const usuarios = await ctx.cliente.rest.get(
      `/channels/${idCanal}/messages/${idMensagem}/reactions/${encodeURIComponent(emoji)}`
    );
    return usuarios.map((u) => u.id).join(',');
  } catch {
    return '';
  }
});

// #removerReacao[idCanal;idMensagem;emoji;idUsuario]
registrar('removerReacao', async (args, ctx) => {
  const [idCanal, idMensagem, emoji, idUsuario] = args;
  if (!idCanal || !idMensagem || !emoji || !idUsuario) {
    return '⚠️ Uso: `#removerReacao[idCanal;idMensagem;emoji;idUsuario]`';
  }
  try {
    await ctx.cliente.rest.deletar(
      `/channels/${idCanal}/messages/${idMensagem}/reactions/${encodeURIComponent(emoji)}/${idUsuario}`
    );
    return '✅ Reação removida.';
  } catch (erro) {
    return `❌ Não consegui remover a reação: ${erro.message}`;
  }
});

// #limparReacoes[idCanal;idMensagem] -> remove TODAS as reações da mensagem
registrar('limparReacoes', async (args, ctx) => {
  const [idCanal, idMensagem] = args;
  if (!idCanal || !idMensagem) return '⚠️ Uso: `#limparReacoes[idCanal;idMensagem]`';
  try {
    await ctx.cliente.rest.deletar(`/channels/${idCanal}/messages/${idMensagem}/reactions`);
    return '🧹 Reações limpas.';
  } catch (erro) {
    return `❌ Não consegui limpar: ${erro.message}`;
  }
});

// #buscarUltimasMensagens[idCanal;quantidade] -> conteúdos separados por " | "
registrar('buscarUltimasMensagens', async (args, ctx) => {
  const idCanal = args[0];
  const quantidade = Math.min(Number(args[1]) || 5, 50);
  if (!idCanal) return '⚠️ Uso: `#buscarUltimasMensagens[idCanal;quantidade]`';
  try {
    const mensagens = await ctx.cliente.rest.get(`/channels/${idCanal}/messages?limit=${quantidade}`);
    return mensagens.map((m) => m.content || '[sem texto]').join(' | ');
  } catch (erro) {
    return `❌ Não consegui buscar: ${erro.message}`;
  }
});

module.exports = {};
