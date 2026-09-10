const { registrar } = require('./RegistroFuncoes');
const { servidorCache } = require('./AjudantesDiscord');

function acharEmoji(ctx, nomeOuId) {
  return servidorCache(ctx)?.emojis?.find((e) => e.id === nomeOuId || e.name === nomeOuId);
}

// #existeEmoji[nomeOuId] -> "true"/"false"
registrar('existeEmoji', (args, ctx) => String(Boolean(acharEmoji(ctx, args[0]))));

// #urlEmoji[nomeOuId] -> URL da imagem do emoji customizado
registrar('urlEmoji', (args, ctx) => {
  const emoji = acharEmoji(ctx, args[0]);
  if (!emoji) return '';
  const extensao = emoji.animated ? 'gif' : 'png';
  return `https://cdn.discordapp.com/emojis/${emoji.id}.${extensao}`;
});

// #criarEmoji[nome;urlImagemBase64] -> a Discord exige a imagem em base64 (data URI), devolve o ID
registrar('criarEmoji', async (args, ctx) => {
  const [nome, imagemBase64] = args;
  if (!nome || !imagemBase64) return '⚠️ Uso: `#criarEmoji[nome;dataUriDaImagem]`';
  try {
    const emoji = await ctx.cliente.rest.post(`/guilds/${ctx.mensagem.servidorId}/emojis`, {
      name: nome,
      image: imagemBase64,
    });
    return emoji.id;
  } catch (erro) {
    return `❌ Não consegui criar o emoji: ${erro.message}`;
  }
});

// #deletarEmoji[idEmoji]
registrar('deletarEmoji', async (args, ctx) => {
  const idEmoji = args[0];
  if (!idEmoji) return '⚠️ Uso: `#deletarEmoji[idEmoji]`';
  try {
    await ctx.cliente.rest.deletar(`/guilds/${ctx.mensagem.servidorId}/emojis/${idEmoji}`);
    return '🗑️ Emoji deletado.';
  } catch (erro) {
    return `❌ Não consegui deletar: ${erro.message}`;
  }
});

// #listarStickers[] -> "nome(id), nome(id), ..."
registrar('listarStickers', async (_args, ctx) => {
  try {
    const stickers = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/stickers`);
    if (stickers.length === 0) return 'Nenhum sticker.';
    return stickers.map((s) => `${s.name}(${s.id})`).join(', ');
  } catch (erro) {
    return `❌ Não consegui listar: ${erro.message}`;
  }
});

// #deletarSticker[idSticker]
registrar('deletarSticker', async (args, ctx) => {
  const idSticker = args[0];
  if (!idSticker) return '⚠️ Uso: `#deletarSticker[idSticker]`';
  try {
    await ctx.cliente.rest.deletar(`/guilds/${ctx.mensagem.servidorId}/stickers/${idSticker}`);
    return '🗑️ Sticker deletado.';
  } catch (erro) {
    return `❌ Não consegui deletar: ${erro.message}`;
  }
});

// #criarWebhook[idCanal;nome] -> devolve a URL completa do webhook (guarde com cuidado!)
registrar('criarWebhook', async (args, ctx) => {
  const [idCanal, nome] = args;
  if (!idCanal || !nome) return '⚠️ Uso: `#criarWebhook[idCanal;nome]`';
  try {
    const webhook = await ctx.cliente.rest.post(`/channels/${idCanal}/webhooks`, { name: nome });
    return `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;
  } catch (erro) {
    return `❌ Não consegui criar o webhook: ${erro.message}`;
  }
});

// #deletarWebhook[idWebhook]
registrar('deletarWebhook', async (args, ctx) => {
  const idWebhook = args[0];
  if (!idWebhook) return '⚠️ Uso: `#deletarWebhook[idWebhook]`';
  try {
    await ctx.cliente.rest.deletar(`/webhooks/${idWebhook}`);
    return '🗑️ Webhook deletado.';
  } catch (erro) {
    return `❌ Não consegui deletar: ${erro.message}`;
  }
});

// #enviarWebhook[urlWebhook;texto;nomeExibido] -> manda mensagem por um webhook (sem usar o token do bot)
registrar('enviarWebhook', async (args) => {
  const [url, texto, nomeExibido] = args;
  if (!url || !texto) return '⚠️ Uso: `#enviarWebhook[urlWebhook;texto;nomeExibido]`';
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: texto, username: nomeExibido || undefined }),
    });
    if (!resposta.ok) throw new Error(`status ${resposta.status}`);
    return '✅ Mensagem enviada pelo webhook.';
  } catch (erro) {
    return `❌ Não consegui enviar: ${erro.message}`;
  }
});

module.exports = {};
