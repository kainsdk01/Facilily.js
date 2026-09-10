const { registrar } = require('./RegistroFuncoes');
const { servidorCache } = require('./AjudantesDiscord');

const LIMITE_EMOJIS_POR_TIER = { 0: 50, 1: 100, 2: 150, 3: 250 };
const LIMITE_UPLOAD_MB_POR_TIER = { 0: 25, 1: 25, 2: 50, 3: 100 };

// #nivelVerificacaoServidor[] -> "0" a "4"
registrar('nivelVerificacaoServidor', (_args, ctx) => String(servidorCache(ctx)?.verification_level ?? 0));

// #definirNivelVerificacaoServidor[nivel] -> 0=nenhum, 1=baixo, 2=médio, 3=alto, 4=muito alto
registrar('definirNivelVerificacaoServidor', async (args, ctx) => {
  const nivel = Number(args[0]);
  if (Number.isNaN(nivel) || nivel < 0 || nivel > 4) {
    return '⚠️ Uso: `#definirNivelVerificacaoServidor[0 a 4]`';
  }
  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}`, { verification_level: nivel });
    return '✅ Nível de verificação atualizado.';
  } catch (erro) {
    return `❌ Não consegui atualizar: ${erro.message}`;
  }
});

// #bannerServidor[] -> URL, vazio se o servidor não tiver banner
registrar('bannerServidor', (_args, ctx) => {
  const servidor = servidorCache(ctx);
  if (!servidor?.banner) return '';
  return `https://cdn.discordapp.com/banners/${servidor.id}/${servidor.banner}.png?size=1024`;
});

// #iconeServidor[] -> URL, vazio se não tiver ícone
registrar('iconeServidor', (_args, ctx) => {
  const servidor = servidorCache(ctx);
  if (!servidor?.icon) return '';
  return `https://cdn.discordapp.com/icons/${servidor.id}/${servidor.icon}.png?size=512`;
});

// #descricaoServidor[] -> texto da descrição pública (servidores Community)
registrar('descricaoServidor', (_args, ctx) => servidorCache(ctx)?.description ?? '');

// #urlConviteVanity[] -> código vanity do servidor (parceiro/verificado), vazio se não tiver
registrar('urlConviteVanity', (_args, ctx) => servidorCache(ctx)?.vanity_url_code ?? '');

// #servidorEhCommunity[] -> "true"/"false"
registrar('servidorEhCommunity', (_args, ctx) => {
  const servidor = servidorCache(ctx);
  return String(Boolean(servidor?.features?.includes('COMMUNITY')));
});

// #recursosServidor[] -> lista de features (PARTNERED, VERIFIED, COMMUNITY...) separadas por vírgula
registrar('recursosServidor', (_args, ctx) => (servidorCache(ctx)?.features ?? []).join(','));

// #limiteEmojisServidor[] -> quantidade máxima de emojis permitida pro tier de boost atual
registrar('limiteEmojisServidor', (_args, ctx) => {
  const tier = servidorCache(ctx)?.premium_tier ?? 0;
  return String(LIMITE_EMOJIS_POR_TIER[tier] ?? 50);
});

// #limiteUploadServidor[] -> tamanho máximo de arquivo (MB) pro tier de boost atual
registrar('limiteUploadServidor', (_args, ctx) => {
  const tier = servidorCache(ctx)?.premium_tier ?? 0;
  return String(LIMITE_UPLOAD_MB_POR_TIER[tier] ?? 25);
});

// #totalThreadsAtivas[] -> quantidade de threads ativas no servidor
registrar('totalThreadsAtivas', async (_args, ctx) => {
  try {
    const resultado = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/threads/active`);
    return String(resultado.threads?.length ?? 0);
  } catch {
    return '0';
  }
});

module.exports = {};
