const { registrar } = require('./RegistroFuncoes');

const EPOCA_DISCORD = 1420070400000n;

function dataDoSnowflake(id) {
  const timestampMs = (BigInt(id) >> 22n) + EPOCA_DISCORD;
  return new Date(Number(timestampMs));
}

function avatarUrl(usuario) {
  if (!usuario) return '';
  if (usuario.avatar) {
    return `https://cdn.discordapp.com/avatars/${usuario.id}/${usuario.avatar}.png`;
  }
  // Sem avatar customizado: usa um dos avatares padrão da própria Discord.
  const indice = Number(BigInt(usuario.id) % 5n);
  return `https://cdn.discordapp.com/embed/avatars/${indice}.png`;
}

// ---- Avatares ----

registrar('avatarAutor', (_args, ctx) => avatarUrl(ctx.mensagem.autor));

// #avatarMencionado[indice] -> mesmo índice usado em #mencionado[]
registrar('avatarMencionado', (args, ctx) => {
  const indice = Number(args[0] ?? 0);
  return avatarUrl(ctx.mensagem.mencoes[indice]);
});

// ---- Informações do servidor ----
// Vêm direto dos dados que a Discord manda quando o bot conecta (GUILD_CREATE),
// sem precisar de requisição extra.

registrar('nomeServidor', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return servidor?.name ?? '';
});

registrar('totalMembros', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return String(servidor?.member_count ?? 0);
});

registrar('dono', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return servidor?.owner_id ? `<@${servidor.owner_id}>` : '';
});

// #ehDono[] -> "true" ou "false", pra usar dentro de #se[]
registrar('ehDono', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return String(servidor?.owner_id === ctx.mensagem.autor.id);
});

// ---- Conta do usuário ----
// Calculado a partir do próprio ID (snowflake), sem precisar de requisição.

registrar('dataCriacaoConta', (args, ctx) => {
  const alvo = args[0] || ctx.mensagem.autor.id;
  return dataDoSnowflake(alvo).toLocaleDateString('pt-BR');
});

registrar('idadeConta', (args, ctx) => {
  const alvo = args[0] || ctx.mensagem.autor.id;
  const dias = Math.floor((Date.now() - dataDoSnowflake(alvo).getTime()) / 86400000);
  return String(dias);
});

// ---- Mais dados do servidor ----

registrar('totalCargos', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return String(servidor?.roles?.length ?? 0);
});

registrar('totalCanais', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return String(servidor?.channels?.length ?? 0);
});

registrar('totalEmojis', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return String(servidor?.emojis?.length ?? 0);
});

registrar('nivelBoost', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return String(servidor?.premium_tier ?? 0);
});

registrar('totalBoosts', (_args, ctx) => {
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return String(servidor?.premium_subscription_count ?? 0);
});

registrar('nomeCargo', (args, ctx) => {
  const idCargo = args[0];
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return servidor?.roles?.find((cargo) => cargo.id === idCargo)?.name ?? '';
});

registrar('nomeCanal', (args, ctx) => {
  const idCanal = args[0];
  const servidor = ctx.cliente.servidores.get(ctx.mensagem.servidorId);
  return servidor?.channels?.find((canal) => canal.id === idCanal)?.name ?? '';
});

module.exports = {};
